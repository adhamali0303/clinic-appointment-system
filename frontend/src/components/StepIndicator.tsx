// frontend/src/components/StepIndicator.tsx
interface StepIndicatorProps {
  steps: readonly string[]
  currentStep: number
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-start">
      {steps.map((label, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep
        return (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  isCompleted
                    ? 'bg-teal-50 text-teal-600 ring-1 ring-inset ring-teal-200'
                    : isCurrent
                      ? 'bg-teal-500 text-white'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`whitespace-nowrap text-xs font-medium ${
                  isCurrent ? 'text-gray-900' : isCompleted ? 'text-teal-600' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`mx-2 h-0.5 flex-1 ${isCompleted ? 'bg-teal-200' : 'bg-gray-100'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
