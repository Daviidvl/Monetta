import { useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { formatCurrency } from '../../utils/format'

interface AnimatedNumberProps {
  value: number
  className?: string
  format?: (v: number) => string
}

export function AnimatedNumber({ value, className, format = formatCurrency }: AnimatedNumberProps) {
  const motionValue = useMotionValue(0)
  const display = useTransform(motionValue, format)

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 0.8, ease: [0.16, 1, 0.3, 1] })
    return controls.stop
  }, [value])

  return <motion.span className={className}>{display}</motion.span>
}
