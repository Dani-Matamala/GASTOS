import { useEffect, useState } from 'react'
import { getGastos, crearGasto, editarGasto, eliminarGasto } from '../api'
import GastoModal from '../components/gastos/GastosModal'

const TIPOS_LABEL = {
  efectivo: '💵 Efectivo',
  mercado_pago: '📱 Mercado Pago',
  tarjeta_credito: '💳 T. Crédito',
  tarjeta_debito: '🏧 T. Débito',
  transferencia: '🔁 Transferencia',
}

const fmt = (n) => new Intl.NumberFormat('es-AR', {
  style: 'currency', currency: 'ARS', maximumFractionDigits: 0
}).format(n)

export default function Gastos() {
  const [gastos, setGastos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [gastoEditando, setGastoEditando] = useState(null)
  const [confirmEliminar, setConfirmEliminar] = useState(null)

  const cargar = async () => {
    setLoading(true)
    const data = await getGastos()
    setGastos(data)
    setLoading(false)
  }

    useEffect(() => { async () => { await cargar() } }, [])

  const handleGuardar = async (data) => {
    if (gastoEditando) {
      await editarGasto(gastoEditando.id, data)
    } else {
      await crearGasto(data)
    }
    await cargar()
  }

  const handleEliminar = async (id) => {
    await eliminarGasto(id)
    setConfirmEliminar(null)
    await cargar()
  }

  const abrirNuevo = () => { setGastoEditando(null); setModalAbierto(true) }
  const abrirEditar = (g) => { setGastoEditando(g); setModalAbierto(true) }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">📋 Gastos</h1>
          <button
            onClick={abrirNuevo}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700"
          >
            + Nuevo gasto
          </button>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Cargando...</div>
        ) : gastos.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">🧾</p>
            <p>No hay gastos todavía</p>
            <button onClick={abrirNuevo} className="mt-4 text-indigo-600 text-sm hover:underline">
              Crear el primero
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {gastos.map(g => (
              <div key={g.id} className="bg-white rounded-2xl p-4 shadow flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <p className="font-semibold text-gray-800">{g.descripcion}</p>
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {TIPOS_LABEL[g.tipo_pago]}
                    </span>
                    {g.categoria_nombre && (
                      <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                        {g.categoria_nombre}
                      </span>
                    )}
                    {g.es_cuotas ? (
                      <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
                        {g.cuotas_total} cuotas de {fmt(g.monto_cuota)}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-gray-400">{g.fecha}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="font-bold text-gray-800">{fmt(g.monto)}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => abrirEditar(g)}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setConfirmEliminar(g)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal crear/editar */}
      {modalAbierto && (
        <GastoModal
          gasto={gastoEditando}
          onClose={() => setModalAbierto(false)}
          onGuardar={handleGuardar}
        />
      )}

      {/* Confirm eliminar */}
      {confirmEliminar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full">
            <h3 className="font-bold text-gray-800 mb-2">¿Eliminar gasto?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Se eliminará <strong>{confirmEliminar.descripcion}</strong> y no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmEliminar(null)}
                className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleEliminar(confirmEliminar.id)}
                className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm hover:bg-red-600"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}