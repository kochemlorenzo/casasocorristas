// lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Tipos do banco
export type Produto = {
  id: string
  nome: string
  slug: string
  descricao: string | null
  descricao_curta: string | null
  preco: number
  preco_promocional: number | null
  estoque: number
  estoque_minimo: number
  categoria_id: string | null
  imagens: string[]
  imagem_principal: string | null
  ativo: boolean
  destaque: boolean
  sku: string | null
  criado_em: string
  atualizado_em: string
  categorias?: Categoria
}

export type Categoria = {
  id: string
  nome: string
  slug: string
  descricao: string | null
  ativo: boolean
}

export type Pedido = {
  id: string
  numero: string
  cliente_nome: string
  cliente_telefone: string | null
  status: 'pendente' | 'confirmado' | 'preparando' | 'pronto' | 'entregue' | 'cancelado'
  tipo_entrega: 'retirada' | 'delivery'
  endereco_entrega: string | null
  total: number
  observacoes: string | null
  unidade: string | null
  pago: boolean
  forma_pagamento: string | null
  criado_em: string
  pedido_itens?: PedidoItem[]
}

export type PedidoItem = {
  id: string
  pedido_id: string
  produto_id: string | null
  produto_nome: string
  produto_preco: number
  quantidade: number
  subtotal: number
}

export type CartItem = {
  produto: Produto
  quantidade: number
}
