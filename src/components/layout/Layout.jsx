import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

/**
 * Main layout wrapper with navigation
 * Person 1's responsibility
 */
export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
