import { useEffect, useState } from 'react'
import { getCategorias, crearCategoria } from '../../api'

const TIPOS_PAGO = [
  { value: 'efectivo', label: '💵 Efectivo' },
  { value: 'mercado_pago', label: '📱 Mercado Pago' },
  { value: 'tarjeta_credito', label: '💳 Tarjeta Crédito' },
  { value: 'tarjeta_debito', label: '🏧 Tarjeta Débito' },
  { value: 'transferencia', label: '🔁 Transferencia' },
]

const INICIAL = {
  descripcion: '', monto: '', tipo_pago: 'efectivo',
  categoria_id: '', fecha: new Date().toISOString().split('T')[0],
  cuotas: 1
}

export default function GastoModal({ gasto, onClose, onGuardar }) {
  const [form, setForm] = useState(INICIAL)
  const [categorias, setCategorias] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  // Estado para crear categoría inline
  const [creandoCategoria, setCreandoCategoria] = useState(false)
  const [nuevaCategoria, setNuevaCategoria] = useState('')
  const [guardandoCategoria, setGuardandoCategoria] = useState(false)
  const [errorCategoria, setErrorCategoria] = useState('')

  const cargarCategorias = async () => {
    const data = await getCategorias()
    setCategorias(data)
    return data
  }

  useEffect(() => {
    cargarCategorias()
    if (gasto) {
      setForm({
        descripcion: gasto.descripcion || '',
        monto: gasto.monto || '',
        tipo_pago: gasto.tipo_pago || 'efectivo',
        categoria_id: gasto.categoria_id || '',
        fecha: gasto.fecha || new Date().toISOString().split('T')[0],
        cuotas: gasto.cuotas_total || 1
      })
    } else {
      setForm(INICIAL)
    }
  }, [gasto])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const handleCrearCategoria = async () => {
    if (!nuevaCategoria.trim()) return setErrorCategoria('Escribí un nombre')
    setErrorCategoria('')
    setGuardandoCategoria(true)
    try {
      const res = await crearCategoria({ nombre: nuevaCategoria.trim() })
      const data = await cargarCategorias()
      // Seleccionar la nueva categoría automáticamente
      const nueva = data.find(c => c.nombre === nuevaCategoria.trim())
      if (nueva) setForm(f => ({ ...f, categoria_id: nueva.id }))
      setNuevaCategoria('')
      setCreandoCategoria(false)
    } catch (e) {
      setErrorCategoria('Error al crear la categoría')
    } finally {
      setGuardandoCategoria(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.descripcion) return setError('La descripción es obligatoria')
    if (!form.monto || form.monto <= 0) return setError('El monto debe ser mayor a 0')
    setError('')
    setCargando(true)
    try {
      await onGuardar({
        ...form,
        monto: Number(form.monto),
        categoria_id: form.categoria_id ? Number(form.categoria_id) : null,
        cuotas: Number(form.cuotas)
      })
      onClose()
    } catch (e) {
      setError('Ocurrió un error al guardar')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-gray-800">
            {gasto ? 'Editar gasto' : 'Nuevo gasto'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {/* Form */}
        <div className="p-6 flex flex-col gap-4">
          {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Descripción</label>
            <input
              name="descripcion" value={form.descripcion} onChange={handleChange}
              placeholder="Ej: Supermercado Día"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Monto ($)</label>
              <input
                name="monto" type="number" value={form.monto} onChange={handleChange}
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Fecha</label>
              <input
                name="fecha" type="date" value={form.fecha} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Tipo de pago</label>
            <select
              name="tipo_pago" value={form.tipo_pago} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {TIPOS_PAGO.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Categoría con opción de crear inline */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-medium text-gray-700">Categoría</label>
              {!creandoCategoria && (
                <button
                  onClick={() => setCreandoCategoria(true)}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  + Nueva categoría
                </button>
              )}
            </div>

            {/* Crear categoría inline */}
            {creandoCategoria ? (
              <div className="border border-indigo-200 bg-indigo-50 rounded-lg p-3 flex flex-col gap-2">
                <p className="text-xs text-indigo-700 font-medium">Nueva categoría</p>
                {errorCategoria && <p className="text-xs text-red-500">{errorCategoria}</p>}
                <input
                  value={nuevaCategoria}
                  onChange={e => setNuevaCategoria(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCrearCategoria()}
                  placeholder="Ej: Comida"
                  autoFocus
                  className="w-full border border-indigo-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setCreandoCategoria(false); setNuevaCategoria(''); setErrorCategoria('') }}
                    className="flex-1 text-xs border border-gray-300 text-gray-600 rounded-lg py-1.5 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCrearCategoria} disabled={guardandoCategoria}
                    className="flex-1 text-xs bg-indigo-600 text-white rounded-lg py-1.5 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {guardandoCategoria ? 'Creando...' : 'Crear y seleccionar'}
                  </button>
                </div>
              </div>
            ) : (
              <select
                name="categoria_id" value={form.categoria_id} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">Sin categoría</option>
                {categorias.length === 0 && (
                  <option disabled>— No hay categorías, creá una —</option>
                )}
                {categorias.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            )}
          </div>

          {/* Cuotas — solo tarjeta crédito */}
          {form.tipo_pago === 'tarjeta_credito' && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Cuotas <span className="text-gray-400 font-normal">(1 = pago único)</span>
              </label>
              <select
                name="cuotas" value={form.cuotas} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {[1,2,3,6,9,12,18,24].map(n => (
                  <option key={n} value={n}>{n === 1 ? 'Pago único' : `${n} cuotas`}</option>
                ))}
              </select>
              {form.cuotas > 1 && form.monto && (
                <p className="text-xs text-indigo-600 mt-1">
                  💳 {form.cuotas} cuotas de ${Math.round(form.monto / form.cuotas).toLocaleString('es-AR')}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit} disabled={cargando}
            className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {cargando ? 'Guardando...' : gasto ? 'Guardar cambios' : 'Crear gasto'}
          </button>
        </div>

      </div>
    </div>
  )
}