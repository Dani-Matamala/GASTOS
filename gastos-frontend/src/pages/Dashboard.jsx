import { useEffect, useState } from 'react'
import { getResumen, getCuotasPendientes } from '../api'
import ResumenCards from '../components/dashboard/ResumenCards'
import GastosPorCategoria from '../components/dashboard/GastosPorCategoria'
import CuotasPendientes from '../components/dashboard/CuotasPendientes'

export default function Dashboard() {
  const hoy = new Date()
  const primerDia = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`
  const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0]

  const [desde, setDesde] = useState(primerDia)
  const [hasta, setHasta] = useState(ultimoDia)
  const [resumen, setResumen] = useState(null)
  const [pendientes, setPendientes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
  const fetchData = async () => {
    setLoading(true)
    try {
      const [r, p] = await Promise.all([getResumen(desde, hasta), getCuotasPendientes()])
      setResumen(r)
      setPendientes(p)
    } finally {
      setLoading(false)
    }
  }

  fetchData()
}, [desde, hasta])

  return (
  <div className="min-h-screen bg-gray-100 p-4 md:p-8">
    <div className="max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">💰 Mis Gastos</h1>
        <div className="flex gap-2 items-center text-sm">
          <input
            type="date" value={desde}
            onChange={e => setDesde(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
          />
          <span className="text-gray-400">hasta</span>
          <input
            type="date" value={hasta}
            onChange={e => setHasta(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
          />
        </div>
      </div>

      {loading || !resumen ? (
        <div className="text-center py-20 text-gray-400">Cargando...</div>
      ) : (
        <div className="flex flex-col gap-6">
          <ResumenCards total={resumen.total} porTipoPago={resumen.porTipoPago} />
          <GastosPorCategoria porCategoria={resumen.porCategoria} total={resumen.total} />
          <CuotasPendientes pendientes={pendientes} />
        </div>
      )}

    </div>
  </div>
)
}