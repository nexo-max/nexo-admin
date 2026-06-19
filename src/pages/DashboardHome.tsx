import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../api/client'
import { Users, Image, Flag, UserCheck, UserX, TrendingUp } from 'lucide-react'

interface Stats {
  totalUsers: number
  verifiedUsers: number
  blockedUsers: number
  pendingPhotos: number
  pendingReports: number
  todayRegistrations: number
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  urgent,
}: {
  icon: React.ElementType
  label: string
  value: number | string
  color: string
  urgent?: boolean
}) {
  return (
    <div
      className={`bg-card border rounded-2xl p-6 flex items-center gap-5 ${
        urgent ? 'border-destructive/40' : 'border-border'
      }`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
      {urgent && value > 0 && (
        <span className="ml-auto text-xs bg-destructive/20 text-destructive px-2 py-1 rounded-full font-medium">
          Wymaga uwagi
        </span>
      )}
    </div>
  )
}

export default function DashboardHome() {
  const { data, isLoading, isError } = useQuery<Stats>({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getStats().then((r) => r.data.data),
    refetchInterval: 30_000,
  })

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-6 h-24 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-8">
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-2xl p-6">
          Błąd podczas ładowania statystyk. Sprawdź połączenie z serwerem.
        </div>
      </div>
    )
  }

  const stats = data!

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Przegląd stanu platformy Nexo w czasie rzeczywistym
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard
          icon={Users}
          label="Wszyscy użytkownicy"
          value={stats.totalUsers}
          color="bg-violet-600"
        />
        <StatCard
          icon={UserCheck}
          label="Zweryfikowani"
          value={stats.verifiedUsers}
          color="bg-emerald-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Rejestracje dzisiaj"
          value={stats.todayRegistrations}
          color="bg-blue-600"
        />
        <StatCard
          icon={Image}
          label="Zdjęcia do moderacji"
          value={stats.pendingPhotos}
          color="bg-amber-600"
          urgent
        />
        <StatCard
          icon={Flag}
          label="Zgłoszenia do rozpatrzenia"
          value={stats.pendingReports}
          color="bg-rose-600"
          urgent
        />
        <StatCard
          icon={UserX}
          label="Zablokowane konta"
          value={stats.blockedUsers}
          color="bg-slate-600"
        />
      </div>

      {(stats.pendingPhotos > 0 || stats.pendingReports > 0) && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5">
          <h3 className="font-semibold text-amber-400 mb-2">Wymagana uwaga:</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {stats.pendingPhotos > 0 && (
              <li>• {stats.pendingPhotos} zdjęć oczekuje na moderację</li>
            )}
            {stats.pendingReports > 0 && (
              <li>• {stats.pendingReports} zgłoszeń wymaga rozpatrzenia</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
