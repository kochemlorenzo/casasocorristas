'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient, type Produto, type Categoria } from '@/lib/supabase'
import { Plus, Pencil, Trash2, Search, X, Upload, ImageOff } from 'lucide-react'
import Image from 'next/image'

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const EMPTY: Partial<Produto> = {
  nome: '', slug: '', descricao: '', descricao_curta: '',
  preco: 0, preco_promocional: undefined, estoque: 0, estoque_minimo: 5,
  categoria_id: undefined, ativo: true, destaque: false, sku: '', imagem_principal: '',
}

function slugify(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function AdminProdutos() {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState<Produto | null>(null)
  const [form, setForm] = useState<Partial<Produto>>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [uploadingImg, setUploadingImg] = useState(false)

  async function load() {
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from('produtos').select('*, categorias(nome)').order('criado_em', { ascending: false }),
      supabase.from('categorias').select('*').eq('ativo', true).order('nome'),
    ])
    if (prods) setProdutos(prods)
    if (cats) setCategorias(cats)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setEditando(null)
    setForm(EMPTY)
    setModal(true)
  }

  function openEdit(p: Produto) {
    setEditando(p)
    setForm({ ...p })
    setModal(true)
  }

  function set(field: keyof Produto, value: any) {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'nome' && !editando) next.slug = slugify(value)
      return next
    })
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImg(true)
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}.${ext}`
    const { data, error } = await supabase.storage.from('produtos').upload(path, file, { upsert: true })
    if (!error && data) {
      const { data: url } = supabase.storage.from('produtos').getPublicUrl(data.path)
      set('imagem_principal', url.publicUrl)
    }
    setUploadingImg(false)
  }

  async function handleSave() {
    if (!form.nome || !form.slug || form.preco === undefined) return
    setSaving(true)
    const payload = { ...form }
    delete (payload as any).categorias
    if (editando) {
      await supabase.from('produtos').update(payload).eq('id', editando.id)
    } else {
      await supabase.from('produtos').insert(payload)
    }
    await load()
    setModal(false)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Deletar este produto?')) return
    await supabase.from('produtos').delete().eq('id', id)
    setProdutos(prev => prev.filter(p => p.id !== id))
  }

  const filtrados = produtos.filter(p =>
    search === '' || p.nome.toLowerCase().includes(search.toLowerCase()) || p.sku?.includes(search)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Produtos</h1>
          <p className="text-gray-500 mt-1">{produtos.length} produto{produtos.length !== 1 ? 's' : ''} cadastrado{produtos.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Novo Produto
        </button>
      </div>

      {/* Busca */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="input pl-9" placeholder="Buscar por nome ou SKU..." />
      </div>

      {/* Tabela */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">PRODUTO</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden md:table-cell">CATEGORIA</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">PREÇO</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">ESTOQUE</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">STATUS</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtrados.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Nenhum produto encontrado</td></tr>
              ) : filtrados.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 relative">
                        {p.imagem_principal
                          ? <Image src={p.imagem_principal} alt={p.nome} fill className="object-cover" sizes="40px" />
                          : <ImageOff size={16} className="absolute inset-0 m-auto text-gray-300" />
                        }
                      </div>
                      <div>
                        <div className="font-medium text-sm text-gray-900">{p.nome}</div>
                        {p.sku && <div className="text-xs text-gray-400">{p.sku}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">
                    {(p as any).categorias?.nome ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-semibold">{fmt(p.preco_promocional ?? p.preco)}</div>
                    {p.preco_promocional && <div className="text-xs text-gray-400 line-through">{fmt(p.preco)}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${p.estoque <= 0 ? 'badge-red' : p.estoque <= p.estoque_minimo ? 'badge-yellow' : 'badge-green'}`}>
                      {p.estoque} un.
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${p.ativo ? 'badge-green' : 'badge-gray'}`}>
                      {p.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                    {p.destaque && <span className="badge badge-yellow ml-1">Destaque</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(p)}
                        className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(p.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-4 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-display font-bold text-xl">{editando ? 'Editar Produto' : 'Novo Produto'}</h2>
              <button onClick={() => setModal(false)} className="p-2 rounded-xl hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Upload de imagem */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Imagem do Produto</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-gray-100 relative overflow-hidden flex-shrink-0">
                    {form.imagem_principal
                      ? <Image src={form.imagem_principal} alt="preview" fill className="object-cover" sizes="80px" />
                      : <ImageOff size={24} className="absolute inset-0 m-auto text-gray-300" />
                    }
                  </div>
                  <div>
                    <button type="button" onClick={() => fileRef.current?.click()}
                      disabled={uploadingImg}
                      className="btn-secondary text-sm flex items-center gap-2 py-2">
                      <Upload size={15} />
                      {uploadingImg ? 'Enviando...' : 'Enviar imagem'}
                    </button>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG ou WebP até 5MB</p>
                  </div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                  <input value={form.nome ?? ''} onChange={e => set('nome', e.target.value)} className="input" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
                  <input value={form.slug ?? ''} onChange={e => set('slug', e.target.value)} className="input font-mono text-sm" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição curta</label>
                  <input value={form.descricao_curta ?? ''} onChange={e => set('descricao_curta', e.target.value)} className="input" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição completa</label>
                  <textarea value={form.descricao ?? ''} onChange={e => set('descricao', e.target.value)}
                    className="input resize-none" rows={3} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço *</label>
                  <input type="number" min="0" step="0.01" value={form.preco ?? ''} onChange={e => set('preco', parseFloat(e.target.value))} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço promocional</label>
                  <input type="number" min="0" step="0.01" value={form.preco_promocional ?? ''}
                    onChange={e => set('preco_promocional', e.target.value ? parseFloat(e.target.value) : undefined)} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estoque</label>
                  <input type="number" min="0" value={form.estoque ?? 0} onChange={e => set('estoque', parseInt(e.target.value))} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estoque mínimo</label>
                  <input type="number" min="0" value={form.estoque_minimo ?? 5} onChange={e => set('estoque_minimo', parseInt(e.target.value))} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <select value={form.categoria_id ?? ''} onChange={e => set('categoria_id', e.target.value || undefined)} className="input">
                    <option value="">Sem categoria</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input value={form.sku ?? ''} onChange={e => set('sku', e.target.value)} className="input font-mono text-sm" />
                </div>
                <div className="sm:col-span-2 flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.ativo ?? true} onChange={e => set('ativo', e.target.checked)}
                      className="w-4 h-4 accent-brand-600" />
                    <span className="text-sm font-medium">Produto ativo</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.destaque ?? false} onChange={e => set('destaque', e.target.checked)}
                      className="w-4 h-4 accent-brand-600" />
                    <span className="text-sm font-medium">Destaque na home</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
              <button onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? 'Salvando...' : editando ? 'Salvar alterações' : 'Criar produto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
