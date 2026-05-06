'use client'

import { useEffect, useState } from 'react'
import { createClient, type Produto, type Categoria } from '@/lib/supabase'
import Header from '@/components/loja/Header'
import Footer from '@/components/loja/Footer'
import ProductCard from '@/components/loja/ProductCard'
import CartSidebar from '@/components/loja/CartSidebar'
import { useCart } from '@/hooks/useCart'
import { Search, SlidersHorizontal, X, Accessibility } from 'lucide-react'

// Slugs das categorias PCD
const SLUGS_PCD = [
  'cadeirantes',
  'idosos',
  'baixa-visao',
  'mobilidade-reduzida',
  'fraldas-geriatricas',
  'equipamentos-hospitalares',
]

export default function LojaPage() {
  const supabase = createClient()
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catAtiva, setCatAtiva] = useState<string | null>(null)
  const [ordenar, setOrdenar] = useState('nome')
  const { cart, addToCart, removeFromCart, updateQty, cartCount, cartTotal, clearCart } = useCart()
  const [cartOpen, setCartOpen] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: cats }, { data: prods }] = await Promise.all([
        supabase.from('categorias').select('*').eq('ativo', true).order('nome'),
        supabase.from('produtos').select('*, categorias(nome,slug)').eq('ativo', true).order('nome'),
      ])
      if (cats) setCategorias(cats)
      if (prods) setProdutos(prods)
      setLoading(false)
    }
    load()
  }, [])

  // Separar categorias normais e PCD
  const categoriasPCD = categorias.filter(c => SLUGS_PCD.includes(c.slug))
  const categoriasNormais = categorias.filter(c => !SLUGS_PCD.includes(c.slug))

  const produtosFiltrados = produtos
    .filter(p => {
      const matchSearch = search === '' ||
        p.nome.toLowerCase().includes(search.toLowerCase()) ||
        p.descricao_curta?.toLowerCase().includes(search.toLowerCase())
      const matchCat = catAtiva === null || p.categoria_id === catAtiva
      return matchSearch && matchCat
    })
    .sort((a, b) => {
      if (ordenar === 'preco-asc') return (a.preco_promocional ?? a.preco) - (b.preco_promocional ?? b.preco)
      if (ordenar === 'preco-desc') return (b.preco_promocional ?? b.preco) - (a.preco_promocional ?? a.preco)
      return a.nome.localeCompare(b.nome)
    })

  return (
    <>
      <Header cartCount={cartCount} onCartOpen={() => setCartOpen(true)} />
      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)}
        cart={cart} onRemove={removeFromCart} onUpdateQty={updateQty}
        total={cartTotal} onClear={clearCart} />

      {/* Topo */}
      <div className="bg-brand-700 text-white py-10">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-3xl font-bold mb-2">Nossos Produtos</h1>
          <p className="text-brand-200">Encontre tudo que você precisa para sua saúde</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Barra de busca e ordenação */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar produto..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-9"
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-gray-400 flex-shrink-0" />
            <select value={ordenar} onChange={e => setOrdenar(e.target.value)}
              className="input w-auto cursor-pointer">
              <option value="nome">Nome A–Z</option>
              <option value="preco-asc">Menor preço</option>
              <option value="preco-desc">Maior preço</option>
            </select>
          </div>
        </div>

        {/* Categorias normais */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
          <button
            onClick={() => setCatAtiva(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              catAtiva === null ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}>
            Todos
          </button>
          {categoriasNormais.map(c => (
            <button key={c.id}
              onClick={() => setCatAtiva(catAtiva === c.id ? null : c.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                catAtiva === c.id ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}>
              {c.nome}
            </button>
          ))}
        </div>

        {/* Seção PCD — destaque visual */}
        {categoriasPCD.length > 0 && (
          <div className="mb-6 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2 mb-3">
              <Accessibility size={16} className="text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">Acessibilidade e PCD</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {categoriasPCD.map(c => (
                <button key={c.id}
                  onClick={() => setCatAtiva(catAtiva === c.id ? null : c.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    catAtiva === c.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-100'
                  }`}>
                  {c.nome}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Grid de produtos */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="aspect-square bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : produtosFiltrados.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Search size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">Nenhum produto encontrado</p>
            <button onClick={() => { setSearch(''); setCatAtiva(null) }}
              className="text-brand-600 text-sm mt-2 hover:underline">
              Limpar filtros
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              {produtosFiltrados.length} produto{produtosFiltrados.length !== 1 ? 's' : ''} encontrado{produtosFiltrados.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {produtosFiltrados.map((p, i) => (
                <div key={p.id} className="animate-in" style={{ animationDelay: `${i * 40}ms` }}>
                  <ProductCard produto={p} onAddToCart={addToCart} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <Footer />
    </>
  )
}
