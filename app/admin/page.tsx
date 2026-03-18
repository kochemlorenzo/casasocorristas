'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { TrendingUp, ShoppingBag, Package, AlertTriangle, Clock, CheckCircle } from 'lucide-react'

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const STATUS_BADGE: Record<string, string> = {
  pendente: 'badge-yellow',
  confirmado: 'badge-blue',
  preparando: 'badge-blue',
  pronto: 'badge-green',
  entregue: 'badge-green',
  cancelado: 'badge-red',
}

export default function AdminDashboard() {
  const supabase = createClient()
  const [kpis, setKpis] = useState({ faturamento: 0, pedidos: 0, produtos: 0, estoqueBaixo: 0 })
  const [ultimosPedidos, setUltimosPedidos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const hoje = new Date()
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString()

      const [
        { data: pedidosMes },
        { count: totalProdutos },
        { data: estoqueBaixo },
        { data: ultimos },
      ] = await Promise.all([
        supabase.from('pedidos').select('total,status').gte('criado_em', inicioMes).neq('status', 'cancelado'),
        supabase.from('produtos').select('*', { count: 'exact', head: true }).eq('ativo', true),
        supabase.from('produtos').select('id').eq('ativo', true).lt('estoque', 5),
        supabase.from('pedidos').select('numero,cliente_nome,total,status,criado_em').order('criado_em', { ascending: false }).limit(6),
      ])

      const faturamento = pedidosMes?.filter(p => p.status === 'entregue').reduce((a, p) => a + p.total, 0) ?? 0
      setKpis({
        faturamento,
        pedidos: pedidosMes?.length ?? 0,
        produtos: totalProdutos ?? 0,
        estoqueBaixo: estoqueBaixo?.length ?? 0,
      })
      setUltimosPedidos(ultimos ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const cards = [
    { label: 'Faturamento do Mês', value: fmt(kpis.faturamento), icon: TrendingUp, color: 'bg-green-500', sub: 'pedidos entregues' },
    { label: 'Pedidos no Mês', value: kpis.pedidos, icon: ShoppingBag, color: 'bg-blue-500', sub: 'total recebido' },
    { label: 'Produtos Ativos', value: kpis.produtos, icon: Package, color: 'bg-purple-500', sub: 'no catálogo' },
    { label: 'Estoque Baixo', value: kpis.estoqueBaixo, icon: AlertTriangle, color: kpis.estoqueBaixo > 0 ? 'bg-red-500' : 'bg-gray-400', sub: 'itens < 5 unid.' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-gray-500 mt-1">Visão geral do mês atual</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 ${c.color} rounded-xl flex items-center justify-center`}>
                <c.icon size={20} className="text-white" />
              </div>
            </div>
            <div className="font-display text-2xl font-bold text-gray-900 mb-0.5">
              {loading ? <div className="h-7 w-20 bg-gray-200 rounded animate-pulse" /> : c.value}
            </div>
            <div className="text-sm text-gray-500">{c.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Últimos pedidos */}
      <div className="card">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-display font-bold text-lg">Últimos Pedidos</h2>
          <a href="/admin/pedidos" className="text-sm text-brand-600 hover:underline">Ver todos →</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">PEDIDO</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">CLIENTE</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3 hidden sm:table-cell">DATA</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">TOTAL</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : ultimosPedidos.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">Nenhum pedido ainda</td></tr>
              ) : ultimosPedidos.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono font-semibold text-brand-700">{p.numero}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{p.cliente_nome}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell">
                    {new Date(p.criado_em).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold">{fmt(p.total)}</td>
                  <td className="px-6 py-4">
                    <span className={`badge ${STATUS_BADGE[p.status] ?? 'badge-gray'}`}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
