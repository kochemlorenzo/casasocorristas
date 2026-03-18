'use client'

import { useState, useCallback, useEffect } from 'react'
import type { Produto, CartItem } from '@/lib/supabase'

const CART_KEY = 'cs_cart'

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([])

  // Carregar do localStorage ao montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_KEY)
      if (saved) setCart(JSON.parse(saved))
    } catch {}
  }, [])

  // Salvar sempre que mudar
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart))
  }, [cart])

  const addToCart = useCallback((produto: Produto, quantidade = 1) => {
    setCart(prev => {
      const existing = prev.find(i => i.produto.id === produto.id)
      if (existing) {
        return prev.map(i =>
          i.produto.id === produto.id
            ? { ...i, quantidade: i.quantidade + quantidade }
            : i
        )
      }
      return [...prev, { produto, quantidade }]
    })
  }, [])

  const removeFromCart = useCallback((produtoId: string) => {
    setCart(prev => prev.filter(i => i.produto.id !== produtoId))
  }, [])

  const updateQty = useCallback((produtoId: string, quantidade: number) => {
    if (quantidade <= 0) {
      setCart(prev => prev.filter(i => i.produto.id !== produtoId))
    } else {
      setCart(prev => prev.map(i =>
        i.produto.id === produtoId ? { ...i, quantidade } : i
      ))
    }
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
    localStorage.removeItem(CART_KEY)
  }, [])

  const cartCount = cart.reduce((acc, i) => acc + i.quantidade, 0)
  const cartTotal = cart.reduce((acc, i) => {
    const preco = i.produto.preco_promocional ?? i.produto.preco
    return acc + preco * i.quantidade
  }, 0)

  return { cart, addToCart, removeFromCart, updateQty, clearCart, cartCount, cartTotal }
}
