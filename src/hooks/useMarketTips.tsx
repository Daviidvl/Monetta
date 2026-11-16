import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, Lightbulb, CalendarCheck, BarChart2, Flag } from 'lucide-react'
import { fetchCoinPrice } from './useCryptoPrices'
import { formatCurrency } from '../utils/format'
import type { FocusMode } from '../utils/focusMode'
import type { TipCard } from '../components/ui/TipsCarousel'

// 15 financial tips — one shown per month, cycling through all
const TIP_POOL: string[] = [
  'Regra 50/30/20: 50% da renda para necessidades, 30% para desejos e 20% para poupança e investimentos.',
  'Fundo de emergência: guarde de 3 a 6 meses de despesas em uma conta com liquidez diária.',
  'Juros compostos: quanto antes você começar a investir, maior o efeito do tempo sobre o patrimônio.',
  'DCA — aportar todo mês, independente do preço, reduz o risco de entrar no pico de um ativo.',
  'Não concentre mais de 20% do portfólio em um único ativo. Diversificação protege nos ciclos de queda.',
  'Inflação corrói o poder de compra. Dinheiro parado na conta corrente perde valor todo mês.',
  'Compare seus investimentos com o CDI e a inflação — esse é o rendimento real que importa.',
  'Criptomoedas são voláteis. Invista apenas o que pode perder sem impactar sua vida financeira.',
  'ETFs (fundos de índice) permitem diversificação em dezenas de ativos com uma única compra e taxas baixas.',
  'Automatize seus aportes: configure uma transferência automática para investimentos no dia do salário.',
  'Revise suas assinaturas mensais. Gastos pequenos e recorrentes somados costumam surpreender.',
  '13º salário é oportunidade: quite dívidas caras antes de gastar com festas ou compras por impulso.',
  'Evite compras por impulso: espere 24h antes de qualquer compra não planejada.',
  'Pesquise antes de investir. Entenda como o ativo funciona e os riscos envolvidos.',
  'Tesouro SELIC é ideal para a reserva de emergência — seguro, conservador e com liquidez diária.',
]

// Shown instead of market/investing tips while the user is in "sair das
// dívidas" mode — crypto prices are noise when the priority is paying off debt.
const DEBT_TIP_POOL: string[] = [
  'Método bola de neve: quite primeiro a menor dívida. Cada uma que some libera dinheiro e motivação para a próxima.',
  'Método avalanche: se você souber os juros, ataque primeiro a dívida com a maior taxa — é o que mais economiza.',
  'Rotativo do cartão e cheque especial estão entre as dívidas mais caras que existem. Saia deles primeiro.',
  'Renegocie: credores costumam dar bons descontos para pagamento à vista ou para trocar por uma dívida mais barata.',
  'Portabilidade de crédito: você pode levar sua dívida para outro banco com juros menores.',
  'Evite novas parcelas enquanto quita as atuais — cada parcela nova adia sua liberdade.',
  '13º e restituição do IR são ótimos para antecipar parcelas — muitos contratos reduzem os juros na antecipação.',
  'Ao antecipar parcelas, peça ao credor o valor com desconto dos juros. É um direito seu.',
  'Monte uma mini-reserva de R$ 500 a R$ 1.000 para imprevistos — evita contrair dívida nova no meio do caminho.',
  'Fique de olho em feirões de renegociação — costumam oferecer descontos altos para quitar à vista.',
]

export function useMarketTips(mode: FocusMode = 'organize'): TipCard[] {
  const [btcPrice, setBtcPrice] = useState<number | null>(null)
  const [ethPrice, setEthPrice] = useState<number | null>(null)

  useEffect(() => {
    fetchCoinPrice('bitcoin').then(p => setBtcPrice(p))
    fetchCoinPrice('ethereum').then(p => setEthPrice(p))
  }, [])

  return useMemo<TipCard[]>(() => {
    const now     = new Date()
    const day     = now.getDate()
    const month   = now.getMonth()   // 0–11

    // ── Card 1: Market (BTC or ETH, alternates by month) ──────────────────
    const showBtc     = month % 2 === 0
    const assetName   = showBtc ? 'Bitcoin' : 'Ethereum'
    const assetSymbol = showBtc ? 'BTC' : 'ETH'
    const assetPrice  = showBtc ? btcPrice : ethPrice

    const marketCard: TipCard = {
      id: 'market',
      label: 'Mercado',
      labelColor: 'text-[#F7931A]',
      bgClass: 'bg-[#F7931A]/8',
      icon: <TrendingUp size={13} />,
      text: assetPrice
        ? `${assetName} (${assetSymbol}) está em ${formatCurrency(assetPrice)}. Use como referência ao avaliar seu portfólio de criptoativos.`
        : `Carregando cotação do ${assetName}…`,
    }

    // ── Card 2: Monthly financial tip ─────────────────────────────────────
    const monthlyCard: TipCard = {
      id: 'monthly-tip',
      label: 'Dica do mês',
      labelColor: 'text-accent-500',
      bgClass: 'bg-accent-500/8',
      icon: <Lightbulb size={13} />,
      text: TIP_POOL[month % TIP_POOL.length],
    }

    // ── Card 3: Planning reminder (day 20+) or a second tip ───────────────
    let thirdCard: TipCard

    if (day >= 20) {
      const nextMonthName = new Date(now.getFullYear(), month + 1, 1)
        .toLocaleDateString('pt-BR', { month: 'long' })
      const daysLeft = new Date(now.getFullYear(), month + 1, 0).getDate() - day

      thirdCard = {
        id: 'planning',
        label: 'Planejamento mensal',
        labelColor: 'text-status-success',
        bgClass: 'bg-status-success/8',
        icon: <CalendarCheck size={13} />,
        text: daysLeft <= 3
          ? `Fim de mês chegando! Separe um tempo para planejar ${nextMonthName} — contas, metas e orçamento.`
          : `Faltam ${daysLeft} dias para ${nextMonthName}. Hora de revisar o que foi pago e organizar as contas do próximo mês.`,
      }
    } else {
      thirdCard = {
        id: 'extra-tip',
        label: 'Investimentos',
        labelColor: 'text-text-muted',
        bgClass: 'bg-surface-100',
        icon: <BarChart2 size={13} />,
        text: TIP_POOL[(month + 7) % TIP_POOL.length],
      }
    }

    if (mode === 'debt') {
      const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000)
      const strategyCard: TipCard = {
        id: 'debt-strategy',
        label: 'Saindo das dívidas',
        labelColor: 'text-status-success',
        bgClass: 'bg-status-success/8',
        icon: <Flag size={13} />,
        text: DEBT_TIP_POOL[dayOfYear % DEBT_TIP_POOL.length],
      }
      const debtMonthlyCard: TipCard = { ...monthlyCard, text: DEBT_TIP_POOL[(month + 3) % DEBT_TIP_POOL.length] }
      return thirdCard.id === 'planning'
        ? [strategyCard, debtMonthlyCard, thirdCard]
        : [strategyCard, debtMonthlyCard]
    }

    return [marketCard, monthlyCard, thirdCard]
  }, [btcPrice, ethPrice, mode])
}
