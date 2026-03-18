'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import type { CartItem } from '@/lib/supabase'

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function CartSidebar({ open, onClose, cart, onRemove, onUpdateQty, total, onClear }: {
  open: boolean
  onClose: () => void
  cart: CartItem[]
  onRemove: (id: string) => void
  onUpdateQty: (id: string, qty: number) => void
  total: number
  onClear: () => void
}) {
  const router = useRouter()

  function handleCheckout() {
    onClose()
    router.push('/checkout')
  }

  return (
    <>
      <div className={`cart-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <aside className={`cart-sidebar ${open ? 'open' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="font-display font-bold text-lg flex items-center gap-2">
            <ShoppingBag size={20} className="text-brand-600" />
            Seu Carrinho
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ShoppingBag size={48} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">Carrinho vazio</p>
              <p className="text-sm mt-1">Adicione produtos para continuar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => {
                const preco = item.produto.preco_promocional ?? item.produto.preco
                return (
                  <div key={item.produto.id} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-16 h-16 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0 relative">
                      {item.produto.imagem_principal ? (
                        <Image src={item.produto.imagem_principal} alt={item.produto.nome}
                          fill className="object-cover" sizes="64px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Sem img</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 line-clamp-2">{item.produto.nome}</p>
                      <p className="text-brand-600 font-bold text-sm mt-1">{fmt(preco)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => onUpdateQty(item.produto.id, item.quantidade - 1)}
                          className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors">
                          <Minus size={12} />
                        </button>
                        <span className="text-sm font-semibold w-6 text-center">{item.quantidade}</span>
                        <button onClick={() => onUpdateQty(item.produto.id, item.quantidade + 1)}
                          className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors">
                          <Plus size={12} />
                        </button>
                        <button onClick={() => onRemove(item.produto.id)}
                          className="ml-auto p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t border-gray-100 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-medium">Total</span>
              <span className="font-display font-bold text-xl text-brand-700">{fmt(total)}</span>
            </div>
            <button onClick={handleCheckout} className="btn-primary w-full">
              Finalizar Pedido
            </button>
            <button onClick={onClear} className="w-full text-xs text-gray-400 hover:text-red-500 transition-colors py-1">
              Limpar carrinho
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
