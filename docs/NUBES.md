# Conectar Google Drive, Dropbox y OneDrive

La app ya trae el código para conectarse a las tres nubes. Para que funcione, cada servicio pide que la app esté registrada y entrega un **ID de cliente**. El registro es gratis. Los IDs se cargan en `app.json` → `expo.extra.cloud`. Con cada cambio a `main`, GitHub compila y publica el APK nuevo.

| Nube | Dónde se registra | Qué hay que cargar |
|------|-------------------|--------------------|
| Dropbox | https://www.dropbox.com/developers/apps → "Create app" → *Scoped access* → *App folder* | `dropboxAppKey` (App key). En *Permissions*, activar `files.content.write` y `files.content.read`. En *OAuth 2 → Redirect URIs*, agregar `micolegio://oauth`. |
| OneDrive | https://portal.azure.com → *App registrations* → "New registration" → cuentas personales de Microsoft | `onedriveClientId` (Application ID). En *Authentication*, agregar la plataforma *Mobile and desktop* con la URI `micolegio://oauth`. Permisos: `Files.ReadWrite.AppFolder`, `offline_access`, `User.Read`. |
| Google Drive | https://console.cloud.google.com → nuevo proyecto → habilitar *Google Drive API* → *Credenciales* → "ID de cliente de OAuth" tipo **Android** | `googleAndroidClientId`. Nombre del paquete `com.micolegio.app` y el **SHA-1** de la clave de firma. En *Configuración avanzada*, habilitar "esquema de URI personalizado". Para iPhone, crear otro ID tipo iOS (`googleIosClientId`) con el bundle `com.micolegio.app`. En la *pantalla de consentimiento*, agregar el permiso `drive.file` y tu mail como usuario de prueba. |

La app guarda los archivos en una carpeta propia dentro de cada nube y no ve el resto de tus archivos.
