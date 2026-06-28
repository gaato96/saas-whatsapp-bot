import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "./pwa-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: '#25d366',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: "ZapFlow — Gestión Inteligente para Negocios",
  description: "Administrá pedidos, turnos y reservas desde tu celular. Chatbot WhatsApp con IA para cualquier tipo de negocio.",
  keywords: ["chatbot whatsapp", "gestión de pedidos", "turnos online", "bot para negocios", "sistema de reservas"],
  authors: [{ name: "ZapFlow" }],
  creator: "ZapFlow",
  publisher: "ZapFlow",
  robots: "index, follow",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ZapFlow",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    title: "ZapFlow — Gestión Inteligente para Negocios",
    description: "Chatbot WhatsApp con IA + gestión de pedidos, turnos y clientes en tiempo real.",
    siteName: "ZapFlow",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="apple-touch-icon" href="/zapflow-icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full flex flex-col">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
