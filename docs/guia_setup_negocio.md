# Guía de Configuración de Negocio y Conexión de WhatsApp Cloud API

Esta guía te guiará paso a paso para configurar tu agencia de diseño web, **Galu**, y conectar el chatbot con la API oficial de WhatsApp Cloud.

---

## Paso 1: Registrar el Negocio en el Portal de Superadmin

Antes de configurar la API en Meta, debés registrar el negocio en tu base de datos centralizada (SaaS).

1. Ingresá al **Portal de Superadmin** de tu plataforma.
2. Hacé clic en el botón **+ Crear Nuevo Negocio** (o andá directamente a la sección **Dar de Alta Negocio**).
3. Completá el formulario con los datos de **Galu**:
   - **Nombre del Negocio**: `Galu`
   - **Rubro**: `Servicios` o `Peluquería/Estética` (elegí el que mejor se adapte para servicios de diseño web, o podés agregar un nuevo rubro).
   - **Configuración de WhatsApp**: Podés dejar los campos vacíos temporalmente y guardarlo para generar el ID del negocio.
4. Hacé clic en **Crear / Guardar Negocio**. Esto generará un identificador único (`business_id`) en la base de datos.

---

## Paso 2: Crear una Cuenta de Meta para Desarrolladores

Para usar la API oficial y gratuita de WhatsApp Cloud, necesitás una aplicación dentro del ecosistema de Meta Developers.

1. Entrá a [Meta for Developers](https://developers.facebook.com/) e iniciá sesión con tu cuenta de Facebook (la misma que administra la página de Facebook de tu agencia).
2. Hacé clic en el botón **Crear app** (Create App) en la esquina superior derecha.
3. **Elegir un caso de uso (Use Case):** Seleccioná **Conectarte con los clientes a través de WhatsApp** (Connect with customers through WhatsApp). Hacé clic en **Siguiente**.
   > [!NOTE]
   > Si no te aparece esta opción debido a cambios recientes en la interfaz de Meta, seleccioná la opción **Otro** y, en la siguiente pantalla, marcá la casilla de **Negocios** (Business) como tipo de app.
4. **Completar los detalles de la app:**
   - **Nombre visible de la app**: `Galu Chatbot` (o similar).
   - **Correo de contacto**: Tu email.
   - **Cuenta comercial**: Si ya tenés una cuenta de *Meta Business Manager* para tu agencia, selecciónala aquí. Si no, podés dejarlo en "Ninguna cuenta comercial seleccionada" y Meta la creará automáticamente.
5. Hacé clic en **Crear app** e ingresá tu contraseña de Facebook por seguridad.

---

## Paso 3: Agregar el Producto de WhatsApp a la App de Meta

1. Una vez dentro de la app que creaste, si seleccionaste la opción de WhatsApp en el paso anterior, verás directamente la pantalla de inicio de WhatsApp.
2. Si fuiste por el camino de "Otro -> Negocios", verás el panel con múltiples productos. Buscá el producto **WhatsApp** y hacé clic en **Configurar** (Set up).
3. Meta te preguntará si deseás crear o seleccionar una cuenta comercial. Si no tenés una, hacé clic en continuar para crear una cuenta comercial básica de Meta.
4. Al finalizar este paso, Meta te redirigirá a la pestaña de **Configuración de la API** y te asignará automáticamente:
   - Un **número de prueba gratuito** de Meta (para hacer testeos).
   - Un **Phone Number ID** (ID de número de teléfono de prueba).
   - Un **WABA ID** (ID de cuenta de WhatsApp Business).
   - Un **Token de acceso temporal** (que dura 24 horas).

---

## Paso 4: Configurar tu Número Real de WhatsApp Business

Para dejar de usar el número de prueba de Meta y empezar a usar tu propio número de WhatsApp Business de la agencia **Galu**:

1. En la misma pantalla de **Configuración de la API**, buscá la sección de **Paso 5: Añadir un número de teléfono** (al final de la página) y hacé clic en **Añadir número de teléfono**.
2. Completá los datos del perfil de tu negocio:
   - **Nombre de pantalla**: `Galu` (Debe cumplir con las políticas de nombre de Meta).
   - **Zona horaria** y **Categoría** (ej: Servicios profesionales).
3. Ingresá tu número de teléfono de WhatsApp Business.
   > [!WARNING]
   > El número que registres **no debe tener una cuenta activa de WhatsApp normal o WhatsApp Business en un celular** al mismo tiempo. Si ya la tiene, debés eliminar la cuenta de WhatsApp de la aplicación de tu celular antes de registrarla en la API de Meta.
4. Verificá el número mediante un código SMS o llamada telefónica que te enviará Meta.
5. Una vez verificado, tu número real aparecerá en la lista desplegable de la sección **Paso 1: Seleccionar número de teléfono**, y obtendrás su propio **Phone Number ID**.

---

## Paso 5: Generar un Token de Acceso Permanente (System User Token)

El token temporal de Meta expira en 24 horas. Para que el SaaS funcione de manera continua e indefinida, necesitás un **Token Permanente**:

1. Entrá a la [Configuración del Negocio de Meta](https://business.facebook.com/settings).
2. Seleccioná tu Cuenta Comercial (Business Manager).
3. En el menú lateral izquierdo, ve a **Usuarios** (Users) -> **Usuarios del sistema** (System Users).
4. Hacé clic en **Añadir** (Add) para crear un nuevo usuario del sistema:
   - Nombre: `SaaS Chatbot Admin`
   - Rol del usuario: **Administrador**.
5. Una vez creado el usuario del sistema, hacé clic en **Asignar activos** (Assign Assets):
   - Seleccioná **Apps** -> Elegí tu aplicación `Galu Chatbot` -> Habilitá el control total (Administrar app).
   - Seleccioná **Cuentas de WhatsApp** -> Elegí tu cuenta de WhatsApp Business -> Habilitá el control total.
6. Hacé clic en **Generar nuevo token** (Generate New Token):
   - Seleccioná tu aplicación (`Galu Chatbot`).
   - Marcá los siguientes permisos (muy importante):
     - `whatsapp_business_messaging`
     - `whatsapp_business_management`
   - Hacé clic en **Generar Token**.
7. **Copia el token generado inmediatamente** y guárdalo en un lugar seguro (Meta no lo volverá a mostrar). Este token no expira nunca.

---

## Paso 6: Vincular las Credenciales en el Panel del Cliente

1. Iniciá sesión en tu plataforma SaaS con tu usuario superadmin o de cliente.
2. Navegá al panel de **Galu** y andá a **Configurar WhatsApp** (en el menú lateral del negocio).
3. Completá las credenciales con los datos que obtuviste en Meta:
   - **Phone Number ID**: El ID numérico de tu número verificado (Paso 4).
   - **WhatsApp Business Account ID (WABA ID)**: El ID de la cuenta de WhatsApp de Meta (Paso 3).
   - **Access Token**: El **Token Permanente** que generaste (Paso 5).
   - **Token de Verificación del Webhook (Verify Token)**: Escribí una frase secreta inventada por vos (por ejemplo: `galu_webhook_secret_2026`).
4. Hacé clic en **Guardar Configuración**.

---

## Paso 7: Configurar el Webhook en Meta Developers

Este paso conecta Meta con tu plataforma para que cuando un cliente escriba a WhatsApp, el mensaje sea procesado por la IA.

1. En el panel de control de tu negocio en el SaaS, dentro de la sección **Configurar WhatsApp**, verás un cuadro a la derecha llamado **Sincronización Webhook**.
2. Copiá la **Webhook URL** dinámica generada por la plataforma, que tiene el siguiente formato:
   `https://[TU-PROYECTO-SUPABASE].supabase.co/functions/v1/whatsapp-webhook?business_id=[ID-DE-GALU]`
3. Volvé a [Meta for Developers](https://developers.facebook.com/) y abrí tu aplicación.
4. En el menú lateral izquierdo, ve a **WhatsApp** -> **Configuración** (Configuration).
5. En la sección **Webhook**, hacé clic en **Editar** (Edit):
   - **URL de la llamada (Callback URL)**: Pegá la **Webhook URL** que copiaste del SaaS.
   - **Token de verificación (Verify Token)**: Pegá la frase secreta que inventaste en el paso 6 (ej: `galu_webhook_secret_2026`).
   - Hacé clic en **Verificar y guardar**. Meta hará una consulta automática al endpoint y quedará enlazado.
6. En la misma sección de configuración de Webhooks, hacé clic en **Administrar** (Manage) junto a "Campos del Webhook".
7. Buscá el campo llamado **messages** y hacé clic en **Suscribirse** (Subscribe).
8. ¡Listo! Todo mensaje que reciba el número de WhatsApp de **Galu** ahora se enviará a tu backend, donde Gemini lo responderá automáticamente basándose en tus reglas de IA.

---

## 💡 Recomendación para Probar el Sistema
Para tus primeras pruebas, podés dejar activo el número de testeo que te da Meta en el Paso 3 y usar un número de teléfono tuyo personal como destinatario de pruebas, sin tener que desconectar tu cuenta de WhatsApp Business móvil inmediatamente. Una vez verificado que el bot responde correctamente, hacés el paso de vinculación definitiva de tu número comercial.
