# Precise Cleaning — app del equipo (Android + iOS)

App en **React Native + Expo** conectada al mismo Firebase que la app web de Precise Cleaning.
La oficina asigna la casa en la web → el empleado la ve al instante en el teléfono → la trabaja
(Start Job, fotos Before/After, notas, Mark Finished) → todo aparece en vivo en la web.
El empleado también ve su **Payroll** (pendiente / pagado, por semana).

## Qué hace

- **Pantalla de carga animada** al abrir la app, al iniciar sesión y al cerrar sesión, y
  **bienvenida** de 3 pasos la primera vez. El resto de la app no tiene animaciones.
- **Notificaciones**: campana animada con contador y aviso fijo arriba cuando te asignan una casa,
  cambia el horario o el status, la oficina deja una nota o se registra/paga tu payroll.
- **Login** con el mismo correo y contraseña de la web (las cuentas se crean en System Users).
- **Mis casas**: Hoy (incluye en curso y atrasadas recientes) · Próximas · Historial.
  Muestra las casas donde el empleado está en *Assigned Workers* o que son de su equipo.
- **Detalle de casa**: dirección con botón a Mapas, Start Job / Mark Finished, fotos Before y
  After con cámara o galería, nota general (lectura) y Employee's Note (hilo de mensajes).
- **Payroll**: total por cobrar, pagado este mes, registros agrupados por semana de pago.
- **Perfil**: fotos y cambios pendientes de subir, cerrar sesión. La interfaz está solo en inglés.
- **Funciona sin señal**: fotos, Start/Finish y notas quedan guardados en el teléfono y se
  envían solos al volver la conexión, aunque se cierre la app.
- Respeta lo que la oficina configura en la web: roles, statuses permitidos, *Field & Button
  Visibility* y *Photo Settings* (compresión, cámara/galería).

## Probar en tu teléfono (5 minutos)

Requisitos: Node 20+ en tu computadora y la app **Expo Go** en el teléfono.

```bash
npm install
npx expo start
```
Escanea el QR con la cámara (iPhone) o con Expo Go (Android). Inicia sesión con un usuario
de rol empleado y asígnale una casa desde la web para verla aparecer.

## Publicar en Google Play y App Store (EAS Build)

```bash
npm install -g eas-cli
eas login                    # cuenta de expo.dev (gratis)
eas build:configure          # enlaza el proyecto (una sola vez)

eas build -p android --profile preview      # APK para instalar directo en teléfonos Android
eas build -p android --profile production   # .aab para Google Play
eas build -p ios --profile production       # requiere cuenta Apple Developer (USD 99/año)

eas submit -p android        # sube a Google Play
eas submit -p ios            # sube a App Store Connect / TestFlight
```
Identificador de la app: `com.precisecleaningtx.crew` (cámbialo en `app.json` antes del
primer build si prefieres otro; después ya no se puede cambiar en las tiendas).

## Estructura

```
App.tsx                      Providers + navegación
src/config/firebase.ts       Mismo proyecto Firebase que la web (bdprecise-2d4bc)
src/context/                 Sesión, catálogos, casas, red, cola de fotos, cola de cambios
src/services/                Escrituras a Firestore/Storage (mismos campos que la web)
src/screens/                 Login, Mis casas, Detalle, Payroll, Perfil
src/components/              Piezas de pantalla; src/components/ui/ = sistema de diseño
src/theme/tokens.ts          Paleta con significado, tipografía, sombras y movimiento
src/constants/strings.ts     Textos de la interfaz (inglés)
```
Lee `CLAUDE.md` para el contrato de datos con la web y las convenciones del código.
