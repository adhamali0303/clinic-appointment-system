// frontend/src/components/Toast.tsx
import { useEffect } from 'react'

interface ToastProps {
  message: string
  onClose: () => void
  durationMs?: number
}

export function Toast({ message, onClose, durationMs = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, durationMs)
    return () => clearTimeout(timer)
  }, [onClose, durationMs])

  return (
    <div className="fixed right-6 top-6 z-50 flex max-w-sm items-start gap-3 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 shadow-lg">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
          clipRule="evenodd"
        />
      </svg>
      <span className="text-sm font-medium text-emerald-800">{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="ml-auto shrink-0 text-emerald-400 hover:text-emerald-600"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}
