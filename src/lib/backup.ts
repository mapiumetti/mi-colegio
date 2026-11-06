import { Directory, File, Paths } from 'expo-file-system';
import type { AppData } from './types';
import { subcarpeta } from './files';

export type Backup = { app: 'mi-colegio'; version: 1; fecha: string; data: AppData };

export const nombreBackup = () => `mi-colegio-backup-${new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-')}.json`;

/** Arma el archivo de copia de seguridad con todos los datos de la app. */
export function crearArchivoBackup(data: AppData, destino: Directory = Paths.cache): File {
  const b: Backup = { app: 'mi-colegio', version: 1, fecha: new Date().toISOString(), data };
  const f = new File(destino, nombreBackup());
  f.create({ overwrite: true });
  f.write(JSON.stringify(b, null, 1));
  return f;
}

/** Guarda la copia en Mis archivos → Copias de seguridad. */
export const guardarBackupEnTelefono = (data: AppData) => crearArchivoBackup(data, subcarpeta('Copias de seguridad'));

/** Valida y devuelve los datos de una copia de seguridad. */
export function leerBackup(texto: string): AppData {
  const b = JSON.parse(texto) as Partial<Backup>;
  if (b.app !== 'mi-colegio' || !b.data) throw new Error('El archivo no es una copia de seguridad de Mi Colegio.');
  return b.data;
}
