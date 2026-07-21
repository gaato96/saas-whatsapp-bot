# SaaS Chatbot Inteligente para Negocios (WhatsApp & Gemini 3.6 Flash)

Plataforma SaaS Multi-tenant adaptativa para 10 rubros comerciales. Permite a los negocios conectar su propia cuenta de WhatsApp Cloud API, configurar su contexto e información de negocio, y dejar que un agente inteligente impulsado por **Google Gemini 3.6 Flash** atienda a sus clientes, responda preguntas frecuentes, muestre el catálogo de productos con stock en tiempo real, agende turnos, y gestione pedidos automáticamente.

## 🚀 Características Principales

*   **Multi-tenancy Físico y Lógico**: Aislamiento total de datos por `business_id` implementado a nivel de base de datos con políticas RLS (Row Level Security) en Supabase.
*   **Inteligencia Artificial Adaptativa**: System prompts dinámicos construidos en tiempo real que combinan el rubro del negocio (ej. Pizzerías, Peluquerías, Tiendas de Ropa, Zapatillerías) con sus reglas de atención y catálogo de productos actualizado.
*   **Inbox en Tiempo Real (CRM)**: Panel de chat en vivo y gestión de pedidos integrado con Supabase Realtime para que los agentes humanos puedan tomar el control del chat o ver los pedidos conforme entran.
*   **WhatsApp Cloud API Integration**: Webhook unificado en Supabase Edge Functions que recibe mensajes de múltiples números de Meta y los enruta automáticamente al tenant correspondiente según el `phone_number_id`.

---

## 🛠️ Estructura del Proyecto

```text
├── src/
│   ├── app/                 # Rutas de Next.js (App Router)
│   │   ├── admin/           # Panel Superadmin (Creación y listado de negocios)
│   │   ├── dashboard/       # Dashboard del cliente (CRM, Chat, Inventario, Config)
│   │   ├── login/           # Autenticación de usuarios
│   │   └── page.tsx         # Landing page de la plataforma
│   ├── components/          # Componentes de UI (Sidebar, tablas, chats)
│   ├── lib/                 # Clientes SDK (Supabase, Gemini)
│   └── middleware.ts        # Control de acceso y sesiones
├── supabase/
│   ├── functions/           # Supabase Edge Functions (Webhook de WhatsApp)
│   └── supabase_schema.sql  # Esquema de base de datos y políticas de seguridad
```

---

## ⚙️ Variables de Entorno Requeridas

Para que la plataforma funcione en producción (Vercel y Supabase), debes configurar las siguientes variables de entorno:

### En el Dashboard de Vercel (Next.js App)
| Variable | Descripción | Ejemplo |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto de Supabase | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Llave anónima pública de Supabase | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `GEMINI_API_KEY` | API Key global de Google Gemini 3.6 | `AIzaSy...` |

### En Supabase Edge Functions (Consola de Supabase)
| Variable | Descripción | Ejemplo |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | API Key global de Google Gemini 3.6 | `AIzaSy...` |

---

## 📦 Despliegue Paso a Paso

Sigue las guías detalladas a continuación para desplegar todo el sistema en producción:

### Paso 1: Subir el Código a GitHub
1. Inicializa tu repositorio git local (si no está inicializado):
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit for deployment"
   ```
2. Agrega el origen remoto y sube tus cambios:
   ```bash
   git remote add origin https://github.com/gaato96/saas-whatsapp-bot.git
   git branch -M main
   git push -u origin main
   ```

### Paso 2: Desplegar la Base de Datos en Supabase
1. Crea un proyecto nuevo en [Supabase](https://supabase.com/).
2. Ve a la sección **SQL Editor** en tu panel de Supabase y crea un "New Query".
3. Copia el contenido del archivo `supabase_schema.sql` de tu proyecto y ejecútalo. Esto creará:
   * Las tablas `businesses`, `products`, `orders`, `order_items`, `customers`, `chat_messages` y `appointments`.
   * Las políticas de seguridad RLS para el aislamiento multi-tenant.
   * Los triggers automáticos para actualización de auditorías.

### Paso 3: Desplegar el Webhook de WhatsApp (Supabase Edge Functions)
1. Instala el CLI de Supabase localmente si aún no lo tienes:
   ```bash
   npm install -g supabase
   ```
2. Inicia sesión en Supabase desde tu terminal:
   ```bash
   supabase login
   ```
3. Enlaza tu proyecto local con el de Supabase (te pedirá la contraseña del proyecto):
   ```bash
   supabase link --project-ref <tu-project-reference-id>
   ```
4. Despliega la función `whatsapp-webhook`:
   ```bash
   supabase functions deploy whatsapp-webhook --no-verify-jwt
   ```
   *(Nota: Se usa `--no-verify-jwt` para permitir que los webhooks entrantes de Facebook/Meta puedan invocar la función sin token de Supabase).*
5. Configura la API Key de Gemini en los secretos de Supabase:
   ```bash
   supabase secrets set GEMINI_API_KEY="TU_API_KEY_DE_GEMINI"
   ```

### Paso 4: Configurar el Webhook en Facebook Developer Portal
1. En tu panel de Meta for Developers (WhatsApp Cloud API):
   * Ve a **WhatsApp** > **Configuración**.
   * En **Webhook**, haz clic en **Editar**.
   * Introduce la URL de tu Edge Function desplegada:
     `https://<tu-project-ref>.supabase.co/functions/v1/whatsapp-webhook`
   * En **Token de verificación**, introduce la palabra clave configurada en el código (por defecto es `antigravity_token`).
   * Suscríbete a los campos de webhook: **messages**.

### Paso 5: Desplegar en Vercel
1. Ve a [Vercel](https://vercel.com/) e inicia sesión.
2. Haz clic en **Add New** > **Project** e importa tu repositorio `saas-whatsapp-bot`.
3. En la configuración del proyecto:
   * **Framework Preset**: Next.js.
   * **Root Directory**: `./`.
   * Expande **Environment Variables** y agrega las 3 variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, y `GEMINI_API_KEY`).
4. Haz clic en **Deploy**. ¡Listo! Vercel compilará tu aplicación y te dará una URL pública.

---

## 🧪 Pruebas Locales (Demo Offline)

Si las variables de entorno de Supabase no están configuradas en tu entorno local, el sistema entrará automáticamente en **Modo Demostración Offline**.
Esto te permite navegar por todas las rutas del ERP sin necesidad de configurar una base de datos real:
*   **CRM / Pedidos**: [/dashboard/demo-business-id](http://localhost:3000/dashboard/demo-business-id)
*   **Catálogo Multirubro**: [/dashboard/zapas-premium/products](http://localhost:3000/dashboard/zapas-premium/products) (detecta "zapas-premium" y cambia los datos a zapatillas deportivas).
*   **Inbox en Tiempo Real**: [/dashboard/demo-business-id/chat](http://localhost:3000/dashboard/demo-business-id/chat) (simula chat interactivo).
