import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, TrendingUp, User, Wallet, CalendarDays, Target, Check } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Input'
import { AnimatedNumber } from '../../components/ui/AnimatedNumber'
import { saveProfile } from '../../database/queries'
import { useAppStore } from '../../store/useAppStore'
import { parseNumber } from '../../utils/format'
import { toMonthlyIncome } from '../../utils/income'
import { INCOME_FREQUENCY_LABELS, type IncomeFrequency } from '../../types'

const STEP_COUNT = 4
const stepIcons: LucideIcon[] = [User, Wallet, CalendarDays, Target]

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

const frequencyOptions: { value: IncomeFrequency; label: string }[] =
  (['monthly', 'biweekly', 'weekly', 'daily', 'variable'] as const).map(value => ({
    value,
    label: INCOME_FREQUENCY_LABELS[value],
  }))

const paydayCopy: Record<IncomeFrequency, { title: string; subtitle: string; label: string }> = {
  monthly: {
    title: 'Quando você recebe?',
    subtitle: 'Isso nos ajuda a organizar seu calendário financeiro.',
    label: 'Dia do pagamento',
  },
  biweekly: {
    title: 'Qual o primeiro dia de pagamento no mês?',
    subtitle: 'Você recebe quinzenalmente — vamos usar essa primeira data para o calendário.',
    label: 'Dia do 1º pagamento',
  },
  weekly: {
    title: 'Uma data de referência para o calendário?',
    subtitle: 'Como você recebe toda semana, escolha um dia do mês pra gente se orientar.',
    label: 'Dia de referência',
  },
  daily: {
    title: 'Uma data de referência para o calendário?',
    subtitle: 'Como você recebe todo dia, isso é só uma data de referência.',
    label: 'Dia de referência',
  },
  variable: {
    title: 'Uma data de referência para o calendário?',
    subtitle: 'Como sua renda varia, escolha um dia do mês pra gente se orientar.',
    label: 'Dia de referência',
  },
}

// Radar-style circular badge: concentric rings pulse outward behind a
// gradient icon puck, echoing the fintech kit's biometric-scan motif
// reused here as a per-step illustration.
function StepIconBadge({ Icon }: { Icon: LucideIcon }) {
  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      {[0, 1].map(i => (
        <motion.span
          key={i}
          className="absolute inset-0 rounded-full border border-accent-400/40"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: [1, 1.7], opacity: [0.5, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: i * 1.2, ease: 'easeOut' }}
        />
      ))}
      <motion.div
        initial={{ scale: 0.4, opacity: 0, rotate: -25 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className="relative w-14 h-14 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow"
      >
        <Icon size={22} className="text-white" strokeWidth={2.2} />
      </motion.div>
    </div>
  )
}

interface StepProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  direction: number
  icon: LucideIcon
}

const stepVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction >= 0 ? 48 : -48, scale: 0.98 }),
  center: { opacity: 1, x: 0, scale: 1 },
  exit: (direction: number) => ({ opacity: 0, x: direction >= 0 ? -48 : 48, scale: 0.98 }),
}

function Step({ children, title, subtitle, direction, icon }: StepProps) {
  return (
    <motion.div
      custom={direction}
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.9 }}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col items-center text-center gap-3">
        <StepIconBadge Icon={icon} />
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.3 }}>
          <h2 className="text-2xl font-semibold text-text-primary font-heading tracking-heading">{title}</h2>
          {subtitle && <p className="mt-1.5 text-sm text-text-muted text-balance">{subtitle}</p>}
        </motion.div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-4"
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

// A blank, non-empty hint keeps the reserved height even when there's
// nothing to show yet — avoids the field jumping as the user types.
const HINT_PLACEHOLDER = ' '

// Animated monthly-total pill shown under income inputs once a value is
// typed — replaces static hint text with a count-up number.
function IncomePreview({ value }: { value: number }) {
  return (
    <AnimatePresence>
      {value > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          className="flex items-center gap-1.5 text-xs font-medium text-accent-500 bg-accent-500/8 rounded-full px-3 py-1.5 w-fit"
        >
          <span className="text-text-muted font-normal">≈</span>
          <AnimatedNumber value={value} className="tabular-nums" />
          <span className="text-text-muted font-normal">/mês</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [loading, setLoading] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const { setHasOnboarded } = useAppStore()

  const [name, setName] = useState('')
  const [income, setIncome] = useState('')
  const [income2, setIncome2] = useState('')
  const [workDays, setWorkDays] = useState('22')
  const [frequency, setFrequency] = useState<IncomeFrequency>('monthly')
  const [paymentDay, setPaymentDay] = useState('5')
  const [goal, setGoal] = useState('control')

  function goNext() {
    setDirection(1)
    setStep(s => Math.min(s + 1, STEP_COUNT - 1))
  }
  function goBack() {
    setDirection(-1)
    setStep(s => Math.max(s - 1, 0))
  }

  // Builds the normalized income input from whatever fields are relevant
  // to the selected frequency (biweekly's 2nd payment / daily's work days).
  function buildIncomeInput() {
    return {
      frequency,
      amount: parseNumber(income),
      amountSecondary: frequency === 'biweekly' && income2.trim() !== '' ? parseNumber(income2) : undefined,
      workDays: frequency === 'daily' ? (parseInt(workDays) || undefined) : undefined,
    }
  }

  const incomeStepValid =
    frequency === 'daily'
      ? parseNumber(income) > 0 && parseInt(workDays) > 0
      : parseNumber(income) > 0

  const canProceed = [
    name.trim().length > 0,
    incomeStepValid,
    true,
    true,
  ][step]

  async function handleFinish() {
    setLoading(true)
    try {
      await saveProfile({
        name: name.trim(),
        monthlyIncome: toMonthlyIncome(buildIncomeInput()),
        incomeFrequency: frequency,
        incomeAmount: parseNumber(income),
        incomeAmountSecondary: frequency === 'biweekly' && income2.trim() !== '' ? parseNumber(income2) : undefined,
        workDaysPerMonth: frequency === 'daily' ? (parseInt(workDays) || undefined) : undefined,
        paymentDay: parseInt(paymentDay),
        financialGoal: goal,
        theme: 'light',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      setJustSaved(true)
      await new Promise(r => setTimeout(r, 550))
      setHasOnboarded(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-dvh flex flex-col bg-surface-0 overflow-hidden">
      {/* Ambient gradient orbs — slow, looping drift behind the whole flow */}
      <motion.div
        className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-gradient-primary opacity-[0.18] blur-3xl"
        animate={{ x: [0, 30, 0], y: [0, 20, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute top-1/3 -right-28 w-80 h-80 rounded-full bg-accent-400 opacity-[0.14] blur-3xl"
        animate={{ x: [0, -20, 0], y: [0, 30, 0], scale: [1.05, 1, 1.05] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      <motion.div
        className="pointer-events-none absolute -bottom-16 left-1/4 w-72 h-72 rounded-full bg-gradient-hero opacity-[0.12] blur-3xl"
        animate={{ y: [0, -20, 0], scale: [1, 1.06, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />

      <div className="relative z-10 flex flex-col flex-1 px-6 py-12 max-w-md mx-auto w-full">
        {/* Logo */}
        <motion.div
          className="flex items-center gap-2.5 mb-10"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            className="w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow"
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <TrendingUp size={16} className="text-white" />
          </motion.div>
          <span className="text-base font-semibold text-text-primary font-heading">Monetta</span>
        </motion.div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-10">
          {Array.from({ length: STEP_COUNT }).map((_, i) => (
            <div key={i} className="h-1.5 rounded-full flex-1 bg-surface-200 overflow-hidden relative">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-primary"
                initial={false}
                animate={{ width: i <= step ? '100%' : '0%' }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              />
              {i === step && (
                <motion.div
                  className="absolute inset-y-0 left-0 w-full rounded-full bg-white/40"
                  animate={{ opacity: [0, 0.6, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Steps */}
        <div className="flex-1">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            {step === 0 && (
              <Step key="name" title="Olá! Como posso te chamar?" subtitle="Vamos personalizar sua experiência." direction={direction} icon={stepIcons[0]}>
                <Input
                  label="Seu nome"
                  placeholder="Ex: David"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && canProceed && goNext()}
                />
              </Step>
            )}
            {step === 1 && (
              <Step key="income" title={`Oi, ${name}!`} subtitle="Como você recebe sua renda?" direction={direction} icon={stepIcons[1]}>
                <div className="grid grid-cols-3 gap-2">
                  {frequencyOptions.map(opt => (
                    <motion.button
                      key={opt.value}
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setFrequency(opt.value)}
                      className={`relative px-2 py-2.5 rounded-xl border text-xs font-medium overflow-hidden transition-colors ${
                        frequency === opt.value
                          ? 'border-accent-500 text-white'
                          : 'border-border-base text-text-secondary hover:border-border-strong'
                      }`}
                    >
                      {frequency === opt.value && (
                        <motion.span
                          layoutId="freq-highlight"
                          className="absolute inset-0 bg-gradient-primary"
                          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        />
                      )}
                      <span className="relative z-10">{opt.label}</span>
                    </motion.button>
                  ))}
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={frequency}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col gap-3"
                  >
                    {frequency === 'biweekly' ? (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            label="1º pagamento"
                            placeholder="Ex: 800"
                            type="number"
                            value={income}
                            onChange={e => setIncome(e.target.value)}
                            prefix={<span className="text-xs font-medium">R$</span>}
                            autoFocus
                          />
                          <Input
                            label="2º pagamento"
                            placeholder={income ? `Ex: ${income}` : 'Se diferente'}
                            type="number"
                            value={income2}
                            onChange={e => setIncome2(e.target.value)}
                            prefix={<span className="text-xs font-medium">R$</span>}
                            onKeyDown={e => e.key === 'Enter' && canProceed && goNext()}
                          />
                        </div>
                        <IncomePreview value={toMonthlyIncome(buildIncomeInput())} />
                      </>
                    ) : frequency === 'daily' ? (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            label="Valor por dia"
                            placeholder="Ex: 120"
                            type="number"
                            value={income}
                            onChange={e => setIncome(e.target.value)}
                            prefix={<span className="text-xs font-medium">R$</span>}
                            autoFocus
                          />
                          <Input
                            label="Dias/mês"
                            placeholder="22"
                            type="number"
                            value={workDays}
                            onChange={e => setWorkDays(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && canProceed && goNext()}
                            hint="Dias trabalhados"
                          />
                        </div>
                        <IncomePreview value={toMonthlyIncome(buildIncomeInput())} />
                      </>
                    ) : (
                      <>
                        <Input
                          label={
                            frequency === 'weekly'   ? 'Quanto você recebe por semana?' :
                            frequency === 'variable' ? 'Qual sua renda média mensal?' :
                            'Quanto você recebe por mês?'
                          }
                          placeholder="Ex: 3500"
                          type="number"
                          value={income}
                          onChange={e => setIncome(e.target.value)}
                          prefix={<span className="text-xs font-medium">R$</span>}
                          autoFocus
                          onKeyDown={e => e.key === 'Enter' && canProceed && goNext()}
                          hint={frequency === 'variable' ? 'Sem problema — dá pra ajustar isso quando quiser no Dashboard.' : HINT_PLACEHOLDER}
                        />
                        {frequency === 'weekly' && <IncomePreview value={toMonthlyIncome(buildIncomeInput())} />}
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              </Step>
            )}
            {step === 2 && (
              <Step key="payday" title={paydayCopy[frequency].title} subtitle={paydayCopy[frequency].subtitle} direction={direction} icon={stepIcons[2]}>
                <Select
                  label={paydayCopy[frequency].label}
                  value={paymentDay}
                  onChange={e => setPaymentDay(e.target.value)}
                  options={dayOptions}
                />
              </Step>
            )}
            {step === 3 && (
              <Step key="goal" title="Qual é seu principal objetivo?" subtitle="Foque em um objetivo por vez — é mais eficaz." direction={direction} icon={stepIcons[3]}>
                <div className="flex flex-col gap-2">
                  {goalOptions.map((opt, i) => (
                    <motion.button
                      key={opt.value}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setGoal(opt.value)}
                      className={`relative flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-sm font-medium text-left overflow-hidden transition-colors ${
                        goal === opt.value
                          ? 'border-accent-500 text-accent-500'
                          : 'border-border-base text-text-primary hover:border-border-strong hover:bg-surface-50'
                      }`}
                    >
                      {goal === opt.value && (
                        <motion.span
                          layoutId="goal-highlight"
                          className="absolute inset-0 bg-accent-500/8"
                          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        />
                      )}
                      <span className={`relative z-10 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                        goal === opt.value ? 'border-accent-500' : 'border-surface-300'
                      }`}>
                        <AnimatePresence>
                          {goal === opt.value && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                              className="w-2 h-2 rounded-full bg-accent-500"
                            />
                          )}
                        </AnimatePresence>
                      </span>
                      <span className="relative z-10">{opt.label}</span>
                    </motion.button>
                  ))}
                </div>
              </Step>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <motion.div
          className="flex gap-3 mt-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
        >
          {step > 0 && (
            <Button variant="secondary" size="lg" onClick={goBack}>
              Voltar
            </Button>
          )}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!canProceed}
            loading={step === STEP_COUNT - 1 && loading && !justSaved}
            onClick={() => {
              if (step < STEP_COUNT - 1) goNext()
              else handleFinish()
            }}
            iconEnd={
              step < STEP_COUNT - 1 && !justSaved ? (
                <motion.span
                  className="flex"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <ChevronRight size={16} />
                </motion.span>
              ) : undefined
            }
          >
            <AnimatePresence mode="wait" initial={false}>
              {justSaved ? (
                <motion.span
                  key="done"
                  initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  className="flex items-center gap-2"
                >
                  <Check size={18} /> Tudo pronto!
                </motion.span>
              ) : (
                <motion.span key="label">{step < STEP_COUNT - 1 ? 'Continuar' : 'Começar'}</motion.span>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
