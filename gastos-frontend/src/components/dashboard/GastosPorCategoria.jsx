export default function GastosPorCategoria({ porCategoria, total }) {
  const fmt = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

  const colores = [
    'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500',
    'bg-rose-500', 'bg-sky-500', 'bg-violet-500'
  ]

  return (
    <div className="bg-white rounded-2xl p-6 shadow">
      <h2 className="text-base font-semibold text-gray-700 mb-4">Por categoría</h2>
      <div className="flex flex-col gap-3">
        {porCategoria.map((item, i) => {
          const pct = total > 0 ? Math.round((item.total / total) * 100) : 0
          return (
            <div key={item.categoria}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700 font-medium">{item.categoria}</span>
                <span className="text-gray-500">{fmt(item.total)} · {pct}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`${colores[i % colores.length]} h-2 rounded-full transition-all`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}