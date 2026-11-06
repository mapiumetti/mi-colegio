import { Directory, File, Paths } from 'expo-file-system';

/** Carpeta propia de la app en el dispositivo: Documentos/MiColegio */
export function carpetaBase(): Directory {
  const dir = new Directory(Paths.document, 'MiColegio');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

export function subcarpeta(nombre: string): Directory {
  const dir = new Directory(carpetaBase(), nombre);
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

/** Copia un archivo (de la cámara, el selector, una nube...) a la carpeta indicada. */
export function guardarCopia(uriOrigen: string, destino: Directory, nombre?: string): File {
  const origen = new File(uriOrigen);
  const limpio = (nombre ?? origen.name).replace(/[\\/:*?"<>|]/g, '_');
  let archivo = new File(destino, limpio);
  if (archivo.exists) {
    const punto = limpio.lastIndexOf('.');
    const base = punto > 0 ? limpio.slice(0, punto) : limpio;
    const ext = punto > 0 ? limpio.slice(punto) : '';
    archivo = new File(destino, `${base}-${Date.now()}${ext}`);
  }
  origen.copy(archivo);
  return archivo;
}

export const esImagen = (n: string) => /\.(png|jpe?g|gif|webp|heic|bmp)$/i.test(n);
export const esPdf = (n: string) => /\.pdf$/i.test(n);
export const esAudio = (n: string) => /\.(m4a|mp3|aac|wav|ogg|3gp|caf)$/i.test(n);

export function mimeDe(n: string): string | undefined {
  const ext = n.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
    webp: 'image/webp', m4a: 'audio/mp4', mp3: 'audio/mpeg', wav: 'audio/wav', txt: 'text/plain',
    doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  };
  return ext ? map[ext] : undefined;
}

export const iconoDe = (n: string) => (esPdf(n) ? '📕' : esImagen(n) ? '🖼️' : esAudio(n) ? '🎙️' : '📄');
