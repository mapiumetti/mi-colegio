/**
 * Plugin de configuración para Android:
 * 1. Firma el APK de "release" con la clave propia de Mi Colegio cuando está disponible
 *    (variables de entorno MI_COLEGIO_KEYSTORE*). Así todas las versiones se firman igual
 *    y se pueden actualizar sin desinstalar.
 * 2. Numera cada compilación (versionCode) para que Android acepte la actualización.
 * 3. Declara las apps que Mi Colegio puede abrir (IAs, WhatsApp, Telegram, nubes, Office),
 *    requisito de Android 11+ para poder lanzarlas.
 */
const { withAppBuildGradle, withAndroidManifest } = require('expo/config-plugins');

const PAQUETES = [
  // Inteligencias artificiales
  'com.anthropic.claude',
  'com.openai.chatgpt',
  'com.google.android.apps.bard',
  'com.microsoft.copilot',
  'ai.x.grok',
  // Mensajería
  'com.whatsapp',
  'com.whatsapp.w4b',
  'org.telegram.messenger',
  // Nubes
  'com.google.android.apps.docs',
  'com.dropbox.android',
  'com.microsoft.skydrive',
  // Oficina
  'com.microsoft.office.word',
  'com.microsoft.office.excel',
  'com.microsoft.office.powerpoint',
  'com.microsoft.office.officehubrow',
  'com.google.android.apps.docs.editors.docs',
  'com.google.android.apps.docs.editors.sheets',
  'com.google.android.apps.docs.editors.slides',
  'com.collabora.libreoffice',
  // Mapas y traductor
  'com.google.android.apps.maps',
  'com.google.android.apps.translate',
];

function withFirma(config) {
  return withAppBuildGradle(config, (cfg) => {
    let g = cfg.modResults.contents;
    if (!g.includes('MI_COLEGIO_KEYSTORE')) {
      g = g.replace(
        /signingConfigs \{\n/,
        `signingConfigs {
        release {
            if (System.getenv("MI_COLEGIO_KEYSTORE")) {
                storeFile file(System.getenv("MI_COLEGIO_KEYSTORE"))
                storePassword System.getenv("MI_COLEGIO_KEYSTORE_PASSWORD")
                keyAlias System.getenv("MI_COLEGIO_KEY_ALIAS")
                keyPassword System.getenv("MI_COLEGIO_KEYSTORE_PASSWORD")
            }
        }
`,
      );
      g = g.replace(
        /(release \{\n(?:\s*\/\/.*\n)*\s*)signingConfig signingConfigs\.debug/,
        '$1signingConfig System.getenv("MI_COLEGIO_KEYSTORE") ? signingConfigs.release : signingConfigs.debug',
      );
      g = g.replace(/versionCode \d+/, 'versionCode((System.getenv("GITHUB_RUN_NUMBER") ?: "1").toInteger())');
      g = g.replace(/versionName "([\d.]+)"/, 'versionName "1.0.${System.getenv("GITHUB_RUN_NUMBER") ?: "0"}"');
    }
    cfg.modResults.contents = g;
    return cfg;
  });
}

function withPaquetes(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    manifest.queries = manifest.queries ?? [{}];
    const q = manifest.queries[0];
    q.package = q.package ?? [];
    for (const p of PAQUETES) {
      if (!q.package.some((x) => x.$['android:name'] === p)) q.package.push({ $: { 'android:name': p } });
    }
    return cfg;
  });
}

module.exports = function withMiColegioAndroid(config) {
  return withPaquetes(withFirma(config));
};
