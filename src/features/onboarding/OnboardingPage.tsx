import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, TrendingUp } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Input'
import { saveProfile } from '../../database/queries'
import { useAppStore } from '../../store/useAppStore'
import { parseNumber } from '../../utils/format'

const STEP_COUNT = 4

const goalOptions = [
  { value: 'emergency', label: 'Criar reserva de emergência' },
  { value: 'debt', label: 'Sair das dívidas' },
  { value: 'invest', label: 'Começar a investir' },
  { value: 'buy', label: 'Guardar para uma compra grande' },
  { value: 'control', label: 'Organizar meu orçamento' },
]

const dayOptions = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1),
  label: `Dia ${i + 1}`,
}))

interface StepProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

function Step({ children, title, subtitle }: StepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-6"
    >
      <div>
        <h2 className="text-2xl font-semibold text-text-primary tracking-tight">{title}</h2>
        {subtitle && <p className="mt-1.5 text-sm text-text-muted">{subtitle}</p>}
      </div>
      {children}
    </motion.div>
  )
}

export function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const { setHasOnboarded } = useAppStore()

  const [name, setName] = useState('')
  const [income, setIncome] = useState('')
  const [paymentDay, setPaymentDay] = useState('5')
  const [goal, setGoal] = useState('control')

  const canProceed = [
    name.trim().length > 0,
    parseNumber(income) > 0,
    true,
    true,
  ][step]

  async function handleFinish() {
    setLoading(true)
    try {
      await saveProfile({
        name: name.trim(),
        monthlyIncome: parseNumber(income),
        paymentDay: parseInt(paymentDay),
        financialGoal: goal,
        theme: 'light',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      setHasOnboarded(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col bg-surface-0 px-6 py-12 max-w-md mx-auto">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-10">
        <div className="w-8 h-8 rounded-xl bg-accent-500 flex items-center justify-center">
          <TrendingUp size={16} className="text-white" />
        </div>
        <span className="text-base font-semibold text-text-primary">Monetta</span>
      </div>

      {/* Progress */}
      <div className="flex gap-1.5 mb-10">
        {Array.from({ length: STEP_COUNT }).map((_, i) => (
          <motion.div
            key={i}
            className="h-1 rounded-full flex-1"
            animate={{ backgroundColor: i <= step ? '#635BFF' : 'var(--surface-200)' }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>

      {/* Steps */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <Step key="name" title="Olá! Como posso te chamar?" subtitle="Vamos personalizar sua experiência.">
              <Input
                label="Seu nome"
                placeholder="Ex: David"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && canProceed && setStep(1)}
              />
            </Step>
          )}
          {step === 1 && (
            <Step key="income" title={`Oi, ${name}!`} subtitle="Qual é a sua renda mensal aproximada?">
              <Input
                label="Salário mensal"
                placeholder="Ex: 3500"
                type="number"
                value={income}
                onChange={e => setIncome(e.target.value)}
                prefix={<span className="text-xs font-medium">R$</span>}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && canProceed && setStep(2)}
              />
            </Step>
          )}
          {step === 2 && (
            <Step key="payday" title="Quando você recebe?" subtitle="Isso nos ajuda a organizar seu calendário financeiro.">
              <Select
                label="Dia do pagamento"
                value={paymentDay}
                onChange={e => setPaymentDay(e.target.value)}
                options={dayOptions}
              />
            </Step>
          )}
          {step === 3 && (
            <Step key="goal" title="Qual é seu principal objetivo?" subtitle="Foque em um objetivo por vez — é mais eficaz.">
              <div className="flex flex-col gap-2">
                {goalOptions.map(opt => (
                  <motion.button
                    key={opt.value}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setGoal(opt.value)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-sm font-medium transition-colors text-left ${
                      goal === opt.value
                        ? 'border-accent-500 bg-accent-500/8 text-accent-500'
                        : 'border-border-base text-text-primary hover:border-border-strong hover:bg-surface-50'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                      goal === opt.value ? 'border-accent-500' : 'border-surface-300'
                    }`}>
                      {goal === opt.value && <span className="w-2 h-2 rounded-full bg-accent-500" />}
                    </span>
                    {opt.label}
                  </motion.button>
                ))}
              </div>
            </Step>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <Button variant="secondary" size="lg" onClick={() => setStep(s => s - 1)}>
            Voltar
          </Button>
        )}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!canProceed}
          loading={step === STEP_COUNT - 1 && loading}
          onClick={() => {
            if (step < STEP_COUNT - 1) setStep(s => s + 1)
            else handleFinish()
          }}
          iconEnd={step < STEP_COUNT - 1 ? <ChevronRight size={16} /> : undefined}
        >
          {step < STEP_COUNT - 1 ? 'Continuar' : 'Começar'}
        </Button>
      </div>
    </div>
  )
}
