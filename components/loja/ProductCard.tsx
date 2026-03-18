'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Tag } from 'lucide-react'
import type { Produto } from '@/lib/supabase'

function formatPrice(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function ProductCard({ produto, onAddToCart }: {
  produto: Produto
  onAddToCart: (produto: Produto) => void
}) {
  const temPromocao = produto.preco_promocional && produto.preco_promocional < produto.preco
  const precoAtivo = temPromocao ? produto.preco_promocional! : produto.preco
  const semEstoque = produto.estoque <= 0

  return (
    <div className="card group hover:shadow-md transition-all duration-200 flex flex-col">
      {/* Imagem */}
      <Link href={`/loja/${produto.slug}`} className="relative aspect-square bg-gray-50 block overflow-hidden">
        {produto.imagem_principal ? (
          <Image
            src={produto.imagem_principal}
            alt={produto.nome}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Tag size={40} />
          </div>
        )}
        {temPromocao && (
          <span className="absolute top-2 left-2 badge badge-red text-xs">
            OFERTA
          </span>
        )}
        {semEstoque && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="badge badge-gray">Sem estoque</span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        {produto.categorias && (
          <span className="text-xs text-brand-600 font-medium mb-1">{produto.categorias.nome}</span>
        )}
        <Link href={`/loja/${produto.slug}`}>
          <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 hover:text-brand-700 transition-colors mb-2">
            {produto.nome}
          </h3>
        </Link>

        <div className="mt-auto">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="font-bold text-brand-700 text-base">{formatPrice(precoAtivo)}</span>
            {temPromocao && (
              <span className="text-xs text-gray-400 line-through">{formatPrice(produto.preco)}</span>
            )}
          </div>
          <button
            onClick={() => onAddToCart(produto)}
            disabled={semEstoque}
            className="w-full flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white text-xs font-semibold py-2.5 rounded-xl transition-colors active:scale-95"
          >
            <ShoppingCart size={14} />
            {semEstoque ? 'Indisponível' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
}
