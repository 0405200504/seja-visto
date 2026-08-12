import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { MetaPixel } from "@/components/meta-pixel";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Manual Prático do Outfit (MPO)",
    template: "%s · Manual Prático do Outfit",
  },
  description:
    "A plataforma de estilo masculino de Raphael Pereira. Fundamentos, combinações prontas, guarda-roupa inteligente e plano de ação.",
  // Faz o iOS abrir em tela cheia (sem a barra do Safari) quando o aluno
  // adiciona o MPO à tela inicial. No Android quem cuida disso é o manifest.
  appleWebApp: {
    capable: true,
    title: "MPO",
    statusBarStyle: "black-translucent",
  },
  other: {
    // O Next só emite a tag moderna `mobile-web-app-capable`. iPhones em iOS
    // antigo ignoram ela e abrem com a barra do Safari — a tag da Apple é o
    // que garante a tela cheia neles.
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#06080c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${spaceGrotesk.variable} antialiased`}>
        {children}
        <MetaPixel />
      </body>
    </html>
  );
}
