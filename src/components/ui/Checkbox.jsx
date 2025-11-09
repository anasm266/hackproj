import clsx from 'clsx'
import { Check } from 'lucide-react'

/**
 * Reusable Checkbox component
 */
export default function Checkbox({ label, checked, onChange, disabled = false, className }) {
  return (
    <label
      className={clsx(
        'flex items-center gap-2 cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={clsx(
            'w-5 h-5 border-2 rounded transition-all',
            checked
              ? 'bg-primary-600 border-primary-600'
              : 'bg-white border-gray-300 hover:border-primary-500'
          )}
        >
          {checked && (
            <Check className="w-4 h-4 text-white absolute top-0 left-0" strokeWidth={3} />
          )}
        </div>
      </div>
      {label && <span className="text-sm text-gray-700 select-none">{label}</span>}
    </label>
  )
}
