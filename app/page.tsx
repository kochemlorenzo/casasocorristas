'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient, type Produto } from '@/lib/supabase'
import Header from '@/components/loja/Header'
import Footer from '@/components/loja/Footer'
import ProductCard from '@/components/loja/ProductCard'
import CartSidebar from '@/components/loja/CartSidebar'
import { useCart } from '@/hooks/useCart'
import { MapPin, Phone, Shield, Truck, Star, ChevronRight, Leaf } from 'lucide-react'

// ✅ Maiobão removido
const UNIDADES = [
  { nome: 'Unidade Cohab', endereco: 'Av. Jerônimo Albuquerque, 54 - Cohab Anil' },
  { nome: 'Cidade Operária', endereco: 'Av. 203, 25-A - Cidade Operária' },
  { nome: 'Bairro Cohama', endereco: 'Av. Daniel de la Touche, nº 08 loja 02' },
]

export default function HomePage() {
  const supabase = createClient()
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const { cart, addToCart, removeFromCart, updateQty, cartCount, cartTotal, clearCart } = useCart()
  const [cartOpen, setCartOpen] = useState(false)

  useEffect(() => {
    async function loadProdutos() {
      const { data } = await supabase
        .from('produtos')
        .select('*, categorias(nome,slug)')
        .eq('ativo', true)
        .eq('destaque', true)
        .order('criado_em', { ascending: false })
        .limit(8)
      if (data) setProdutos(data)
      setLoading(false)
    }
    loadProdutos()
  }, [])

  return (
    <>
      <Header cartCount={cartCount} onCartOpen={() => setCartOpen(true)} />
      <CartSidebar
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onRemove={removeFromCart}
        onUpdateQty={updateQty}
        total={cartTotal}
        onClear={clearCart}
      />

      {/* HERO */}
      <section className="relative bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-brand-300 blur-3xl" />
        </div>
        <div className="container mx-auto px-4 py-24 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm mb-6">
              <Leaf size={14} />
              <span>Saúde e Bem-Estar em São Luís</span>
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-bold leading-tight mb-6">
              Cuidando da sua <span className="text-brand-200">saúde</span> com carinho
            </h1>
            <p className="text-brand-100 text-xl mb-10 leading-relaxed">
              Encontre medicamentos, suplementos, produtos de higiene e muito mais.
              Qualidade garantida em todas as nossas unidades.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/loja" className="btn-primary bg-white text-brand-700 hover:bg-brand-50 inline-flex items-center gap-2 justify-center">
                Ver Produtos <ChevronRight size={18} />
              </Link>
              <a href="https://wa.me/5598989888035" target="_blank" rel="noopener"
                className="btn-secondary border-white text-white hover:bg-white/10 inline-flex items-center gap-2 justify-center">
                <Phone size={18} /> Falar no WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section className="border-b border-gray-100 bg-brand-50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: 'Produtos Originais', desc: 'Garantia de procedência' },
              { icon: MapPin, title: '3 Unidades', desc: 'Em toda São Luís' },
              { icon: Star, title: 'Atendimento 5★', desc: 'Equipe especializada' },
              { icon: Truck, title: 'Delivery', desc: 'Entrega rápida' },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center flex-shrink-0">
                  <b.icon size={20} />
                </div>
                <div>
                  <div className="font-semibold text-sm text-gray-900">{b.title}</div>
                  <div className="text-xs text-gray-500">{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUTOS EM DESTAQUE */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-brand-600 font-semibold text-sm mb-1">Seleção especial</p>
              <h2 className="section-title">Produtos em Destaque</h2>
            </div>
            <Link href="/loja" className="text-brand-600 hover:text-brand-700 font-medium text-sm flex items-center gap-1">
              Ver todos <ChevronRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="aspect-square bg-gray-200" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : produtos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {produtos.map((p, i) => (
                <div key={p.id} className="animate-in" style={{ animationDelay: `${i * 60}ms` }}>
                  <ProductCard produto={p} onAddToCart={addToCart} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <Shield size={48} className="mx-auto mb-4 opacity-30" />
              <p>Nenhum produto em destaque ainda.</p>
              <Link href="/loja" className="text-brand-600 text-sm mt-2 inline-block">Ver todos os produtos →</Link>
            </div>
          )}
        </div>
      </section>

      {/* BANNER CTA */}
      <section className="bg-brand-900 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-4xl font-bold mb-4">Precisa de orientação?</h2>
          <p className="text-brand-200 text-lg mb-8 max-w-xl mx-auto">
            Nossa equipe está pronta pra te ajudar. Entre em contato pelo WhatsApp e tire suas dúvidas.
          </p>
          <a href="https://wa.me/5598989888035" target="_blank" rel="noopener"
            className="btn-primary bg-green-500 hover:bg-green-400 inline-flex items-center gap-2">
            <Phone size={18} /> Chamar no WhatsApp
          </a>
        </div>
      </section>

      {/* UNIDADES */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-brand-600 font-semibold text-sm mb-1">Estamos perto de você</p>
            <h2 className="section-title">Nossas Unidades</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {UNIDADES.map((u, i) => (
              <div key={i} className="card p-6 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center mb-4">
                  <MapPin className="text-brand-600" size={20} />
                </div>
                <h3 className="font-display font-bold text-gray-900 mb-2">{u.nome}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{u.endereco}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
