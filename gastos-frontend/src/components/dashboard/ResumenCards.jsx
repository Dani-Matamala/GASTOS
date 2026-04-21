export default function ResumenCards({ total, porTipoPago }) {
  const iconos = {
    efectivo: '💵',
    mercado_pago: '📱',
    tarjeta_credito: '💳',
    tarjeta_debito: '🏧',
    transferencia: '🔁',
  }

  const etiquetas = {
    efectivo: 'Efectivo',
    mercado_pago: 'Mercado Pago',
    tarjeta_credito: 'Tarjeta Crédito',
    tarjeta_debito: 'Tarjeta Débito',
    transferencia: 'Transferencia',
  }

  const fmt = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

  return (
    <div>
      {/* Total general */}
      <div className="bg-indigo-600 text-white rounded-2xl p-6 mb-6 shadow">
        <p className="text-sm opacity-80 mb-1">Total gastado</p>
        <p className="text-4xl font-bold">{fmt(total)}</p>
      </div>

      {/* Por tipo de pago */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {porTipoPago.map(item => (
          <div key={item.tipo_pago} className="bg-white rounded-2xl p-4 shadow flex flex-col gap-1">
            <span className="text-2xl">{iconos[item.tipo_pago] || '💰'}</span>
            <p className="text-xs text-gray-500">{etiquetas[item.tipo_pago] || item.tipo_pago}</p>
            <p className="text-lg font-bold text-gray-800">{fmt(item.total)}</p>
            <p className="text-xs text-gray-400">{item.cantidad} {item.cantidad === 1 ? 'gasto' : 'gastos'}</p>
          </div>
        ))}
      </div>
    </div>
  )
}