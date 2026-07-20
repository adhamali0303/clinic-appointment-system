// frontend/src/lib/format.ts

export function displayNameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? email
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function formatTime(dateTimeStr: string): string {
  const d = new Date(dateTimeStr)
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function formatDateLong(date: Date = new Date()): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function toDateInputValue(date: Date): string {
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 10)
}

export function combineDateAndTime(date: string, time: string): string {
  return `${date}T${time}`
}

export function splitDateTime(dateTimeStr: string): { date: string; time: string } {
  const [date, time] = dateTimeStr.split('T')
  return { date, time }
}

export function addMinutesToTime(time: string, minutesToAdd: number): string {
  const [h, m, s] = time.split(':').map(Number)
  const total = h * 60 + m + minutesToAdd
  const normalized = ((total % 1440) + 1440) % 1440
  const newH = Math.floor(normalized / 60)
  const newM = normalized % 60
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}:${String(s ?? 0).padStart(2, '0')}`
}

export function getTimeOfDayGreeting(date: Date = new Date()): string {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function formatDateTime(dateTimeStr: string): string {
  const d = new Date(dateTimeStr)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
