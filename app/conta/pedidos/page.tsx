'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Header from '@/components/loja/Header'
import Footer from '@/components/loja/Footer'
import { useCart } from '@/hooks/useCart'
import { ShoppingBag, LogOut, ChevronDown, ChevronUp } from 'lucide-react'

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const STATUS_BADGE: Record<string, string> = {
  pendente: 'badge-yellow', confirmado: 'badge-blue', preparando: 'badge-blue',
  pronto: 'badge-green', entregue: 'badge-green', cancelado: 'badge-red',
}

export default function MeusPedidosPage() {
  const supabase = createClient()
  const router = useRouter()
  const { cartCount } = useCart()
  const [pedidos, setPedidos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [usuario, setUsuario] = useState<any>(null)
  const [expandido, setExpandido] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/conta'); return }
      setUsuario(user)

      const { data } = await supabase
        .from('pedidos')
        .select('*, pedido_itens(*)')
        .eq('cliente_email', user.email)
        .order('criado_em', { ascending: false })
      if (data) setPedidos(data)
      setLoading(false)
    }
    load()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/conta')
  }

  return (
    <>
      <Header cartCount={cartCount} onCartOpen={() => {}} />
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="page-title">Meus Pedidos</h1>
            <p className="text-gray-500 mt-1">{usuario?.email}</p>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition-colors">
            <LogOut size={16} /> Sair
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : pedidos.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <ShoppingBag size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">Nenhum pedido ainda</p>
            <a href="/loja" className="text-brand-600 text-sm mt-2 inline-block hover:underline">
              Ir às compras →
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {pedidos.map(p => (
              <div key={p.id} className="card overflow-hidden">
                <button onClick={() => setExpandido(expandido === p.id ? null : p.id)}
                  className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4 text-left">
                    <div>
                      <div className="font-mono font-bold text-brand-700">{p.numero}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(p.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                    <span className={`badge ${STATUS_BADGE[p.status] ?? 'badge-gray'}`}>{p.status}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-900">{fmt(p.total)}</span>
                    {expandido === p.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </button>

                {expandido === p.id && (
                  <div className="border-t border-gray-100 p-5 space-y-3">
                    {p.pedido_itens?.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.produto_nome} ×{item.quantidade}</span>
                        <span className="font-medium">{fmt(item.subtotal)}</span>
                      </div>
                    ))}
                    <div className="border-t border-gray-100 pt-3 flex justify-between font-bold">
                      <span>Total</span>
                      <span className="text-brand-700">{fmt(p.total)}</span>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1 pt-1">
                      <div>Entrega: <span className="capitalize font-medium">{p.tipo_entrega}</span></div>
                      {p.unidade && <div>Unidade: <span className="font-medium">{p.unidade}</span></div>}
                      {p.forma_pagamento && <div>Pagamento: <span className="capitalize font-medium">{p.forma_pagamento}</span></div>}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  )
}
