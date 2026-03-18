'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Header from '@/components/loja/Header'
import Footer from '@/components/loja/Footer'
import { useCart } from '@/hooks/useCart'
import { Eye, EyeOff, User, Mail, Lock } from 'lucide-react'
import Link from 'next/link'

export default function ContaPage() {
  const supabase = createClient()
  const router = useRouter()
  const { cartCount } = useCart()
  const [aba, setAba] = useState<'login' | 'cadastro'>('login')
  const [showSenha, setShowSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)

  const [form, setForm] = useState({ nome: '', email: '', senha: '', confirmarSenha: '' })
  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setMsg(null)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.senha,
    })
    if (error) {
      setMsg({ tipo: 'erro', texto: 'E-mail ou senha incorretos.' })
    } else {
      router.push('/conta/pedidos')
    }
    setLoading(false)
  }

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    if (form.senha !== form.confirmarSenha) {
      setMsg({ tipo: 'erro', texto: 'As senhas não coincidem.' })
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.senha,
      options: {
        data: { nome: form.nome },
        emailRedirectTo: `${window.location.origin}/conta/pedidos`,
      },
    })
    if (error) {
      setMsg({ tipo: 'erro', texto: error.message })
    } else {
      setMsg({ tipo: 'sucesso', texto: 'Cadastro realizado! Verifique seu e-mail para confirmar a conta.' })
    }
    setLoading(false)
  }

  return (
    <>
      <Header cartCount={cartCount} onCartOpen={() => {}} />
      <div className="min-h-[70vh] flex items-center justify-center p-4 bg-gray-50">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center font-display font-bold text-2xl text-white mx-auto mb-4">
              CS
            </div>
            <h1 className="font-display text-2xl font-bold text-gray-900">Minha Conta</h1>
          </div>

          {/* Abas */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button onClick={() => setAba('login')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                aba === 'login' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              }`}>
              Entrar
            </button>
            <button onClick={() => setAba('cadastro')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                aba === 'cadastro' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              }`}>
              Criar conta
            </button>
          </div>

          <div className="card p-6">
            {aba === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="email" required value={form.email} onChange={e => set('email', e.target.value)}
                      className="input pl-9" placeholder="seu@email.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type={showSenha ? 'text' : 'password'} required value={form.senha}
                      onChange={e => set('senha', e.target.value)}
                      className="input pl-9 pr-10" placeholder="••••••••" />
                    <button type="button" onClick={() => setShowSenha(!showSenha)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                {msg && (
                  <div className={`px-4 py-3 rounded-xl text-sm ${msg.tipo === 'sucesso' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {msg.texto}
                  </div>
                )}
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? 'Entrando...' : 'Entrar'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleCadastro} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" required value={form.nome} onChange={e => set('nome', e.target.value)}
                      className="input pl-9" placeholder="Seu nome" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="email" required value={form.email} onChange={e => set('email', e.target.value)}
                      className="input pl-9" placeholder="seu@email.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type={showSenha ? 'text' : 'password'} required value={form.senha}
                      onChange={e => set('senha', e.target.value)}
                      className="input pl-9 pr-10" placeholder="Mínimo 6 caracteres" />
                    <button type="button" onClick={() => setShowSenha(!showSenha)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha</label>
                  <input type={showSenha ? 'text' : 'password'} required value={form.confirmarSenha}
                    onChange={e => set('confirmarSenha', e.target.value)}
                    className="input" placeholder="Repita a senha" />
                </div>
                {msg && (
                  <div className={`px-4 py-3 rounded-xl text-sm ${msg.tipo === 'sucesso' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {msg.texto}
                  </div>
                )}
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? 'Criando conta...' : 'Criar conta'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
