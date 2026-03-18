'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShoppingCart, Menu, X, Phone } from 'lucide-react'

export default function Header({ cartCount, onCartOpen }: {
  cartCount: number
  onCartOpen: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center text-white font-display font-bold text-lg">
              CS
            </div>
            <span className="font-display font-bold text-gray-900 text-lg hidden sm:block">
              Casa Socorrista
            </span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/" className="btn-ghost text-sm">Início</Link>
            <Link href="/loja" className="btn-ghost text-sm">Produtos</Link>
            <Link href="/conta" className="btn-ghost text-sm">Minha Conta</Link>
            <a href="https://wa.me/5598989888035" target="_blank" rel="noopener"
              className="btn-ghost text-sm flex items-center gap-1">
              <Phone size={14} /> Contato
            </a>
          </nav>

          {/* Ações */}
          <div className="flex items-center gap-2">
            <button onClick={onCartOpen}
              className="relative p-2 rounded-xl hover:bg-brand-50 transition-colors">
              <ShoppingCart size={22} className="text-gray-700" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>

            <button onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors">
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Menu mobile */}
        {menuOpen && (
          <div className="md:hidden py-3 border-t border-gray-100 animate-in">
            <nav className="flex flex-col gap-1">
              <Link href="/" onClick={() => setMenuOpen(false)}
                className="px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-medium">Início</Link>
              <Link href="/loja" onClick={() => setMenuOpen(false)}
                className="px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-medium">Produtos</Link>
              <a href="https://wa.me/5598989888035" target="_blank" rel="noopener"
                className="px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-medium flex items-center gap-2">
                <Phone size={14} /> Contato WhatsApp
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
