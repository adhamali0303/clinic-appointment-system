// frontend/src/lib/auditLog.ts

export interface ActionTagStyle {
  label: string
  className: string
}

// Order matters - more specific suffixes (e.g. "_STATUS_UPDATED") must be
// checked before their more general counterpart ("_UPDATED").
const ACTION_TAG_RULES: (ActionTagStyle & { suffix: string })[] = [
  { suffix: '_BOOKED', label: 'Booked', className: 'bg-emerald-50 text-emerald-700' },
  { suffix: '_CANCELLED', label: 'Cancelled', className: 'bg-red-50 text-red-700' },
  { suffix: '_RESCHEDULED', label: 'Rescheduled', className: 'bg-amber-50 text-amber-700' },
  { suffix: '_STATUS_UPDATED', label: 'Status Changed', className: 'bg-purple-50 text-purple-700' },
  { suffix: '_UPDATED', label: 'Updated', className: 'bg-indigo-50 text-indigo-700' },
  { suffix: '_CREATED', label: 'Created', className: 'bg-teal-50 text-teal-700' },
  { suffix: '_DELETED', label: 'Deleted', className: 'bg-gray-100 text-gray-600' },
]

export function getActionTag(action: string): ActionTagStyle {
  const rule = ACTION_TAG_RULES.find((r) => action.endsWith(r.suffix))
  return rule ? { label: rule.label, className: rule.className } : { label: action, className: 'bg-gray-100 text-gray-600' }
}
