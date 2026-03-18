'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Lock, UserPlus, Trash2, Eye, EyeOff } from 'lucide-react'

export default function AdminConfiguracoes() {
  const supabase = createClient()

  // Troca de senha
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [salvandoSenha, setSalvandoSenha] = useState(false)
  const [msgSenha, setMsgSenha] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)

  // Novo admin
  const [novoEmail, setNovoEmail] = useState('')
  const [novaSenhaAdmin, setNovaSenhaAdmin] = useState('')
  const [criandoAdmin, setCriandoAdmin] = useState(false)
  const [msgAdmin, setMsgAdmin] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)
  const [admins, setAdmins] = useState<any[]>([])
  const [loadingAdmins, setLoadingAdmins] = useState(true)

  // Carregar admins
  useState(() => {
    async function load() {
      const { data } = await supabase.from('admin_perfis').select('*').order('criado_em')
      if (data) setAdmins(data)
      setLoadingAdmins(false)
    }
    load()
  })

  async function handleTrocarSenha(e: React.FormEvent) {
    e.preventDefault()
    if (novaSenha !== confirmarSenha) {
      setMsgSenha({ tipo: 'erro', texto: 'As senhas não coincidem.' })
      return
    }
    if (novaSenha.length < 6) {
      setMsgSenha({ tipo: 'erro', texto: 'A senha deve ter pelo menos 6 caracteres.' })
      return
    }
    setSalvandoSenha(true)
    const { error } = await supabase.auth.updateUser({ password: novaSenha })
    if (error) {
      setMsgSenha({ tipo: 'erro', texto: error.message })
    } else {
      setMsgSenha({ tipo: 'sucesso', texto: 'Senha alterada com sucesso!' })
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmarSenha('')
    }
    setSalvandoSenha(false)
  }

  async function handleCriarAdmin(e: React.FormEvent) {
    e.preventDefault()
    setCriandoAdmin(true)
    setMsgAdmin(null)

    const { data, error } = await supabase.auth.signUp({
      email: novoEmail,
      password: novaSenhaAdmin,
      options: { emailRedirectTo: `${window.location.origin}/admin` }
    })

    if (error) {
      setMsgAdmin({ tipo: 'erro', texto: error.message })
    } else if (data.user) {
      await supabase.from('admin_perfis').insert({
        id: data.user.id,
        nome: novoEmail.split('@')[0],
        email: novoEmail,
        role: 'admin'
      })
      setMsgAdmin({ tipo: 'sucesso', texto: `Admin ${novoEmail} criado com sucesso!` })
      setNovoEmail('')
      setNovaSenhaAdmin('')
      const { data: adminsData } = await supabase.from('admin_perfis').select('*').order('criado_em')
      if (adminsData) setAdmins(adminsData)
    }
    setCriandoAdmin(false)
  }

  async function handleRemoverAdmin(id: string, email: string) {
    if (!confirm(`Remover o admin ${email}?`)) return
    await supabase.from('admin_perfis').delete().eq('id', id)
    setAdmins(prev => prev.filter(a => a.id !== id))
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="page-title">Configurações</h1>
        <p className="text-gray-500 mt-1">Gerencie sua conta e usuários administradores</p>
      </div>

      {/* Trocar senha */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
            <Lock size={20} className="text-brand-600" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg">Trocar Senha</h2>
            <p className="text-sm text-gray-500">Altere a senha da sua conta</p>
          </div>
        </div>

        <form onSubmit={handleTrocarSenha} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
            <div className="relative">
              <input
                type={showSenha ? 'text' : 'password'}
                required
                value={novaSenha}
                onChange={e => setNovaSenha(e.target.value)}
                className="input pr-10"
                placeholder="Mínimo 6 caracteres"
              />
              <button type="button" onClick={() => setShowSenha(!showSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nova senha</label>
            <input
              type={showSenha ? 'text' : 'password'}
              required
              value={confirmarSenha}
              onChange={e => setConfirmarSenha(e.target.value)}
              className="input"
              placeholder="Repita a nova senha"
            />
          </div>

          {msgSenha && (
            <div className={`px-4 py-3 rounded-xl text-sm ${
              msgSenha.tipo === 'sucesso' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {msgSenha.texto}
            </div>
          )}

          <button type="submit" disabled={salvandoSenha} className="btn-primary">
            {salvandoSenha ? 'Salvando...' : 'Alterar senha'}
          </button>
        </form>
      </div>

      {/* Múltiplos admins */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <UserPlus size={20} className="text-purple-600" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg">Administradores</h2>
            <p className="text-sm text-gray-500">Adicione outros usuários com acesso ao painel</p>
          </div>
        </div>

        {/* Lista de admins */}
        {!loadingAdmins && admins.length > 0 && (
          <div className="space-y-2 mb-6">
            {admins.map(a => (
              <div key={a.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-gray-900">{a.email}</div>
                  <div className="text-xs text-gray-400 capitalize">{a.role}</div>
                </div>
                <button onClick={() => handleRemoverAdmin(a.id, a.email)}
                  className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Criar novo admin */}
        <form onSubmit={handleCriarAdmin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail do novo admin</label>
            <input
              type="email"
              required
              value={novoEmail}
              onChange={e => setNovoEmail(e.target.value)}
              className="input"
              placeholder="novo@casasocorrista.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha inicial</label>
            <input
              type="password"
              required
              value={novaSenhaAdmin}
              onChange={e => setNovaSenhaAdmin(e.target.value)}
              className="input"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          {msgAdmin && (
            <div className={`px-4 py-3 rounded-xl text-sm ${
              msgAdmin.tipo === 'sucesso' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {msgAdmin.texto}
            </div>
          )}

          <button type="submit" disabled={criandoAdmin}
            className="btn-primary flex items-center gap-2">
            <UserPlus size={16} />
            {criandoAdmin ? 'Criando...' : 'Criar administrador'}
          </button>
        </form>
      </div>
    </div>
  )
}
