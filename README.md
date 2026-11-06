# Mi Colegio

App para estudiantes de secundaria, para **Android y iOS** con un solo código (Expo / React Native, SDK 58, TypeScript).

## Cómo probarla

```bash
npm install
npx expo start
```

- Escaneá el código QR con **Expo Go** (Android) o con la cámara (iPhone) para abrirla en tu celular.
- Para instalarla como app real o publicarla en Google Play / App Store: `npx eas-cli@latest build -p android` (o `-p ios`). Para iOS hace falta una cuenta de Apple Developer.

## Qué hace cada requisito

| # | Requisito | Cómo está resuelto | Dónde |
|---|-----------|--------------------|-------|
| 1 | Android e iOS | Expo / React Native, un solo código | todo |
| 2 | Amigable, colores sencillos | Paleta clara con un azul principal y colores pastel por materia | `src/lib/theme.ts` |
| 3 | Logo del colegio (foto o GIF) | Galería o cámara; se guarda una copia y se muestra animado si es GIF | `src/app/colegio.tsx` |
| 4 | Plataforma del colegio en el navegador | Botón "Abrir aquí" (pestaña de Chrome/Safari) o "Abrir en Chrome" | Inicio y Mi colegio |
| 5 | Datos personales, edad, año y curso | Formulario "Mis datos" (se guarda solo en el teléfono) | `src/app/perfil.tsx` |
| 6 | Drive, Dropbox, OneDrive, iCloud | Importar con el selector del sistema (muestra todas las nubes instaladas), Compartir para guardar en la nube, accesos directos a cada nube | `archivos.tsx`, `nubes.tsx` |
| 7 | PDFs, imágenes, cámara, micrófono, grabadora, carpeta propia | Carpeta `MiColegio` con subcarpetas, visor de imágenes, vista previa nativa de PDF, cámara, grabadora de voz | `archivos.tsx`, `grabadora.tsx` |
| 8 | Contactos del teléfono | Selector nativo de la agenda | `contactos.tsx` |
| 9 | WhatsApp y Telegram | Archivos: hoja de compartir del sistema. Texto: abre WhatsApp/Telegram con el mensaje (o directo a un contacto) | `src/lib/share.ts` |
| 10 | IAs (Claude, ChatGPT, Gemini, Grok, Copilot) | Chat dentro de la app con clave de API propia (guardada cifrada) y atajos: resumir, explicar, preguntas de repaso. Copilot no tiene API pública: se abre su app/web | `ia.tsx`, `src/lib/ai.ts` |
| 11 | Calculadora | Propia, básica y científica (grados) | `calculadora.tsx` |
| 12 | Materias, doble turno, horarios, recreos | Turnos mañana / tarde / noche con entrada y salida, almuerzo, duración del módulo y del recreo; genera la grilla y se asigna la materia tocando cada módulo | `horario.tsx`, `configurar-horario.tsx` |
| 13 | Recordatorios de pruebas, TPs, entregas, torneos | Agenda con tipos de evento, vista de próximos y de mes | `agenda.tsx`, `evento.tsx` |
| 14 | Notas por materia y "pendiente" | Exámenes, TPs, entregas y orales, con estado pendiente / entregado / calificado y promedio | `materia/[id].tsx`, `notas.tsx` |
| 15 | Notificaciones con globo y sonido, personalizables | Varios avisos por evento (en el momento, 15 min, 1 h, 1 día, 1 semana...), con o sin sonido | `src/lib/notifications.ts` |
| 16 | Guardar en Google Calendar / calendario del teléfono | Abre el formulario nativo del calendario con el evento cargado; ahí se elige Google, iCloud, Outlook, etc. | `src/lib/calendar.ts` |
| 17 | Word, Excel, Google Docs, etc. | Accesos a Word, Excel, PowerPoint, Google Docs/Sheets/Slides y Collabora (LibreOffice) | `nubes.tsx` |
| 18 | Feriados y puentes / calendario escolar | Descarga automática semanal de feriados nacionales, trasladables y puentes; se marcan en Agenda e Inicio. Calendario escolar por provincia (inicio, receso invernal, fin) | `feriados.tsx`, `src/lib/holidays.ts` |

## Versión 2

- **Nubes:** conexión directa con Google Drive, Dropbox y OneDrive para ver, subir y bajar archivos (requiere registrar la app, ver [docs/NUBES.md](docs/NUBES.md)).
- **Firma:** todas las versiones se firman con la misma clave, así se actualiza sin desinstalar (ver `plugins/withMiColegioAndroid.js` y el workflow).
- **Apariencia:** modo claro, oscuro o como el teléfono, y 8 combinaciones de colores (Más → Apariencia y copias).
- **IAs:** botones que abren la app instalada (Claude, ChatGPT, Gemini, Copilot, Grok) o la web si no está.
- **Copias de seguridad:** al teléfono, a una carpeta elegida, a una nube conectada o a cualquier app con "Compartir"; también se pueden restaurar.
- **Mi colegio:** dirección, teléfono, mail y lista de autoridades y teléfonos útiles (preceptor/a, directivos, etc.).
- **Archivos:** una carpeta por cada materia; la grabadora pregunta en qué carpeta guardar.
- **Notas:** colores por nota (9–10 verde fuerte, 7–8,99 verde suave, 4–6,99 amarillo, menos de 4 rojo), notas por cuatrimestre y boletín conceptual Nacional (E/MB/B/S/I), Provincia de Buenos Aires RITE (TEA/TEP/TED) o CABA (Finalizado/En proceso/No iniciado).
- **Herramientas:** conversor de unidades, tabla periódica, fórmulas de física por tema, Google Maps, Google Traductor, mapas escolares del IGN, Educ.ar (recursos, Claves de Química y de Historia) y apuntes por materia.

## Notas importantes

- **Feriados (18):** argentina.gob.ar no tiene una API, así que la app usa [ArgentinaDatos](https://argentinadatos.com) (`api.argentinadatos.com/v1/feriados/{año}`), un servicio abierto que replica los feriados oficiales incluidos los puentes. Las fechas del calendario escolar cambian por provincia y por año, por eso se cargan a mano desde la página oficial (hay un botón que la abre). Una mejora futura es tener esas fechas precargadas por provincia.
- **IAs (10):** cada servicio cobra su API aparte y pide una clave propia. La alternativa sin costo es el botón "Abrir Claude / ChatGPT / ..." que abre la app oficial.
- **Nubes (6):** conectar directo con la cuenta (OAuth) de cada nube es una fase 2; hoy se usa el selector de archivos del sistema, que ya muestra Drive, Dropbox, OneDrive e iCloud.
- **WhatsApp / Telegram (9):** ninguna de las dos permite que otra app envíe mensajes sola; la app prepara el mensaje o el archivo y el alumno toca "Enviar".
- Todos los datos se guardan en el teléfono. No hay servidor ni cuentas.

## Estructura

```
src/app/            pantallas (Expo Router)
  (tabs)/           Inicio, Horario, Agenda, Notas, Más
src/components/     componentes de interfaz
src/lib/            datos, horarios, notificaciones, calendario, archivos, IA, feriados, calculadora
```

Verificación: `npx tsc --noEmit` y `npx expo export --platform android` pasan sin errores.
