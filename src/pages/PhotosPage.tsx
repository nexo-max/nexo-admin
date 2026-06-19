import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../api/client'
import { Check, X, ChevronLeft, ChevronRight, ImageOff } from 'lucide-react'
import { timeAgo } from '../lib/utils'

export default function PhotosPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [preview, setPreview] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-photos', page],
    queryFn: () =>
      adminApi.getPendingPhotos({ page: String(page), limit: '20' }).then((r) => r.data.data),
    placeholderData: (prev) => prev,
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi.approvePhoto(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-photos'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deletePhoto(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-photos'] }),
  })

  const photos = data?.photos ?? []
  const pagination = data?.pagination

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Moderacja zdjęć</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Przeglądaj i zatwierdzaj zdjęcia przesłane przez użytkowników
        </p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square bg-card border border-border rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && photos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-card border border-border rounded-2xl flex items-center justify-center mb-4">
            <ImageOff className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground">Brak zdjęć do moderacji</h3>
          <p className="text-sm text-muted-foreground mt-1">Wszystkie zdjęcia zostały sprawdzone.</p>
        </div>
      )}

      {!isLoading && photos.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo: any) => (
              <div
                key={photo.id}
                className="bg-card border border-border rounded-2xl overflow-hidden group"
              >
                {/* Zdjęcie */}
                <div
                  className="aspect-square relative cursor-zoom-in"
                  onClick={() => setPreview(photo.url)}
                >
                  <img
                    src={photo.url}
                    alt="Zdjęcie do moderacji"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </div>

                {/* Info */}
                <div className="p-3 space-y-2">
                  <p className="text-xs font-medium truncate">{photo.user?.profile?.displayName ?? '—'}</p>
                  <p className="text-xs text-muted-foreground truncate">{photo.user?.email}</p>
                  <p className="text-xs text-muted-foreground">{timeAgo(photo.createdAt)}</p>

                  {/* Akcje */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => approveMutation.mutate(photo.id)}
                      disabled={approveMutation.isPending}
                      title="Zatwierdź"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-medium transition-colors disabled:opacity-60"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Zatwierdź
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Usunąć to zdjęcie?')) deleteMutation.mutate(photo.id)
                      }}
                      disabled={deleteMutation.isPending}
                      title="Odrzuć i usuń"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-destructive/20 text-destructive hover:bg-destructive/30 text-xs font-medium transition-colors disabled:opacity-60"
                    >
                      <X className="w-3.5 h-3.5" />
                      Odrzuć
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Paginacja */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{pagination.total} zdjęć łącznie</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span>{page} / {pagination.pages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                  className="p-2 rounded-lg hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Podgląd zdjęcia */}
      {preview && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 cursor-zoom-out"
          onClick={() => setPreview(null)}
        >
          <img
            src={preview}
            alt="Podgląd"
            className="max-w-full max-h-full rounded-2xl object-contain"
          />
        </div>
      )}
    </div>
  )
}
