import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

type ConcentracionNativo = {
  tienePermiso(): boolean;
  pedirPermiso(): void;
  estaActivo(): boolean;
  activar(total: boolean): boolean;
  desactivar(): boolean;
};

// Solo existe en Android. En iPhone, Apple no permite que una app active "No molestar".
const nativo = Platform.OS === 'android' ? requireOptionalNativeModule<ConcentracionNativo>('Concentracion') : null;

export const disponible = !!nativo;
export const tienePermiso = () => nativo?.tienePermiso() ?? false;
export const pedirPermiso = () => nativo?.pedirPermiso();
export const estaActivo = () => nativo?.estaActivo() ?? false;
export const activar = (total: boolean) => nativo?.activar(total) ?? false;
export const desactivar = () => nativo?.desactivar() ?? false;
