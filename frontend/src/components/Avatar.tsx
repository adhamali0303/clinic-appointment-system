// frontend/src/components/Avatar.tsx
import { getInitials } from '../lib/format'

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
}

export function Avatar({ name, size = 'md' }: AvatarProps) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-teal-100 font-semibold text-teal-700 ${sizeClasses[size]}`}
    >
      {getInitials(name)}
    </div>
  )
}
