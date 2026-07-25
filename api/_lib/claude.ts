import Anthropic from '@anthropic-ai/sdk'
import { EXPENSE_CATEGORIES, type ParsedExpense } from './types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const RECORD_EXPENSE_TOOL: Anthropic.Tool = {
  name: 'record_expense',
  description: 'Registra um gasto extraído de uma mensagem de WhatsApp em português.',
  input_schema: {
    type: 'object',
    properties: {
      amount: { type: 'number', description: 'Valor do gasto em reais, ex: 50 para R$50,00' },
      description: { type: 'string', description: 'Descrição curta do gasto, ex: "uber", "farmácia"' },
      category: { type: 'string', enum: EXPENSE_CATEGORIES },
      date: { type: 'string', description: 'Data do gasto em formato ISO yyyy-mm-dd. Se não houver menção de data, use a data de hoje.' },
    },
    required: ['amount', 'description', 'category', 'date'],
  },
}

export async function parseExpense(text: string, referenceDateISO: string): Promise<ParsedExpense> {
  const message = await client.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 256,
    system: `Você extrai dados estruturados de gastos pessoais a partir de mensagens curtas em português. A data de referência (hoje) é ${referenceDateISO}. Interprete valores como reais (R$). Sempre chame a tool record_expense.`,
    messages: [{ role: 'user', content: text }],
    tools: [RECORD_EXPENSE_TOOL],
    tool_choice: { type: 'tool', name: 'record_expense' },
  })

  const toolUse = message.content.find((block): block is Anthropic.ToolUseBlock => block.type === 'tool_use')
  const input = toolUse?.input as Partial<ParsedExpense> | undefined

  if (!input || typeof input.amount !== 'number' || !input.amount) {
    return {
      amount: 0,
      description: text.slice(0, 200),
      category: 'other',
      date: referenceDateISO,
    }
  }

  return {
    amount: input.amount,
    description: input.description?.slice(0, 200) || text.slice(0, 200),
    category: EXPENSE_CATEGORIES.includes(input.category as ParsedExpense['category']) ? input.category as ParsedExpense['category'] : 'other',
    date: input.date || referenceDateISO,
  }
}
