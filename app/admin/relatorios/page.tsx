'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts'
import { TrendingUp, TrendingDown, ShoppingBag, Users } from 'lucide-react'

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const COLORS = ['#16a34a', '#2563eb', '#d97706', '#dc2626', '#7c3aed']
const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export default function AdminRelatorios() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [faturamentoMensal, setFaturamentoMensal] = useState<any[]>([])
  const [porCategoria, setPorCategoria] = useState<any[]>([])
  const [topProdutos, setTopProdutos] = useState<any[]>([])
  const [kpis, setKpis] = useState({ mesAtual: 0, mesAnterior: 0, pedidosMes: 0, ticketMedio: 0 })

  useEffect(() => {
    async function load() {
      const hoje = new Date()
      const anoAtual = hoje.getFullYear()

      // Faturamento dos últimos 6 meses
      const dados6meses = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
        const fim = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
        const { data } = await supabase.from('pedidos')
          .select('total')
          .gte('criado_em', d.toISOString())
          .lte('criado_em', fim.toISOString())
          .eq('status', 'entregue')
        const total = data?.reduce((a, p) => a + p.total, 0) ?? 0
        dados6meses.push({ mes: MESES[d.getMonth()], total })
      }
      setFaturamentoMensal(dados6meses)

      // KPIs mês atual vs anterior
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString()
      const inicioMesAnt = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1).toISOString()
      const fimMesAnt = new Date(hoje.getFullYear(), hoje.getMonth(), 0, 23, 59, 59).toISOString()

      const [{ data: pedMes }, { data: pedAnt }] = await Promise.all([
        supabase.from('pedidos').select('total').gte('criado_em', inicioMes).neq('status', 'cancelado'),
        supabase.from('pedidos').select('total').gte('criado_em', inicioMesAnt).lte('criado_em', fimMesAnt).neq('status', 'cancelado'),
      ])
      const totalMes = pedMes?.reduce((a, p) => a + p.total, 0) ?? 0
      const totalAnt = pedAnt?.reduce((a, p) => a + p.total, 0) ?? 0
      setKpis({
        mesAtual: totalMes,
        mesAnterior: totalAnt,
        pedidosMes: pedMes?.length ?? 0,
        ticketMedio: pedMes?.length ? totalMes / pedMes.length : 0,
      })

      // Vendas por categoria
      const { data: itens } = await supabase
        .from('pedido_itens')
        .select('subtotal, produto_id, produtos(categoria_id, categorias(nome))')
        .gte('created_at', inicioMes)
      const catMap: Record<string, number> = {}
      itens?.forEach((item: any) => {
        const nome = item.produtos?.categorias?.nome ?? 'Sem categoria'
        catMap[nome] = (catMap[nome] ?? 0) + item.subtotal
      })
      setPorCategoria(Object.entries(catMap).map(([name, value]) => ({ name, value })))

      // Top 5 produtos
      const { data: topItens } = await supabase
        .from('pedido_itens')
        .select('produto_nome, quantidade, subtotal')
        .gte('created_at', inicioMes)
        .order('quantidade', { ascending: false })
        .limit(20)
      const prodMap: Record<string, { qtd: number; total: number }> = {}
      topItens?.forEach(i => {
        if (!prodMap[i.produto_nome]) prodMap[i.produto_nome] = { qtd: 0, total: 0 }
        prodMap[i.produto_nome].qtd += i.quantidade
        prodMap[i.produto_nome].total += i.subtotal
      })
      const top = Object.entries(prodMap)
        .sort((a, b) => b[1].qtd - a[1].qtd)
        .slice(0, 5)
        .map(([nome, d]) => ({ nome, qtd: d.qtd, total: d.total }))
      setTopProdutos(top)

      setLoading(false)
    }
    load()
  }, [])

  const variacao = kpis.mesAnterior > 0
    ? ((kpis.mesAtual - kpis.mesAnterior) / kpis.mesAnterior) * 100
    : 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">Relatórios</h1>
        <p className="text-gray-500 mt-1">Análise financeira e de vendas</p>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Faturamento do Mês', value: fmt(kpis.mesAtual), icon: TrendingUp, sub: `${variacao >= 0 ? '+' : ''}${variacao.toFixed(1)}% vs mês ant.`, color: variacao >= 0 ? 'text-green-600' : 'text-red-600' },
          { label: 'Mês Anterior', value: fmt(kpis.mesAnterior), icon: TrendingDown, sub: 'comparativo', color: 'text-gray-500' },
          { label: 'Pedidos no Mês', value: kpis.pedidosMes, icon: ShoppingBag, sub: 'total de pedidos', color: 'text-blue-600' },
          { label: 'Ticket Médio', value: fmt(kpis.ticketMedio), icon: Users, sub: 'por pedido', color: 'text-purple-600' },
        ].map((c, i) => (
          <div key={i} className="card p-5">
            <div className="text-gray-400 mb-2"><c.icon size={18} /></div>
            <div className="font-display text-xl font-bold text-gray-900 mb-0.5">
              {loading ? <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" /> : c.value}
            </div>
            <div className="text-sm text-gray-500">{c.label}</div>
            <div className={`text-xs mt-1 font-medium ${c.color}`}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Gráfico faturamento */}
      <div className="card p-6">
        <h2 className="font-display font-bold text-lg mb-6">Faturamento — Últimos 6 meses</h2>
        {loading ? (
          <div className="h-52 bg-gray-100 rounded-xl animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={faturamentoMensal}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => [fmt(v), 'Faturamento']} />
              <Bar dataKey="total" fill="#16a34a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Por categoria */}
        <div className="card p-6">
          <h2 className="font-display font-bold text-lg mb-6">Vendas por Categoria</h2>
          {loading ? (
            <div className="h-52 bg-gray-100 rounded-xl animate-pulse" />
          ) : porCategoria.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-gray-400">Sem dados</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={porCategoria} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                  {porCategoria.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top produtos */}
        <div className="card p-6">
          <h2 className="font-display font-bold text-lg mb-4">Top 5 Produtos do Mês</h2>
          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : topProdutos.length === 0 ? (
            <div className="text-center py-10 text-gray-400">Sem vendas no mês</div>
          ) : (
            <div className="space-y-3">
              {topProdutos.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{p.nome}</div>
                    <div className="text-xs text-gray-400">{p.qtd} un. vendidas</div>
                  </div>
                  <span className="text-sm font-semibold text-brand-700 flex-shrink-0">{fmt(p.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
