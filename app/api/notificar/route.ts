import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Formata mensagem do pedido
function formatarMensagem(pedido: any, itens: any[]) {
  const statusEmoji: Record<string, string> = {
    pendente: '🟡', confirmado: '✅', preparando: '🔄',
    pronto: '📦', entregue: '🎉', cancelado: '❌'
  }

  const itensList = itens.map(i =>
    `  • ${i.produto_nome} ×${i.quantidade} — R$ ${i.subtotal.toFixed(2).replace('.', ',')}`
  ).join('\n')

  return `🏥 *Casa Socorrista*

Olá, *${pedido.cliente_nome}*! 

Seu pedido *${pedido.numero}* foi recebido com sucesso!

📋 *Itens:*
${itensList}

💰 *Total:* R$ ${pedido.total.toFixed(2).replace('.', ',')}
🚚 *Entrega:* ${pedido.tipo_entrega === 'retirada' ? `Retirada — ${pedido.unidade}` : `Delivery — ${pedido.endereco_entrega}`}
💳 *Pagamento:* ${pedido.forma_pagamento ?? 'A definir'}

${statusEmoji[pedido.status]} *Status:* ${pedido.status.charAt(0).toUpperCase() + pedido.status.slice(1)}

Em breve entraremos em contato para confirmar. Qualquer dúvida, responda esta mensagem! 😊`
}

function formatarMensagemAdmin(pedido: any, itens: any[]) {
  const itensList = itens.map(i =>
    `  • ${i.produto_nome} ×${i.quantidade}`
  ).join('\n')

  return `🔔 *Novo Pedido Recebido!*

📋 *Pedido:* ${pedido.numero}
👤 *Cliente:* ${pedido.cliente_nome}
📱 *Telefone:* ${pedido.cliente_telefone ?? 'Não informado'}
🚚 *Entrega:* ${pedido.tipo_entrega === 'retirada' ? `Retirada — ${pedido.unidade}` : `Delivery — ${pedido.endereco_entrega}`}
💰 *Total:* R$ ${pedido.total.toFixed(2).replace('.', ',')}
💳 *Pagamento:* ${pedido.forma_pagamento ?? 'A definir'}

*Itens:*
${itensList}

${pedido.observacoes ? `📝 *Obs:* ${pedido.observacoes}` : ''}

Acesse o painel para confirmar: ${process.env.NEXT_PUBLIC_SITE_URL}/admin/pedidos`
}

async function enviarWhatsApp(numero: string, mensagem: string) {
  const evolutionUrl = process.env.EVOLUTION_API_URL
  const evolutionKey = process.env.EVOLUTION_API_KEY
  const instancia = process.env.EVOLUTION_INSTANCE

  if (!evolutionUrl || !evolutionKey || !instancia) return false

  // Remove tudo que não é número e adiciona 55 se necessário
  const numeroLimpo = numero.replace(/\D/g, '')
  const numeroFinal = numeroLimpo.startsWith('55') ? numeroLimpo : `55${numeroLimpo}`

  try {
    const res = await fetch(`${evolutionUrl}/message/sendText/${instancia}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionKey,
      },
      body: JSON.stringify({
        number: numeroFinal,
        text: mensagem,
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    const { pedido_id } = await req.json()
    if (!pedido_id) return NextResponse.json({ error: 'pedido_id obrigatório' }, { status: 400 })

    const { data: pedido } = await supabase
      .from('pedidos')
      .select('*, pedido_itens(*)')
      .eq('id', pedido_id)
      .single()

    if (!pedido) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })

    const itens = pedido.pedido_itens ?? []
    const resultados = []

    // Notifica o cliente
    if (pedido.cliente_telefone) {
      const msg = formatarMensagem(pedido, itens)
      const ok = await enviarWhatsApp(pedido.cliente_telefone, msg)
      resultados.push({ destino: 'cliente', ok })
    }

    // Notifica o admin
    const adminTelefone = process.env.WHATSAPP_ADMIN
    if (adminTelefone) {
      const msg = formatarMensagemAdmin(pedido, itens)
      const ok = await enviarWhatsApp(adminTelefone, msg)
      resultados.push({ destino: 'admin', ok })
    }

    return NextResponse.json({ sucesso: true, resultados })
  } catch (err) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
