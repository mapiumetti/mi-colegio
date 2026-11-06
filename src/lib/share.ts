import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import { Alert, Linking } from 'react-native';

/** Comparte un archivo con la hoja de compartir del sistema (WhatsApp, Telegram, Drive, mail...). */
export async function compartirArchivo(uri: string, mimeType?: string) {
  if (!(await Sharing.isAvailableAsync())) {
    Alert.alert('No disponible', 'Este dispositivo no permite compartir archivos.');
    return;
  }
  await Sharing.shareAsync(uri, { mimeType, dialogTitle: 'Compartir' });
}

const soloDigitos = (tel: string) => tel.replace(/[^\d]/g, '');

/** Abre WhatsApp con un texto (y opcionalmente un número de destino). */
export async function enviarWhatsApp(texto: string, telefono?: string) {
  const tel = telefono ? soloDigitos(telefono) : '';
  const app = `whatsapp://send?text=${encodeURIComponent(texto)}${tel ? `&phone=${tel}` : ''}`;
  const web = `https://wa.me/${tel}?text=${encodeURIComponent(texto)}`;
  await abrirConRespaldo(app, web);
}

/** Abre Telegram para compartir un texto. */
export async function enviarTelegram(texto: string) {
  const app = `tg://msg?text=${encodeURIComponent(texto)}`;
  const web = `https://t.me/share/url?url=${encodeURIComponent(' ')}&text=${encodeURIComponent(texto)}`;
  await abrirConRespaldo(app, web);
}

/** Intenta abrir la app nativa y, si no está instalada, la versión web. */
export async function abrirConRespaldo(appUrl: string, webUrl: string) {
  try {
    await Linking.openURL(appUrl);
  } catch {
    await Linking.openURL(webUrl);
  }
}

/** Abre una web dentro de la app (pestaña de Chrome / Safari) o en el navegador predeterminado. */
export async function abrirPlataforma(url: string, enNavegador: boolean) {
  const u = /^https?:\/\//.test(url) ? url : `https://${url}`;
  // Dentro de la app (pestaña de Chrome / Safari) o en el navegador predeterminado.
  if (enNavegador) await Linking.openURL(u);
  else await WebBrowser.openBrowserAsync(u);
}

