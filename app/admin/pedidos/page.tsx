'use client'

import { useEffect, useState } from 'react'
import { createClient, type Pedido } from '@/lib/supabase'
import { Search, Eye, X, Phone } from 'lucide-react'

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const STATUS_OPTIONS = ['pendente','confirmado','preparando','pronto','entregue','cancelado']
const STATUS_BADGE: Record<string,string> = {
  pendente:'badge-yellow', confirmado:'badge-blue', preparando:'badge-blue',
  pronto:'badge-green', entregue:'badge-green', cancelado:'badge-red',
}

export default function AdminPedidos() {
  const supabase = createClient()
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [detalhe, setDetalhe] = useState<Pedido | null>(null)

  async function load() {
    const { data } = await supabase
      .from('pedidos')
      .select('*, pedido_itens(*)')
      .order('criado_em', { ascending: false })
    if (data) setPedidos(data as any)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function atualizarStatus(id: string, status: string) {
    await supabase.from('pedidos').update({ status }).eq('id', id)
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, status: status as any } : p))
    if (detalhe?.id === id) setDetalhe(prev => prev ? { ...prev, status: status as any } : null)
  }

  const filtrados = pedidos.filter(p => {
    const matchSearch = search === '' ||
      p.numero.toLowerCase().includes(search.toLowerCase()) ||
      p.cliente_nome.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filtroStatus === '' || p.status === filtroStatus
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Pedidos</h1>
        <p className="text-gray-500 mt-1">{pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''} no total</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="input pl-9" placeholder="Buscar por número ou cliente..." />
        </div>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className="input w-auto">
          <option value="">Todos os status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
      </div>

      {/* Tabela */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">PEDIDO</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">CLIENTE</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden sm:table-cell">DATA</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">TOTAL</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">STATUS</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {[...Array(6)].map((_, j) => <td key={j} className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                  </tr>
                ))
              ) : filtrados.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Nenhum pedido encontrado</td></tr>
              ) : filtrados.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono font-semibold text-brand-700">{p.numero}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{p.cliente_nome}</div>
                    {p.cliente_telefone && (
                      <div className="text-xs text-gray-400">{p.cliente_telefone}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">
                    {new Date(p.criado_em).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold">{fmt(p.total)}</td>
                  <td className="px-4 py-3">
                    <select value={p.status}
                      onChange={e => atualizarStatus(p.id, e.target.value)}
                      className={`badge cursor-pointer border-0 outline-none ${STATUS_BADGE[p.status] ?? 'badge-gray'}`}>
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      {p.cliente_telefone && (
                        <a href={`https://wa.me/55${p.cliente_telefone.replace(/\D/g,'')}`} target="_blank" rel="noopener"
                          className="p-2 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors">
                          <Phone size={15} />
                        </a>
                      )}
                      <button onClick={() => setDetalhe(p)}
                        className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                        <Eye size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal detalhe */}
      {detalhe && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg my-4 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-display font-bold text-xl">Pedido {detalhe.numero}</h2>
              <button onClick={() => setDetalhe(null)} className="p-2 rounded-xl hover:bg-gray-100"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Cliente:</span> <span className="font-medium">{detalhe.cliente_nome}</span></div>
                <div><span className="text-gray-500">Telefone:</span> <span className="font-medium">{detalhe.cliente_telefone ?? '—'}</span></div>
                <div><span className="text-gray-500">Entrega:</span> <span className="font-medium capitalize">{detalhe.tipo_entrega}</span></div>
                <div><span className="text-gray-500">Pagamento:</span> <span className="font-medium capitalize">{detalhe.forma_pagamento ?? '—'}</span></div>
                {detalhe.unidade && <div className="col-span-2"><span className="text-gray-500">Unidade:</span> <span className="font-medium">{detalhe.unidade}</span></div>}
                {detalhe.endereco_entrega && <div className="col-span-2"><span className="text-gray-500">Endereço:</span> <span className="font-medium">{detalhe.endereco_entrega}</span></div>}
                {detalhe.observacoes && <div className="col-span-2"><span className="text-gray-500">Obs:</span> <span className="font-medium">{detalhe.observacoes}</span></div>}
              </div>

              <div>
                <h3 className="font-semibold text-sm text-gray-700 mb-3">Itens do pedido</h3>
                <div className="space-y-2">
                  {detalhe.pedido_itens?.map(item => (
                    <div key={item.id} className="flex justify-between text-sm bg-gray-50 rounded-xl px-4 py-2.5">
                      <span className="text-gray-700">{item.produto_nome} ×{item.quantidade}</span>
                      <span className="font-semibold">{fmt(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold text-base mt-4 pt-3 border-t border-gray-100">
                  <span>Total</span>
                  <span className="text-brand-700">{fmt(detalhe.total)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Atualizar status</label>
                <select value={detalhe.status}
                  onChange={e => atualizarStatus(detalhe.id, e.target.value)}
                  className="input">
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
