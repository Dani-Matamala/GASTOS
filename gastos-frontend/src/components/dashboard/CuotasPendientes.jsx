export default function CuotasPendientes({ pendientes }) {
  const fmt = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

  const hoy = new Date()
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`

  return (
    <div className="bg-white rounded-2xl p-6 shadow">
      <h2 className="text-base font-semibold text-gray-700 mb-4">Cuotas pendientes por mes</h2>
      {pendientes.length === 0 ? (
        <p className="text-sm text-gray-400">No hay cuotas pendientes 🎉</p>
      ) : (
        <div className="flex flex-col gap-2">
          {pendientes.map(item => (
            <div
              key={item.mes}
              className={`flex justify-between items-center p-3 rounded-xl text-sm
                ${item.mes === mesActual ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}`}
            >
              <div>
                <span className={`font-medium ${item.mes === mesActual ? 'text-amber-700' : 'text-gray-700'}`}>
                  {new Date(item.mes + '-01').toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                </span>
                {item.mes === mesActual && (
                  <span className="ml-2 text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">Este mes</span>
                )}
                <p className="text-gray-400 text-xs">{item.cantidad} {item.cantidad === 1 ? 'cuota' : 'cuotas'}</p>
              </div>
              <span className={`font-bold ${item.mes === mesActual ? 'text-amber-700' : 'text-gray-800'}`}>
                {fmt(item.total)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}