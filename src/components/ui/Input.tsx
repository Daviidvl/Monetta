import { forwardRef } from 'react'
import { cn } from '../../utils/cn'

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string
  error?: string
  hint?: string
  prefix?: React.ReactNode
  suffix?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, prefix, suffix, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <div className="absolute left-3 text-text-muted flex items-center pointer-events-none">
              {prefix}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-10 rounded-xl border bg-surface-0 text-sm text-text-primary',
              'placeholder:text-text-muted transition-colors duration-150',
              'border-border-base focus:border-accent-500 focus:ring-0 focus:outline-none',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-status-danger focus:border-status-danger',
              prefix ? 'pl-9' : 'pl-3',
              suffix ? 'pr-9' : 'pr-3',
              className,
            )}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3 text-text-muted flex items-center pointer-events-none">
              {suffix}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-status-danger">{error}</p>}
        {!error && hint && <p className="text-xs text-text-muted">{hint}</p>}
      </div>
    )
  },
)

Input.displayName = 'Input'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(
            'w-full h-10 px-3 rounded-xl border bg-surface-0 text-sm text-text-primary',
            'border-border-base focus:border-accent-500 focus:ring-0 focus:outline-none',
            'transition-colors duration-150 appearance-none cursor-pointer',
            error && 'border-status-danger',
            className,
          )}
          {...props}
        >
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {error && <p className="text-xs text-status-danger">{error}</p>}
      </div>
    )
  },
)

Select.displayName = 'Select'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3 py-2.5 rounded-xl border bg-surface-0 text-sm text-text-primary',
            'placeholder:text-text-muted resize-none transition-colors duration-150',
            'border-border-base focus:border-accent-500 focus:ring-0 focus:outline-none',
            error && 'border-status-danger',
            className,
          )}
          rows={3}
          {...props}
        />
        {error && <p className="text-xs text-status-danger">{error}</p>}
        {!error && hint && <p className="text-xs text-text-muted">{hint}</p>}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'
