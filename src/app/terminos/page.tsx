import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Términos y Condiciones | Galu Diseño Web',
  description: 'Términos y condiciones del servicio de chatbot automatizado de Galu Diseño Web. Conocé las reglas de uso del sistema.',
}

export default function TerminosPage() {
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
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Términos y Condiciones</h1>
          <p className="text-zinc-400 text-sm">Última actualización: <strong className="text-zinc-300">{lastUpdated}</strong></p>
        </div>

        {/* Sections */}
        <div className="space-y-10 text-sm text-zinc-300 leading-relaxed">

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">1. Aceptación de los Términos</h2>
            <p>
              Al utilizar el servicio de chatbot automatizado provisto por <strong className="text-white">Galu Diseño Web</strong> (en adelante &quot;Galu&quot;, &quot;nosotros&quot; o &quot;el servicio&quot;) a través de WhatsApp u otros canales digitales, aceptás estar sujeto a estos Términos y Condiciones. Si no estás de acuerdo con alguna parte de estos términos, por favor no utilices el servicio.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">2. Descripción del Servicio</h2>
            <p>
              Galu Diseño Web ofrece un sistema de atención automatizada mediante inteligencia artificial integrado en WhatsApp. El servicio permite a los usuarios:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-zinc-400">
              <li>Consultar información sobre los servicios de la agencia.</li>
              <li>Solicitar presupuestos y consultas de diseño web.</li>
              <li>Agendar reuniones y turnos de consultoría.</li>
              <li>Recibir asistencia y soporte sobre proyectos activos.</li>
            </ul>
            <p>
              El chatbot está impulsado por tecnología de inteligencia artificial (Google Gemini) y responde automáticamente a las consultas dentro de las capacidades y el catálogo de servicios del negocio.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. Uso Aceptable</h2>
            <p>Al utilizar nuestro servicio, te comprometés a:</p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-zinc-400">
              <li>Utilizar el chatbot únicamente para los fines legítimos descritos en el punto anterior.</li>
              <li>No intentar hackear, sobrecargar o manipular el sistema de respuestas automáticas.</li>
              <li>No enviar mensajes de spam, contenido abusivo, ofensivo, ilegal o difamatorio.</li>
              <li>No intentar obtener información de otros usuarios del sistema.</li>
              <li>Proveer información veraz y precisa cuando sea requerida para procesar pedidos o reservas.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. Limitación de Responsabilidad</h2>
            <p>
              Dado que el servicio utiliza inteligencia artificial generativa para producir respuestas, <strong className="text-white">Galu</strong> no garantiza que todas las respuestas del chatbot sean 100% precisas, completas o actualizadas en todo momento. Las respuestas generadas son de carácter orientativo.
            </p>
            <p>
              En ningún caso Galu será responsable por daños directos, indirectos, incidentales o consecuentes derivados del uso del servicio, incluyendo pero no limitado a: pérdida de datos, interrupción del servicio, o decisiones tomadas en base a las respuestas del chatbot.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">5. Propiedad Intelectual</h2>
            <p>
              Todo el contenido, diseño, código y funcionalidad del servicio son propiedad exclusiva de <strong className="text-white">Galu Diseño Web</strong> y están protegidos por las leyes de propiedad intelectual de la República Argentina y tratados internacionales. Queda prohibida su reproducción total o parcial sin autorización expresa por escrito.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">6. Interacción con la Plataforma de WhatsApp</h2>
            <p>
              El uso del servicio a través de WhatsApp está sujeto adicionalmente a los <a href="https://www.whatsapp.com/legal/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">Términos del Servicio de WhatsApp</a> de Meta Platforms Inc. El usuario es responsable de cumplir con dichos términos al utilizar el canal de comunicación.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">7. Disponibilidad del Servicio</h2>
            <p>
              Galu Diseño Web realiza sus mejores esfuerzos para mantener el servicio disponible de forma continua. Sin embargo, no garantizamos una disponibilidad del 100%, y el servicio puede estar temporalmente inaccesible por razones de mantenimiento, actualizaciones técnicas, fallas en infraestructuras de terceros (Meta, Google, Supabase) u otras causas fuera de nuestro control.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">8. Modificaciones al Servicio</h2>
            <p>
              Nos reservamos el derecho de modificar, suspender o discontinuar cualquier aspecto del servicio en cualquier momento, sin previo aviso. También podemos modificar estos Términos y Condiciones. El uso continuado del servicio tras la publicación de cambios constituye la aceptación de los nuevos términos.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">9. Jurisdicción y Ley Aplicable</h2>
            <p>
              Estos Términos y Condiciones se rigen por las leyes de la <strong className="text-white">República Argentina</strong>. Cualquier disputa relacionada con estos términos estará sujeta a la jurisdicción exclusiva de los tribunales ordinarios de la ciudad de <strong className="text-white">Tucumán, Argentina</strong>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">10. Contacto</h2>
            <p>
              Para consultas relacionadas con estos Términos y Condiciones, podés contactarnos en:
            </p>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-2 text-xs">
              <p><strong className="text-white">Empresa:</strong> Galu Diseño Web</p>
              <p><strong className="text-white">Email:</strong> legal@galu.com.ar</p>
              <p><strong className="text-white">País:</strong> Argentina</p>
              <p><strong className="text-white">Ciudad:</strong> Tucumán</p>
            </div>
          </section>

        </div>

        {/* Footer link */}
        <div className="pt-10 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">© 2026 Galu Diseño Web. Todos los derechos reservados.</p>
          <Link href="/privacidad" className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
            Ver Política de Privacidad →
          </Link>
        </div>
      </main>
    </div>
  )
}
