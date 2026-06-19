import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../api/client'
import { formatDate } from '../lib/utils'
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Eye } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: '', label: 'Wszystkie' },
  { value: 'PENDING', label: 'Oczekujące' },
  { value: 'REVIEWED', label: 'Przejrzane' },
  { value: 'RESOLVED', label: 'Rozwiązane' },
  { value: 'DISMISSED', label: 'Odrzucone' },
]

const REASON_LABELS: Record<string, string> = {
  SPAM: 'Spam',
  HARASSMENT: 'Nękanie',
  UNDERAGE: 'Niepełnoletni',
  FAKE_PROFILE: 'Fałszywy profil',
  INAPPROPRIATE_CONTENT: 'Nieodpowiednie treści',
  OTHER: 'Inne',
}

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
  PENDING: { label: 'Oczekuje', class: 'bg-amber-500/20 text-amber-400' },
  REVIEWED: { label: 'Przejrzane', class: 'bg-blue-500/20 text-blue-400' },
  RESOLVED: { label: 'Rozwiązane', class: 'bg-emerald-500/20 text-emerald-400' },
  DISMISSED: { label: 'Odrzucone', class: 'bg-muted text-muted-foreground' },
}

export default function ReportsPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('PENDING')
  const [page, setPage] = useState(1)
  const [noteModal, setNoteModal] = useState<{
    id: string
    action: 'RESOLVED' | 'DISMISSED'
  } | null>(null)
  const [adminNote, setAdminNote] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports', statusFilter, page],
    queryFn: () =>
      adminApi
        .getReports({ ...(statusFilter && { status: statusFilter }), page: String(page), limit: '20' })
        .then((r) => r.data.data),
    placeholderData: (prev) => prev,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note?: string }) =>
      adminApi.updateReport(id, { status, adminNote: note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reports'] })
      setNoteModal(null)
      setAdminNote('')
    },
  })

  const reports = data?.reports ?? []
  const pagination = data?.pagination

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Zgłoszenia użytkowników</h2>
        <p className="text-muted-foreground text-sm mt-1">Rozpatruj zgłoszenia naruszeń regulaminu</p>
      </div>

      {/* Filtry statusu */}
      <div className="flex gap-1 bg-card border border-border rounded-xl p-1 w-fit">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { setStatusFilter(opt.value); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === opt.value
                ? 'bg-primary text-white'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Lista zgłoszeń */}
      <div className="space-y-3">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-5 h-28 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && reports.length === 0 && (
          <div className="bg-card border border-border rounded-2xl p-12 text-center">
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <p className="font-medium">Brak zgłoszeń</p>
            <p className="text-sm text-muted-foreground mt-1">
              {statusFilter === 'PENDING' ? 'Wszystkie zgłoszenia zostały rozpatrzone.' : 'Brak zgłoszeń w tej kategorii.'}
            </p>
          </div>
        )}

        {reports.map((report: any) => (
          <div key={report.id} className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">
                    {REASON_LABELS[report.reason] ?? report.reason}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_LABELS[report.status]?.class}`}>
                    {STATUS_LABELS[report.status]?.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Zgłaszający: <span className="text-foreground">{report.reporter?.profile?.displayName ?? report.reporter?.email}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Zgłoszony: <span className="text-foreground">{report.reportedUser?.profile?.displayName ?? report.reportedUser?.email}</span>
                </p>
                {report.description && (
                  <p className="text-xs text-muted-foreground border-l-2 border-border pl-3 mt-2">
                    {report.description}
                  </p>
                )}
                {report.adminNote && (
                  <p className="text-xs bg-secondary px-3 py-2 rounded-lg mt-2">
                    <span className="text-muted-foreground">Notatka admina: </span>
                    {report.adminNote}
                  </p>
                )}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDate(report.createdAt)}
              </span>
            </div>

            {report.status === 'PENDING' && (
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => updateMutation.mutate({ id: report.id, status: 'REVIEWED' })}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 text-xs font-medium transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Przejrzyj
                </button>
                <button
                  onClick={() => setNoteModal({ id: report.id, action: 'RESOLVED' })}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-medium transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Rozwiąż
                </button>
                <button
                  onClick={() => setNoteModal({ id: report.id, action: 'DISMISSED' })}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Odrzuć
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Paginacja */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{pagination.total} zgłoszeń łącznie</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-secondary disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>{page} / {pagination.pages}</span>
            <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="p-2 rounded-lg hover:bg-secondary disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal z notatką */}
      {noteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold">
              {noteModal.action === 'RESOLVED' ? 'Rozwiąż zgłoszenie' : 'Odrzuć zgłoszenie'}
            </h3>
            <div className="space-y-1">
              <label className="text-sm font-medium">Notatka (opcjonalna)</label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={3}
                className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Dodaj notatkę dla przyszłego odniesienia..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setNoteModal(null); setAdminNote('') }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={() => updateMutation.mutate({ id: noteModal.id, status: noteModal.action, note: adminNote || undefined })}
                disabled={updateMutation.isPending}
                className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-colors disabled:opacity-60 ${
                  noteModal.action === 'RESOLVED' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-secondary hover:bg-secondary/80 text-foreground'
                }`}
              >
                {updateMutation.isPending ? 'Zapisuję...' : 'Potwierdź'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
