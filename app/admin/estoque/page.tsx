'use client'

import { useEffect, useState } from 'react'
import { createClient, type Produto } from '@/lib/supabase'
import { Search, Plus, Minus, AlertTriangle } from 'lucide-react'

export default function AdminEstoque() {
  const supabase = createClient()
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtro, setFiltro] = useState<'todos'|'baixo'|'zerado'>('todos')
  const [ajuste, setAjuste] = useState<{ id: string; valor: number; motivo: string } | null>(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase
      .from('produtos')
      .select('*, categorias(nome)')
      .eq('ativo', true)
      .order('nome')
    if (data) setProdutos(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function aplicarAjuste(tipo: 'entrada' | 'saida' | 'ajuste') {
    if (!ajuste) return
    setSaving(true)
    const produto = produtos.find(p => p.id === ajuste.id)
    if (!produto) return

    let novoEstoque = produto.estoque
    if (tipo === 'entrada') novoEstoque += ajuste.valor
    else if (tipo === 'saida') novoEstoque -= ajuste.valor
    else novoEstoque = ajuste.valor

    if (novoEstoque < 0) { alert('Estoque não pode ficar negativo'); setSaving(false); return }

    await supabase.from('produtos').update({ estoque: novoEstoque }).eq('id', ajuste.id)
    await supabase.from('estoque_movimentacoes').insert({
      produto_id: ajuste.id, tipo, quantidade: ajuste.valor, motivo: ajuste.motivo || 'Ajuste manual'
    })

    setProdutos(prev => prev.map(p => p.id === ajuste.id ? { ...p, estoque: novoEstoque } : p))
    setAjuste(null)
    setSaving(false)
  }

  const filtrados = produtos
    .filter(p => search === '' || p.nome.toLowerCase().includes(search.toLowerCase()))
    .filter(p => {
      if (filtro === 'baixo') return p.estoque > 0 && p.estoque <= p.estoque_minimo
      if (filtro === 'zerado') return p.estoque <= 0
      return true
    })

  const stats = {
    total: produtos.length,
    baixo: produtos.filter(p => p.estoque > 0 && p.estoque <= p.estoque_minimo).length,
    zerado: produtos.filter(p => p.estoque <= 0).length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Estoque</h1>
        <p className="text-gray-500 mt-1">Controle de inventário em tempo real</p>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total de itens', value: stats.total, color: 'bg-blue-500', cursor: 'todos' as const },
          { label: 'Estoque baixo', value: stats.baixo, color: 'bg-yellow-500', cursor: 'baixo' as const },
          { label: 'Sem estoque', value: stats.zerado, color: 'bg-red-500', cursor: 'zerado' as const },
        ].map((c, i) => (
          <button key={i} onClick={() => setFiltro(filtro === c.cursor ? 'todos' : c.cursor)}
            className={`card p-4 text-left transition-all hover:shadow-md ${filtro === c.cursor ? 'ring-2 ring-brand-500' : ''}`}>
            <div className={`w-8 h-8 ${c.color} rounded-lg flex items-center justify-center mb-2`}>
              <AlertTriangle size={16} className="text-white" />
            </div>
            <div className="font-display text-2xl font-bold text-gray-900">{c.value}</div>
            <div className="text-sm text-gray-500">{c.label}</div>
          </button>
        ))}
      </div>

      {/* Busca */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="input pl-9" placeholder="Buscar produto..." />
      </div>

      {/* Lista */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">PRODUTO</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden md:table-cell">CATEGORIA</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">ESTOQUE</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden sm:table-cell">MÍNIMO</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">SITUAÇÃO</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {[...Array(6)].map((_, j) => <td key={j} className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                  </tr>
                ))
              ) : filtrados.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Nenhum produto encontrado</td></tr>
              ) : filtrados.map(p => {
                const situacao = p.estoque <= 0 ? { label: 'Sem estoque', cls: 'badge-red' }
                  : p.estoque <= p.estoque_minimo ? { label: 'Estoque baixo', cls: 'badge-yellow' }
                  : { label: 'Normal', cls: 'badge-green' }
                return (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.nome}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">
                      {(p as any).categorias?.nome ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-lg text-gray-900">{p.estoque}</span>
                      <span className="text-xs text-gray-400 ml-1">un.</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">{p.estoque_minimo}</td>
                    <td className="px-4 py-3"><span className={`badge ${situacao.cls}`}>{situacao.label}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => setAjuste({ id: p.id, valor: 1, motivo: '' })}
                          className="p-2 rounded-lg hover:bg-brand-50 text-gray-400 hover:text-brand-600 transition-colors"
                          title="Ajustar estoque">
                          <Plus size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal ajuste */}
      {ajuste && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-5">
            <h2 className="font-display font-bold text-xl">Ajustar Estoque</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
              <input type="number" min="1" value={ajuste.valor}
                onChange={e => setAjuste(prev => prev ? { ...prev, valor: parseInt(e.target.value) || 0 } : null)}
                className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
              <input value={ajuste.motivo}
                onChange={e => setAjuste(prev => prev ? { ...prev, motivo: e.target.value } : null)}
                className="input" placeholder="Ex: Recebimento de mercadoria" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => aplicarAjuste('entrada')} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50">
                <Plus size={16} /> Entrada
              </button>
              <button onClick={() => aplicarAjuste('saida')} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50">
                <Minus size={16} /> Saída
              </button>
            </div>
            <button onClick={() => aplicarAjuste('ajuste')} disabled={saving}
              className="w-full btn-secondary text-sm">
              Definir valor exato ({ajuste.valor})
            </button>
            <button onClick={() => setAjuste(null)} className="w-full text-sm text-gray-400 hover:text-gray-600">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  )
}
