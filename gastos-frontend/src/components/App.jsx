import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'
import Gastos from '../pages/Gastos'

export default function App() {
  return (
    <BrowserRouter>
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex gap-6">
          <span className="font-bold text-indigo-600">💰 Mis Gastos</span>
          <NavLink
            to="/"
            className={({ isActive }) =>
              `text-sm ${isActive ? 'text-indigo-600 font-semibold' : 'text-gray-500 hover:text-gray-800'}`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/gastos"
            className={({ isActive }) =>
              `text-sm ${isActive ? 'text-indigo-600 font-semibold' : 'text-gray-500 hover:text-gray-800'}`
            }
          >
            Gastos
          </NavLink>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/gastos" element={<Gastos />} />
      </Routes>
    </BrowserRouter>
  )
}