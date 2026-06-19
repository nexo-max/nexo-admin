import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../api/client'
import { formatDate, timeAgo } from '../lib/utils'
import { Search, Shield, ShieldOff, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'all', label: 'Wszyscy' },
  { value: 'active', label: 'Aktywni' },
  { value: 'blocked', label: 'Zablokowani' },
  { value: 'unverified', label: 'Niezweryfikowani' },
]

export default function UsersPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [blockModal, setBlockModal] = useState<{ id: string; email: string } | null>(null)
  const [blockReason, setBlockReason] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, status, page],
    queryFn: () =>
      adminApi
        .getUsers({ search, status, page: String(page), limit: '20' })
        .then((r) => r.data.data),
    placeholderData: (prev) => prev,
  })

  const blockMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminApi.blockUser(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      setBlockModal(null)
      setBlockReason('')
    },
  })

  const unblockMutation = useMutation({
    mutationFn: (id: string) => adminApi.unblockUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const users = data?.users ?? []
  const pagination = data?.pagination

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Użytkownicy</h2>
        <p className="text-muted-foreground text-sm mt-1">Zarządzanie kontami użytkowników platformy</p>
      </div>

      {/* Filtry */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Szukaj po e-mail..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full bg-input border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-1 bg-card border border-border rounded-xl p-1">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setStatus(opt.value); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                status === opt.value
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Użytkownik</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Status</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Rejestracja</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Ostatnia aktywność</th>
                <th className="text-right px-5 py-3 text-muted-foreground font-medium">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">
                    Ładowanie...
                  </td>
                </tr>
              )}
              {!isLoading && users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">
                    Brak użytkowników
                  </td>
                </tr>
              )}
              {users.map((user: any) => (
                <tr key={user.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {user.profile?.avatarUrl ? (
                          <img src={user.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-primary font-bold text-sm">
                            {user.email[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{user.profile?.displayName ?? '—'}</p>
                        <p className="text-muted-foreground text-xs">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {user.isAdmin && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-violet-500/20 text-violet-400 font-medium">
                          Admin
                        </span>
                      )}
                      {user.isBlocked && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-destructive/20 text-destructive font-medium">
                          Zablokowany
                        </span>
                      )}
                      {!user.isVerified && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-400 font-medium">
                          Niezweryfikowany
                        </span>
                      )}
                      {user.isVerified && !user.isBlocked && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400 font-medium">
                          Aktywny
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground text-xs">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground text-xs">
                    {user.profile?.lastSeen ? timeAgo(user.profile.lastSeen) : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {!user.isAdmin && (
                        <>
                          {user.isBlocked ? (
                            <button
                              onClick={() => unblockMutation.mutate(user.id)}
                              title="Odblokuj"
                              className="p-2 rounded-lg text-muted-foreground hover:text-emerald-400 hover:bg-emerald-400/10 transition-colors"
                            >
                              <ShieldOff className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setBlockModal({ id: user.id, email: user.email })}
                              title="Zablokuj"
                              className="p-2 rounded-lg text-muted-foreground hover:text-amber-400 hover:bg-amber-400/10 transition-colors"
                            >
                              <Shield className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm(`Czy na pewno chcesz usunąć konto ${user.email}?`)) {
                                deleteMutation.mutate(user.id)
                              }
                            }}
                            title="Usuń"
                            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginacja */}
        {pagination && pagination.pages > 1 && (
          <div className="px-5 py-4 border-t border-border flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {pagination.total} użytkowników łącznie
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>
                {page} / {pagination.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="p-2 rounded-lg hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal blokady */}
      {blockModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold">Zablokuj konto</h3>
            <p className="text-sm text-muted-foreground">
              Blokujesz konto: <strong className="text-foreground">{blockModal.email}</strong>
            </p>
            <div className="space-y-1">
              <label className="text-sm font-medium">Powód blokady</label>
              <textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                rows={3}
                className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Opisz powód blokady konta..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setBlockModal(null); setBlockReason('') }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={() => blockMutation.mutate({ id: blockModal.id, reason: blockReason })}
                disabled={!blockReason.trim() || blockMutation.isPending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-destructive text-white text-sm font-medium hover:bg-destructive/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {blockMutation.isPending ? 'Blokuję...' : 'Zablokuj'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
