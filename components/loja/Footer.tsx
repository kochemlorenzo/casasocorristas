import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Instagram } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">

          {/* Logo + descrição */}
          <div>
            <div className="mb-4 bg-white rounded-xl inline-block px-3 py-2">
              <Image
                src="/logo.png"
                alt="Casa Socorrista"
                width={140}
                height={48}
                className="h-12 w-auto object-contain"
              />
            </div>
            <p className="text-sm leading-relaxed">
              Saúde e bem-estar você encontra aqui! 💚<br />
              Qualidade e cuidado em cada produto.
            </p>
          </div>

          {/* Unidades */}
          <div>
            <h4 className="text-white font-semibold mb-4">Unidades</h4>
            <ul className="space-y-2 text-sm">
              {['Cohab Anil', 'Maiobão', 'Cidade Operária', 'Cohama'].map(u => (
                <li key={u} className="flex items-center gap-2">
                  <MapPin size={13} className="text-brand-500 flex-shrink-0" />
                  <span>{u}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contato</h4>
            <div className="space-y-3 text-sm">
              <a href="https://wa.me/5598989888035" target="_blank" rel="noopener"
                className="flex items-center gap-2 hover:text-green-400 transition-colors">
                <span className="text-green-500">●</span> WhatsApp
              </a>
              <a href="https://www.instagram.com/casasocorrista/" target="_blank" rel="noopener"
                className="flex items-center gap-2 hover:text-pink-400 transition-colors">
                <Instagram size={14} className="text-pink-500" /> @casasocorrista
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <p>© {new Date().getFullYear()} Casa Socorrista. Todos os direitos reservados.</p>
          <Link href="/admin" className="hover:text-white transition-colors">Área Administrativa</Link>
        </div>
      </div>
    </footer>
  )
}
