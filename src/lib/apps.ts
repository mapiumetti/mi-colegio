import * as IntentLauncher from 'expo-intent-launcher';
import { Linking, Platform } from 'react-native';

export type AppExterna = {
  android?: string; // nombre del paquete en Android
  ios?: string; // esquema de la app en iPhone, p. ej. "claude://"
  web: string; // si la app no está instalada
};

/**
 * Abre la app instalada en el teléfono (Claude, ChatGPT, Drive, Word...).
 * Si no está instalada, abre la versión web.
 */
export async function abrirApp(app: AppExterna) {
  try {
    if (Platform.OS === 'android' && app.android) {
      IntentLauncher.openApplication(app.android);
      return;
    }
    if (Platform.OS === 'ios' && app.ios) {
      await Linking.openURL(app.ios);
      return;
    }
  } catch {
    // No está instalada: seguimos con la web.
  }
  await Linking.openURL(app.web);
}

export const APPS = {
  claude: { android: 'com.anthropic.claude', ios: 'claude://', web: 'https://claude.ai' },
  chatgpt: { android: 'com.openai.chatgpt', ios: 'chatgpt://', web: 'https://chatgpt.com' },
  gemini: { android: 'com.google.android.apps.bard', ios: 'googlegemini://', web: 'https://gemini.google.com' },
  copilot: { android: 'com.microsoft.copilot', ios: 'ms-copilot://', web: 'https://copilot.microsoft.com' },
  grok: { android: 'ai.x.grok', ios: 'grok://', web: 'https://grok.com' },
  gdrive: { android: 'com.google.android.apps.docs', ios: 'googledrive://', web: 'https://drive.google.com' },
  dropbox: { android: 'com.dropbox.android', ios: 'dbx-dropbox://', web: 'https://www.dropbox.com/home' },
  onedrive: { android: 'com.microsoft.skydrive', ios: 'ms-onedrive://', web: 'https://onedrive.live.com' },
  icloud: { ios: 'shareddocuments://', web: 'https://www.icloud.com/iclouddrive' },
  word: { android: 'com.microsoft.office.word', ios: 'ms-word://', web: 'https://www.office.com/launch/word' },
  excel: { android: 'com.microsoft.office.excel', ios: 'ms-excel://', web: 'https://www.office.com/launch/excel' },
  powerpoint: { android: 'com.microsoft.office.powerpoint', ios: 'ms-powerpoint://', web: 'https://www.office.com/launch/powerpoint' },
  gdocs: { android: 'com.google.android.apps.docs.editors.docs', ios: 'googledocs://', web: 'https://docs.new' },
  gsheets: { android: 'com.google.android.apps.docs.editors.sheets', ios: 'googlesheets://', web: 'https://sheets.new' },
  gslides: { android: 'com.google.android.apps.docs.editors.slides', ios: 'googleslides://', web: 'https://slides.new' },
  collabora: { android: 'com.collabora.libreoffice', web: 'https://www.collaboraoffice.com/collabora-office-mobile/' },
  maps: { android: 'com.google.android.apps.maps', ios: 'comgooglemaps://', web: 'https://www.google.com/maps' },
  traductor: { android: 'com.google.android.apps.translate', ios: 'googletranslate://', web: 'https://translate.google.com/?sl=auto&tl=es' },
} satisfies Record<string, AppExterna>;
