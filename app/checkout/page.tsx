'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useCart } from '@/hooks/useCart'
import Header from '@/components/loja/Header'
import Footer from '@/components/loja/Footer'
import { MapPin, Truck, CheckCircle, Phone } from 'lucide-react'

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
    
    // Verificação de segurança: Carrinho vazio ou sem ID de produto
    const itensValidos = cart.filter(item => item.produto?.id);
    
    if (itensValidos.length === 0) {
      alert('Seu carrinho está vazio ou contém itens inválidos. Tente adicionar os produtos novamente.');
      return;
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      // 1. Criar o pedido principal - VERSÃO FINAL
      const { data: pedido, error: erroPedido } = await supabase
        .from('pedidos')
        .insert({
          cliente_id: user?.id || null, // Adicione esta linha!
          cliente_nome: form.nome,
          cliente_telefone: form.telefone,
          cliente_email: user?.email || form.email || null,
          status: 'pendente',
          tipo_entrega: form.tipo_entrega,
          endereco_entrega: form.tipo_entrega === 'delivery' ? form.endereco : null,
          unidade: form.tipo_entrega === 'retirada' ? form.unidade : null,
          total: cartTotal,
          forma_pagamento: form.forma_pagamento,
            observacoes: form.observacoes || null,
      })
      .select()
      .single()

      if (erroPedido || !pedido) {
        console.error("Erro ao criar pedido:", erroPedido);
        throw new Error(erroPedido?.message || "Falha ao registrar pedido principal.");
      }

      // 2. Formatar itens com o ID do pedido recém-criado
      const itensParaInserir = itensValidos.map(item => ({
        pedido_id: pedido.id,
        produto_id: item.produto.id,
        produto_nome: item.produto.nome,
        produto_preco: item.produto.preco_promocional ?? item.produto.preco,
        quantidade: item.quantidade,
        subtotal: (item.produto.preco_promocional ?? item.produto.preco) * item.quantidade,
      }))

      // 3. Inserir os itens
      const { error: erroItens } = await supabase
        .from('pedido_itens')
        .insert(itensParaInserir)

      if (erroItens) {
        console.error("Erro ao inserir itens:", erroItens);
        throw new Error("O pedido foi criado, mas houve um erro ao salvar os produtos.");
      }

      // 4. Notificação (Opcional - não trava o processo)
      try {
        await fetch("/api/notificar", { 
          method: "POST", 
          headers: { "Content-Type": "application/json" }, 
          body: JSON.stringify({ pedido_id: pedido.id }) 
        })
      } catch (e) {
        console.warn("Notificação não enviada, mas pedido salvo com sucesso.");
      }

      clearCart()
      // Usa o 'numero' se existir no banco, senão usa parte do ID
      setSucesso(pedido.numero || pedido.id.substring(0, 8))

    } catch (err: any) {
      console.error("Erro Completo:", err)
      alert(err.message || 'Erro ao finalizar pedido. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // UI de Sucesso
  if (sucesso) {
    return (
      <>
        <Header cartCount={0} onCartOpen={() => {}} />
        <div className="min-h-[60vh] flex items-center justify-center p-4 animate-in">
          <div className="text-center max-w-md bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Pedido realizado!</h1>
            <p className="text-gray-500 mb-4">Seu pedido <strong className="text-green-700">#{sucesso}</strong> foi recebido.</p>
            <div className="flex flex-col gap-3 mt-8">
              <button onClick={() => router.push('/')} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors">Voltar para a Loja</button>
              <a href="https://wa.me/5598989888035" target="_blank" rel="noopener" className="w-full border-2 border-gray-200 py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-gray-50 transition-colors">
                <Phone size={18} /> Chamar no WhatsApp
              </a>
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
        <h1 className="text-3xl font-bold mb-8">Finalizar Pedido</h1>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Seção Dados e Entrega omitidas para brevidade, mantenha as do seu arquivo original */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="font-bold text-lg mb-4">Seus dados</h2>
                <div className="grid grid-cols-1 gap-4">
                  <input required value={form.nome} onChange={e => set('nome', e.target.value)} className="w-full p-3 border rounded-xl" placeholder="Nome completo" />
                  <input required value={form.telefone} onChange={e => set('telefone', e.target.value)} className="w-full p-3 border rounded-xl" placeholder="WhatsApp (98) 9XXXX-XXXX" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="font-bold text-lg mb-4">Entrega</h2>
                <select value={form.tipo_entrega} onChange={e => set('tipo_entrega', e.target.value)} className="w-full p-3 border rounded-xl mb-4">
                  <option value="retirada">Retirada na Loja</option>
                  <option value="delivery">Entrega (Delivery)</option>
                </select>
                {form.tipo_entrega === 'retirada' ? (
                  <select value={form.unidade} onChange={e => set('unidade', e.target.value)} className="w-full p-3 border rounded-xl">
                    {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                ) : (
                  <input required value={form.endereco} onChange={e => set('endereco', e.target.value)} className="w-full p-3 border rounded-xl" placeholder="Endereço completo" />
                )}
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="font-bold text-lg mb-4">Pagamento</h2>
                <div className="grid grid-cols-2 gap-2">
                  {['pix', 'dinheiro', 'debito', 'credito'].map(p => (
                    <button type="button" key={p} onClick={() => set('forma_pagamento', p)} 
                    className={`p-3 rounded-xl border-2 capitalize ${form.forma_pagamento === p ? 'border-green-600 bg-green-50' : 'border-gray-100'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 sticky top-24">
                <h2 className="font-bold text-lg mb-4">Resumo</h2>
                <div className="space-y-2 mb-4">
                  {cart.map(item => (
                    <div key={item.produto.id} className="flex justify-between text-sm">
                      <span>{item.produto.nome} x{item.quantidade}</span>
                      <span>{fmt((item.produto.preco_promocional ?? item.produto.preco) * item.quantidade)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4 mb-6 flex justify-between font-bold text-xl">
                  <span>Total</span>
                  <span className="text-green-700">{fmt(cartTotal)}</span>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-green-700 disabled:opacity-50">
                  {loading ? 'Processando...' : 'Confirmar Pedido'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
      <Footer />
    </>
  )
}