export type PasswordStrengthLevel = 'weak' | 'medium' | 'strong'

export function getPasswordStrength(password: string): { level: PasswordStrengthLevel; label: string; score: number } {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { level: 'weak', label: 'Fraca', score }
  if (score <= 3) return { level: 'medium', label: 'Média', score }
  return { level: 'strong', label: 'Forte', score }
}
