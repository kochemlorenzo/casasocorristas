'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useCart } from '@/hooks/useCart'
import Header from '@/components/loja/Header'
import Footer from '@/components/loja/Footer'
import { MapPin, Truck, CheckCircle } from 'lucide-react'

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const UNIDADES = [
  'Unidade Cohab — Av. Jerônimo Albuquerque, 54',
  'Unidade Maiobão — Av. 13, 17',
  'Cidade Operária — Av. 203, 25-A',
  'Cohama — Av. Daniel de la Touche, nº 08',
]

export default function CheckoutPage() {
  const router = useRouter()
  const supabase = createClient()
  const { cart, cartTotal, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState<string | null>(null)
  const [form, setForm] = useState({
    nome: '', telefone: '', email: '',
    tipo_entrega: 'retirada', unidade: UNIDADES[0],
    endereco: '', forma_pagamento: 'pix', observacoes: '',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (cart.length === 0) return
    setLoading(true)

    try {
      // Criar pedido
      const { data: { user } } = await supabase.auth.getUser()

      const { data: pedido, error } = await supabase.from('pedidos').insert({
        cliente_nome: form.nome,
        cliente_telefone: form.telefone,
        cliente_email: user?.email ?? form.email,
        status: 'pendente',
        tipo_entrega: form.tipo_entrega,
        endereco_entrega: form.tipo_entrega === 'delivery' ? form.endereco : null,
        unidade: form.tipo_entrega === 'retirada' ? form.unidade : null,
        total: cartTotal,
        forma_pagamento: form.forma_pagamento,
        observacoes: form.observacoes || null,
      }).select().single()

      if (error || !pedido) throw error

      // Inserir itens
      const itens = cart.map(item => ({
        pedido_id: pedido.id,
        produto_id: item.produto.id,
        produto_nome: item.produto.nome,
        produto_preco: item.produto.preco_promocional ?? item.produto.preco,
        quantidade: item.quantidade,
        subtotal: (item.produto.preco_promocional ?? item.produto.preco) * item.quantidade,
      }))

      await supabase.from('pedido_itens').insert(itens)

      await fetch("/api/notificar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pedido_id: pedido.id }) })
      clearCart()
      setSucesso(pedido.numero)
    } catch (err) {
      alert('Erro ao finalizar pedido. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (sucesso) {
    return (
      <>
        <Header cartCount={0} onCartOpen={() => {}} />
        <div className="min-h-[60vh] flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Pedido realizado!</h1>
            <p className="text-gray-500 mb-4">Seu pedido <strong className="text-brand-700">{sucesso}</strong> foi recebido com sucesso.</p>
            <p className="text-sm text-gray-500 mb-8">Entraremos em contato pelo WhatsApp para confirmar seu pedido.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => router.push('/loja')} className="btn-primary">Continuar comprando</button>
              <a href="https://wa.me/5598989888035" target="_blank" rel="noopener" className="btn-secondary">Falar no WhatsApp</a>
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header cartCount={cart.reduce((a, i) => a + i.quantidade, 0)} onCartOpen={() => {}} />
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <h1 className="font-display text-3xl font-bold mb-8">Finalizar Pedido</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulário */}
            <div className="lg:col-span-2 space-y-6">
              {/* Dados pessoais */}
              <div className="card p-6">
                <h2 className="font-display font-bold text-lg mb-4">Seus dados</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo *</label>
                    <input required value={form.nome} onChange={e => set('nome', e.target.value)}
                      className="input" placeholder="Seu nome" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp *</label>
                    <input required value={form.telefone} onChange={e => set('telefone', e.target.value)}
                      className="input" placeholder="(98) 99999-0000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                    <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                      className="input" placeholder="seu@email.com" />
                  </div>
                </div>
              </div>

              {/* Entrega */}
              <div className="card p-6">
                <h2 className="font-display font-bold text-lg mb-4">Entrega</h2>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { value: 'retirada', label: 'Retirar na loja', icon: MapPin },
                    { value: 'delivery', label: 'Delivery', icon: Truck },
                  ].map(opt => (
                    <button type="button" key={opt.value}
                      onClick={() => set('tipo_entrega', opt.value)}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        form.tipo_entrega === opt.value
                          ? 'border-brand-600 bg-brand-50 text-brand-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <opt.icon size={20} />
                      <span className="font-medium text-sm">{opt.label}</span>
                    </button>
                  ))}
                </div>

                {form.tipo_entrega === 'retirada' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unidade para retirada *</label>
                    <select value={form.unidade} onChange={e => set('unidade', e.target.value)} className="input">
                      {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Endereço de entrega *</label>
                    <input required={form.tipo_entrega === 'delivery'} value={form.endereco}
                      onChange={e => set('endereco', e.target.value)}
                      className="input" placeholder="Rua, número, bairro, cidade" />
                  </div>
                )}
              </div>

              {/* Pagamento */}
              <div className="card p-6">
                <h2 className="font-display font-bold text-lg mb-4">Forma de Pagamento</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['pix', 'dinheiro', 'debito', 'credito'].map(p => (
                    <button type="button" key={p}
                      onClick={() => set('forma_pagamento', p)}
                      className={`py-3 px-2 rounded-xl border-2 text-sm font-medium capitalize transition-all ${
                        form.forma_pagamento === p
                          ? 'border-brand-600 bg-brand-50 text-brand-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      {p === 'pix' ? 'PIX' : p === 'debito' ? 'Débito' : p === 'credito' ? 'Crédito' : 'Dinheiro'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Observações */}
              <div className="card p-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações (opcional)</label>
                <textarea value={form.observacoes} onChange={e => set('observacoes', e.target.value)}
                  className="input resize-none" rows={3} placeholder="Alguma informação extra?" />
              </div>
            </div>

            {/* Resumo */}
            <div className="lg:col-span-1">
              <div className="card p-6 sticky top-20">
                <h2 className="font-display font-bold text-lg mb-4">Resumo</h2>
                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                  {cart.map(item => {
                    const preco = item.produto.preco_promocional ?? item.produto.preco
                    return (
                      <div key={item.produto.id} className="flex justify-between text-sm">
                        <span className="text-gray-600 pr-2 line-clamp-2">{item.produto.nome} ×{item.quantidade}</span>
                        <span className="font-medium flex-shrink-0">{fmt(preco * item.quantidade)}</span>
                      </div>
                    )
                  })}
                </div>
                <div className="border-t border-gray-100 pt-4 mb-6">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-brand-700">{fmt(cartTotal)}</span>
                  </div>
                </div>
                <button type="submit" disabled={loading || cart.length === 0}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? 'Enviando...' : 'Confirmar Pedido'}
                </button>
                <p className="text-xs text-gray-400 text-center mt-3">
                  Ao confirmar, entraremos em contato pelo WhatsApp
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
      <Footer />
    </>
  )
}
