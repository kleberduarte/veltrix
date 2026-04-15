'use client'
import { getAuth } from '@/lib/auth'

export default function Header({ title }: { title: string }) {
  const user = getAuth()
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      {user && (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="text-sm">
            <p className="font-medium text-gray-800">{user.name}</p>
            <p className="text-gray-500">{user.companyName}</p>
          </div>
        </div>
      )}
    </header>
  )
}
