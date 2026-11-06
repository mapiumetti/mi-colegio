/**
 * Conexión directa con Google Drive, Dropbox y OneDrive.
 *
 * Cada nube exige que la app esté registrada en su consola de desarrolladores y
 * entrega un "ID de cliente". Esos IDs se cargan en app.json → expo.extra.cloud.
 * Mientras falte el ID de una nube, esa nube aparece como "pendiente de configurar"
 * y se puede seguir usando el selector de archivos del teléfono y "Compartir".
 *
 * Los archivos se guardan en una carpeta propia de la app dentro de cada nube
 * ("MiColegio" en Drive, "Aplicaciones/Mi Colegio" en Dropbox y OneDrive).
 */
import Constants from 'expo-constants';
import * as AuthSession from 'expo-auth-session';
import { Directory, File } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export type NubeId = 'gdrive' | 'dropbox' | 'onedrive';
export type ArchivoNube = { id: string; nombre: string; tamano?: number; fecha?: string };

type CloudConfig = { googleAndroidClientId?: string; googleIosClientId?: string; dropboxAppKey?: string; onedriveClientId?: string };
const cfg = ((Constants.expoConfig?.extra as { cloud?: CloudConfig } | undefined)?.cloud ?? {}) as CloudConfig;

type Proveedor = {
  nombre: string;
  icono: string;
  clientId: () => string | undefined;
  discovery: AuthSession.DiscoveryDocument;
  scopes: string[];
  redirect: () => string;
  extraParams?: Record<string, string>;
};

const REDIRECT_APP = () => AuthSession.makeRedirectUri({ scheme: 'micolegio', path: 'oauth' });

export const NUBES: Record<NubeId, Proveedor> = {
  gdrive: {
    nombre: 'Google Drive',
    icono: '🟢',
    clientId: () => (Platform.OS === 'ios' ? cfg.googleIosClientId : cfg.googleAndroidClientId),
    discovery: { authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth', tokenEndpoint: 'https://oauth2.googleapis.com/token' },
    scopes: ['https://www.googleapis.com/auth/drive.file'],
    // Google exige como dirección de regreso el identificador de la app.
    redirect: () => AuthSession.makeRedirectUri({ native: 'com.micolegio.app:/oauth2redirect' }),
    extraParams: { access_type: 'offline', prompt: 'consent' },
  },
  dropbox: {
    nombre: 'Dropbox',
    icono: '🔷',
    clientId: () => cfg.dropboxAppKey,
    discovery: { authorizationEndpoint: 'https://www.dropbox.com/oauth2/authorize', tokenEndpoint: 'https://api.dropboxapi.com/oauth2/token' },
    scopes: [],
    redirect: REDIRECT_APP,
    extraParams: { token_access_type: 'offline' },
  },
  onedrive: {
    nombre: 'OneDrive',
    icono: '☁️',
    clientId: () => cfg.onedriveClientId,
    discovery: {
      authorizationEndpoint: 'https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize',
      tokenEndpoint: 'https://login.microsoftonline.com/consumers/oauth2/v2.0/token',
    },
    scopes: ['Files.ReadWrite.AppFolder', 'offline_access', 'User.Read'],
    redirect: REDIRECT_APP,
  },
};

export const nubeConfigurada = (id: NubeId) => !!NUBES[id].clientId();

type Tokens = { accessToken: string; refreshToken?: string; expiresIn?: number; issuedAt: number };
const claveTokens = (id: NubeId) => `cloud-tokens-${id}`;

async function leerTokens(id: NubeId): Promise<Tokens | null> {
  const raw = await SecureStore.getItemAsync(claveTokens(id));
  return raw ? (JSON.parse(raw) as Tokens) : null;
}
const guardarTokens = (id: NubeId, t: Tokens) => SecureStore.setItemAsync(claveTokens(id), JSON.stringify(t));

export async function estaConectada(id: NubeId) {
  return !!(await leerTokens(id));
}

export async function desconectar(id: NubeId) {
  await SecureStore.deleteItemAsync(claveTokens(id));
}

/** Abre el inicio de sesión de la nube y guarda el permiso de acceso. */
export async function conectar(id: NubeId): Promise<boolean> {
  const p = NUBES[id];
  const clientId = p.clientId();
  if (!clientId) throw new Error(`${p.nombre} todavía no está configurada en la app.`);
  const redirectUri = p.redirect();
  const req = new AuthSession.AuthRequest({
    clientId, redirectUri, scopes: p.scopes, usePKCE: true,
    responseType: AuthSession.ResponseType.Code, extraParams: p.extraParams,
  });
  const res = await req.promptAsync(p.discovery);
  if (res.type !== 'success') return false;
  const tok = await AuthSession.exchangeCodeAsync(
    { clientId, code: res.params.code, redirectUri, extraParams: { code_verifier: req.codeVerifier ?? '' } },
    p.discovery,
  );
  await guardarTokens(id, { accessToken: tok.accessToken, refreshToken: tok.refreshToken, expiresIn: tok.expiresIn, issuedAt: tok.issuedAt });
  return true;
}

async function token(id: NubeId): Promise<string> {
  const t = await leerTokens(id);
  if (!t) throw new Error(`Primero conectá ${NUBES[id].nombre}.`);
  if (AuthSession.TokenResponse.isTokenFresh(t, 60) || !t.refreshToken) return t.accessToken;
  const p = NUBES[id];
  const nuevo = await AuthSession.refreshAsync({ clientId: p.clientId() ?? '', refreshToken: t.refreshToken }, p.discovery);
  await guardarTokens(id, {
    accessToken: nuevo.accessToken, refreshToken: nuevo.refreshToken ?? t.refreshToken,
    expiresIn: nuevo.expiresIn, issuedAt: nuevo.issuedAt,
  });
  return nuevo.accessToken;
}

async function json(res: Response) {
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j?.error?.message ?? j?.error_summary ?? `Error ${res.status}`);
  return j;
}

// ---------- Google Drive ----------
async function carpetaDrive(tk: string): Promise<string> {
  const q = encodeURIComponent("name='MiColegio' and mimeType='application/vnd.google-apps.folder' and trashed=false");
  const r = await json(await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`, { headers: { Authorization: `Bearer ${tk}` } }));
  if (r.files?.[0]?.id) return r.files[0].id;
  const c = await json(await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tk}`, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'MiColegio', mimeType: 'application/vnd.google-apps.folder' }),
  }));
  return c.id;
}

/** Sube un archivo del teléfono a la carpeta de la app en la nube. */
export async function subir(id: NubeId, archivo: File, nombre = archivo.name): Promise<void> {
  const tk = await token(id);
  const auth = { Authorization: `Bearer ${tk}` };
  let url: string;
  let headers: Record<string, string>;
  let httpMethod: 'POST' | 'PUT' | 'PATCH' = 'POST';
  if (id === 'gdrive') {
    const carpeta = await carpetaDrive(tk);
    const meta = await json(await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: { ...auth, 'content-type': 'application/json' },
      body: JSON.stringify({ name: nombre, parents: [carpeta] }),
    }));
    url = `https://www.googleapis.com/upload/drive/v3/files/${meta.id}?uploadType=media`;
    headers = auth;
    httpMethod = 'PATCH';
  } else if (id === 'dropbox') {
    url = 'https://content.dropboxapi.com/2/files/upload';
    headers = { ...auth, 'Content-Type': 'application/octet-stream', 'Dropbox-API-Arg': JSON.stringify({ path: `/${nombre}`, mode: 'overwrite' }) };
  } else {
    url = `https://graph.microsoft.com/v1.0/me/drive/special/approot:/${encodeURIComponent(nombre)}:/content`;
    headers = auth;
    httpMethod = 'PUT';
  }
  const r = await archivo.upload(url, { httpMethod, headers, uploadType: 0 });
  if (r.status >= 300) throw new Error(`No se pudo subir (${r.status}).`);
}

/** Lista los archivos de la carpeta de la app en la nube. */
export async function listar(id: NubeId): Promise<ArchivoNube[]> {
  const tk = await token(id);
  const auth = { Authorization: `Bearer ${tk}` };
  if (id === 'gdrive') {
    const carpeta = await carpetaDrive(tk);
    const q = encodeURIComponent(`'${carpeta}' in parents and trashed=false`);
    const r = await json(await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=modifiedTime desc&fields=files(id,name,size,modifiedTime)`, { headers: auth }));
    return (r.files ?? []).map((f: { id: string; name: string; size?: string; modifiedTime?: string }) => ({ id: f.id, nombre: f.name, tamano: f.size ? Number(f.size) : undefined, fecha: f.modifiedTime }));
  }
  if (id === 'dropbox') {
    const r = await json(await fetch('https://api.dropboxapi.com/2/files/list_folder', {
      method: 'POST', headers: { ...auth, 'content-type': 'application/json' }, body: JSON.stringify({ path: '' }),
    }));
    return (r.entries ?? [])
      .filter((e: { '.tag': string }) => e['.tag'] === 'file')
      .map((e: { path_lower: string; name: string; size: number; server_modified: string }) => ({ id: e.path_lower, nombre: e.name, tamano: e.size, fecha: e.server_modified }));
  }
  const r = await json(await fetch('https://graph.microsoft.com/v1.0/me/drive/special/approot/children', { headers: auth }));
  return (r.value ?? [])
    .filter((e: { file?: unknown }) => e.file)
    .map((e: { id: string; name: string; size: number; lastModifiedDateTime: string }) => ({ id: e.id, nombre: e.name, tamano: e.size, fecha: e.lastModifiedDateTime }));
}

/** Descarga un archivo de la nube como texto (usado para restaurar copias de seguridad). */
export async function descargarTexto(id: NubeId, archivo: ArchivoNube): Promise<string> {
  const tk = await token(id);
  const auth = { Authorization: `Bearer ${tk}` };
  let res: Response;
  if (id === 'gdrive') res = await fetch(`https://www.googleapis.com/drive/v3/files/${archivo.id}?alt=media`, { headers: auth });
  else if (id === 'dropbox') res = await fetch('https://content.dropboxapi.com/2/files/download', { method: 'POST', headers: { ...auth, 'Dropbox-API-Arg': JSON.stringify({ path: archivo.id }) } });
  else res = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${archivo.id}/content`, { headers: auth });
  if (!res.ok) throw new Error(`No se pudo descargar (${res.status}).`);
  return res.text();
}

/** Descarga un archivo de la nube a una carpeta de Mis archivos. */
export async function bajar(id: NubeId, archivo: ArchivoNube, destino: Directory): Promise<File> {
  const tk = await token(id);
  const auth = { Authorization: `Bearer ${tk}` };
  let url: string;
  let headers: Record<string, string> = auth;
  if (id === 'gdrive') url = `https://www.googleapis.com/drive/v3/files/${archivo.id}?alt=media`;
  else if (id === 'onedrive') url = `https://graph.microsoft.com/v1.0/me/drive/items/${archivo.id}/content`;
  else {
    const r = await json(await fetch('https://api.dropboxapi.com/2/files/get_temporary_link', {
      method: 'POST', headers: { ...auth, 'content-type': 'application/json' }, body: JSON.stringify({ path: archivo.id }),
    }));
    url = r.link;
    headers = {};
  }
  return File.downloadFileAsync(url, new File(destino, archivo.nombre), { headers, idempotent: true });
}
