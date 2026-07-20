// frontend/src/pages/AuditLogPage.tsx
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { auditLogApi } from '../api/auditLogApi'
import { Card } from '../components/Card'
import { getActionTag } from '../lib/auditLog'
import { formatDateTime } from '../lib/format'

const RECENT_LIMIT = 50

export function AuditLogPage() {
  const [actionFilter, setActionFilter] = useState('')

  const {
    data: entries,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['audit-logs', 'all', RECENT_LIMIT],
    queryFn: () => auditLogApi.getAll({ limit: RECENT_LIMIT }),
  })

  const rows = entries ?? []
  const actionOptions = useMemo(
    () => Array.from(new Set(rows.map((entry) => entry.action))).sort(),
    [rows],
  )

  const filtered = actionFilter ? rows.filter((entry) => entry.action === actionFilter) : rows

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Audit Log</h1>
        <p className="mt-1 text-sm text-gray-500">
          {isLoading ? 'Loading…' : `Showing the ${rows.length} most recent entries`}
        </p>
      </div>

      <Card className="mt-6 p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 p-4">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="">All Actions</option>
            {actionOptions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>

        {isLoading && (
          <div className="space-y-3 p-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        )}

        {isError && (
          <p className="p-6 text-sm text-red-600">Could not load the audit log. Please try again.</p>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <p className="p-6 text-sm text-gray-500">No audit entries found.</p>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium uppercase tracking-wide text-gray-400">
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">Performed By</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((entry) => {
                  const tag = getActionTag(entry.action)
                  return (
                    <tr key={entry.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-gray-600">
                        {formatDateTime(entry.timestamp)}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{entry.performedBy}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tag.className}`}
                        >
                          {tag.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{entry.details}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
