import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidad | Galu Diseño Web',
  description: 'Política de privacidad del servicio de chatbot automatizado de Galu Diseño Web. Conocé cómo manejamos y protegemos tu información.',
}

export default function PrivacyPolicyPage() {
  const lastUpdated = '23 de junio de 2026'

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-lg bg-gradient-to-tr from-purple-600 to-purple-400 flex items-center justify-center font-black text-xs text-white">
              G
            </span>
            <span className="font-bold text-sm text-white">Galu Diseño Web</span>
          </Link>
          <Link href="/" className="text-xs text-zinc-400 hover:text-white transition-colors">
            ← Volver al inicio
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16 space-y-12">
        {/* Title */}
        <div className="space-y-4 border-b border-zinc-800 pb-10">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-1.5 text-xs text-purple-400 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
            Documento Legal
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Política de Privacidad</h1>
          <p className="text-zinc-400 text-sm">Última actualización: <strong className="text-zinc-300">{lastUpdated}</strong></p>
        </div>

        {/* Sections */}
        <div className="space-y-10 text-sm text-zinc-300 leading-relaxed">

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">1. Información General</h2>
            <p>
              Esta Política de Privacidad describe cómo <strong className="text-white">Galu Diseño Web</strong> (en adelante &quot;Galu&quot;, &quot;nosotros&quot; o &quot;el servicio&quot;), titular del chatbot automatizado integrado a través de la API de WhatsApp Cloud de Meta, recopila, utiliza y protege la información personal de los usuarios que interactúan con nuestro servicio.
            </p>
            <p>
              Al interactuar con nuestro chatbot a través de WhatsApp u otros canales digitales, aceptás los términos descritos en esta política.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">2. Datos que Recopilamos</h2>
            <p>Cuando interactuás con nuestro chatbot o servicio, podemos recopilar los siguientes tipos de información:</p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-zinc-400">
              <li><strong className="text-zinc-300">Datos de identificación:</strong> Nombre de perfil de WhatsApp y número de teléfono.</li>
              <li><strong className="text-zinc-300">Contenido de mensajes:</strong> El texto de los mensajes que enviás a través del chatbot para poder responder a tus consultas.</li>
              <li><strong className="text-zinc-300">Datos de transacciones:</strong> Información sobre pedidos, reservas o servicios que solicitás a través del sistema.</li>
              <li><strong className="text-zinc-300">Historial de conversaciones:</strong> Registro de las interacciones para mantener el contexto de la charla y mejorar la calidad del servicio.</li>
              <li><strong className="text-zinc-300">Datos técnicos:</strong> Información de uso como marcas de tiempo de mensajes y metadatos de la API de WhatsApp de Meta.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. Cómo Usamos tu Información</h2>
            <p>Utilizamos los datos recopilados para las siguientes finalidades:</p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-zinc-400">
              <li>Responder tus consultas y mensajes a través del chatbot automatizado.</li>
              <li>Procesar pedidos, reservas o solicitudes de servicios.</li>
              <li>Mantener el historial de conversación para brindar una experiencia coherente y personalizada.</li>
              <li>Mejorar nuestros servicios y la calidad de las respuestas del sistema.</li>
              <li>Cumplir con obligaciones legales y prevenir fraudes.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. Tecnologías de Terceros</h2>
            <p>Nuestro servicio utiliza las siguientes plataformas de terceros para su funcionamiento:</p>
            <div className="space-y-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-1">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider">Meta (WhatsApp Cloud API)</h3>
                <p className="text-zinc-400 text-xs">Los mensajes se transmiten a través de la infraestructura de Meta Platforms Inc. Aplicán los <a href="https://www.whatsapp.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">Términos de Privacidad de WhatsApp</a>.</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-1">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider">Google Gemini API</h3>
                <p className="text-zinc-400 text-xs">El contenido de los mensajes es procesado por la IA de Google Gemini para generar respuestas. Aplican las <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">Políticas de Privacidad de Google</a>.</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-1">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider">Supabase</h3>
                <p className="text-zinc-400 text-xs">Utilizamos Supabase como base de datos y backend para almacenar el historial de conversaciones y datos de transacciones de forma segura.</p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">5. Conservación de Datos</h2>
            <p>
              Conservamos los datos de conversación y transacciones durante el tiempo necesario para prestar el servicio y cumplir con nuestras obligaciones legales. Los mensajes y el historial de chat pueden conservarse por un período de hasta <strong className="text-white">12 meses</strong>, salvo que solicitemos su eliminación antes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">6. Tus Derechos</h2>
            <p>Tenés derecho a:</p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-zinc-400">
              <li><strong className="text-zinc-300">Acceder</strong> a la información personal que tenemos sobre vos.</li>
              <li><strong className="text-zinc-300">Rectificar</strong> datos incorrectos o incompletos.</li>
              <li><strong className="text-zinc-300">Solicitar la eliminación</strong> de tus datos personales de nuestros sistemas.</li>
              <li><strong className="text-zinc-300">Oponerte</strong> al procesamiento de tu información en ciertos casos.</li>
            </ul>
            <p>Para ejercer cualquiera de estos derechos, podés contactarnos a: <strong className="text-white">privacidad@galu.com.ar</strong></p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">7. Seguridad</h2>
            <p>
              Implementamos medidas técnicas y organizativas razonables para proteger tu información personal contra el acceso no autorizado, pérdida o destrucción. Sin embargo, ningún sistema de transmisión de datos por internet es 100% seguro, por lo que no podemos garantizar la seguridad absoluta.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">8. Cambios en esta Política</h2>
            <p>
              Podemos actualizar esta Política de Privacidad periódicamente. Te notificaremos sobre cambios significativos publicando la nueva versión en esta misma página con la fecha de actualización indicada al inicio del documento.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">9. Contacto</h2>
            <p>
              Si tenés preguntas o inquietudes sobre esta Política de Privacidad, podés comunicarte con nosotros a través de:
            </p>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-2 text-xs">
              <p><strong className="text-white">Empresa:</strong> Galu Diseño Web</p>
              <p><strong className="text-white">Email:</strong> privacidad@galu.com.ar</p>
              <p><strong className="text-white">País:</strong> Argentina</p>
            </div>
          </section>

        </div>

        {/* Footer link */}
        <div className="pt-10 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">© 2026 Galu Diseño Web. Todos los derechos reservados.</p>
          <Link href="/terminos" className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
            Ver Términos y Condiciones →
          </Link>
        </div>
      </main>
    </div>
  )
}
