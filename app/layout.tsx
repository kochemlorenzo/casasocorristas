import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Casa Socorrista — Saúde e Bem-Estar',
  description: 'Saúde e bem-estar você encontra aqui! Produtos farmacêuticos, suplementos, higiene e muito mais.',
  keywords: ['farmácia', 'saúde', 'bem-estar', 'medicamentos', 'São Luís'],
  openGraph: {
    title: 'Casa Socorrista',
    description: 'Saúde e bem-estar você encontra aqui!',
    locale: 'pt_BR',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="font-body bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
}
