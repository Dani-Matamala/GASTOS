const BASE = '/api'

// Resumen
export async function getResumen(desde, hasta) {
  const params = new URLSearchParams()
  if (desde) params.append('desde', desde)
  if (hasta) params.append('hasta', hasta)
  const res = await fetch(`${BASE}/resumen?${params}`)
  return res.json()
}

// Cuotas
export async function getCuotasPendientes() {
  const res = await fetch(`${BASE}/cuotas/pendientes`)
  return res.json()
}

export async function getCuotasMes(mes) {
  const res = await fetch(`${BASE}/cuotas/mes/${mes}`)
  return res.json()
}

// Categorías
export async function getCategorias() {
  const res = await fetch(`${BASE}/categorias`)
  return res.json()
}

// Gastos
export async function getGastos(filtros = {}) {
  const params = new URLSearchParams()
  Object.entries(filtros).forEach(([k, v]) => { if (v) params.append(k, v) })
  const res = await fetch(`${BASE}/gastos?${params}`)
  return res.json()
}

export async function crearGasto(data) {
  const res = await fetch(`${BASE}/gastos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return res.json()
}

export async function editarGasto(id, data) {
  const res = await fetch(`${BASE}/gastos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return res.json()
}

export async function eliminarGasto(id) {
  const res = await fetch(`${BASE}/gastos/${id}`, { method: 'DELETE' })
  return res.json()
}



export async function crearCategoria(data) {
  const res = await fetch(`${BASE}/categorias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return res.json()
}

export async function editarCategoria(id, data) {
  const res = await fetch(`${BASE}/categorias/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return res.json()
}

export async function eliminarCategoria(id) {
  const res = await fetch(`${BASE}/categorias/${id}`, { method: 'DELETE' })
  return res.json()
}