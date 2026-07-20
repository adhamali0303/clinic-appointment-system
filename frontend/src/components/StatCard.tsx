// frontend/src/components/StatCard.tsx
import { Card } from './Card'

interface StatCardProps {
  label: string
  value: number
  subtext?: string
}

export function StatCard({ label, value, subtext }: StatCardProps) {
  return (
    <Card>
      <div className="text-sm font-medium text-gray-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-gray-900">{value}</div>
      {subtext && <div className="mt-1 text-xs text-gray-400">{subtext}</div>}
    </Card>
  )
}
