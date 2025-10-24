# Roadmap MaLoveApp – versión móvil (iOS / Android)

## 1. Estrategia técnica
- **Objetivo**: reutilizar la lógica y servicios del proyecto web para ofrecer una experiencia nativa en teléfonos y tablets.
- **Stack recomendado**: React Native con Expo (EAS) para compartir hooks/servicios existentes, o Capacitor si se opta por envolver la web como PWA. Se aconseja React Native para máxima experiencia táctil y acceso directo a APIs nativas.
- **Organización de repos**:
  - Mantener monorepo (web + mobile) para compartir código (`packages/core`, `packages/services`).
  - Separar UI (web = React + Tailwind, mobile = RN + StyleSheet o NativeWind).

## 2. Adaptación de interfaz
- **Layout y navegación**:
  - Sustituir enrutador web por `@react-navigation/native` (stack + tabs).
  - Rediseñar dashboards extensos en cards modulares y bottom sheets.
- **Componentes**:
  - Migrar a componentes nativos (`View`, `Text`, `Pressable`).
  - Reescribir formularios con `KeyboardAvoidingView`, pickers nativos, toggles, sliders.
- **Gestures**: incorporar swipes, pull-to-refresh y scrolls suaves.
- **Tema visual**: definir design tokens compartidos, ajustar tipografías y spacing para pantallas pequeñas.

## 3. Reutilización de lógica
- **Servicios/API**: `apiClient`, hooks (`useAISearch`, `useSeatingSync`, etc.) pueden compartirse si se desacoplan de DOM/localStorage.
- **Almacenamiento local**: reemplazar `localStorage/sessionStorage` por AsyncStorage o MMKV (tokens, caches de seating/email).
- **Autenticación**:
  - Firebase Auth nativo (SDK) o Auth REST + SecureStore.
  - Reimplementación de flujos (login, magic links, verificación) con deep links.
- **Cache y sincronización**: validar uso offline; implementar colas de reintentos en servicios críticos (seating, tareas).

## 4. Funcionalidad específica móvil
- **Push notifications**: integrar FCM/APNS mediante Expo Notifications o Firebase directo. Backend debe almacenar `deviceTokens` y permitir topics (ej. bodas).
- **Deep linking**: mapear URLs (`https://app.malove.../proveedores/123`) a rutas móviles (`malove://suppliers/123`). Configurar universal links/app links.
- **Gestión de archivos**: usar `expo-document-picker`, `Share` o `react-native-fs` para descargas/adjuntos de email.
- **Media**: permisos cámara/galería para Momentos, compresión local.
- **Analytics**: añadir tracking móvil (Firebase Analytics o Segment).

## 5. Backend y APIs
- Revisar límites de rate/use (Apps generan más hitos push/pull).
- Agregar endpoints: guardar token push, métricas mobile (`/api/admin/mobile-stats`).
- Ajustar CORS / auth middleware para tokens móviles; eliminar bypass Cypress en endpoints protegidos.
- Actualizar documentación API (`docs/api/openapi.yaml`) con endpoints mobile específicos (push registration, deep-link targets).

## 6. Build & CI/CD
- **Pipeline**: Expo EAS o Fastlane + GitHub Actions.
- **Certificados**: gestionar credenciales Apple/Google (`app.json`, `eas.json`). Automatizar renovaciones.
- **Versionado**: sincronizar semver/CodePush. Establecer release train (beta → release candidate → producción).
- **Distribución**: TestFlight y Google Play Internal Testing; usar Firebase App Distribution para QA interna.
- **Políticas**: PRIVACIDAD/GDPR, App Tracking Transparency (si se usan trackers).

## 7. QA y cobertura
- **Unit tests**: conservar tests de servicios/hooks compartidos, añadir RN Testing Library para componentes móviles.
- **E2E**: usar Detox o Maestro para flujos críticos (login, proveedores, seating, momentos). Mantener Cypress para web.
- **Beta program**: definir equipo de testers, recopilación de feedback vía Crashlytics/Instabug.

## 8. Roadmap sugerido
1. **Fase 0 – Fundamentos (2-3 sprint)**  
   - Decisión Expo vs Capacitor, setup monorepo, modularización servicios.  
   - Proof-of-concept pantallas login + dashboard con navegación RN.
2. **Fase 1 – MVP Proveedores & Agenda (3-4 sprint)**  
   - Implementar login/registro, proveedores IA, checklist básica, notificaciones push de tareas.  
   - Sincronización con backend existente; QA con Expo go.
3. **Fase 2 – Funcionalidad avanzada (4-6 sprint)**  
   - Incorporar seating plan móvil (modo lectura/edit light), Momentos (captura fotos), email resumen.  
   - Deep linking desde invitaciones, integración gallería offline.
4. **Fase 3 – Hardening & Release (2-3 sprint)**  
   - Optimización performance, accesibilidad, analytics, documentación.  
   - Preparar lanzamiento stores, proceso legal/compliance, soporte.
5. **Fase 4 – Evolución continua**  
   - Paridad con web, features nativas (widgets, Siri/Assistant intents), co-browsing planner/pareja.

## 9. Próximos pasos inmediatos
- Crear RFC técnica formal (Expo vs Capacitor) con análisis de pros/contras y impacto en equipo.
- Documentar design tokens compartidos y mapa de navegación mobile-first.
- Priorizar features móviles en backlog (top 3: proveedores en movilidad, checklist offline, notificaciones).
- Configurar pipeline CI de ejemplo (build Expo EAS preview).
- Planificar onboarding para equipo (guía de dev, emuladores, debugging). 
