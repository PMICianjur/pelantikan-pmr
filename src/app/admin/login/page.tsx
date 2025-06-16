'use client'

import { useState } from 'react'
import { login } from './actions'
import { KeyRound, LogIn } from 'lucide-react'
import Image from 'next/image' // <-- 1. Import komponen Image

export default function AdminLoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(event.currentTarget)
    const password = formData.get('password') as string
    
    const errorMessage = await login(password)
    
    if (errorMessage) {
      setError(errorMessage)
    }
    setLoading(false)
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-zinc-100">
      <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          {/* 2. Ganti tag <img> dengan komponen <Image> */}
          <Image
            src="/logo-pmi.png"
            alt="Logo PMI"
            width={96} // Lebar asli atau yang sesuai (w-24 -> 96px)
            height={96} // Tinggi asli atau yang sesuai (h-24 -> 96px)
            className="mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-zinc-900">Admin Login</h1>
          <p className="text-zinc-500">Masukkan kata sandi untuk melanjutkan</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Kata Sandi"
                className="w-full p-3 pl-10 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {error && <p className="text-sm text-center text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex justify-center items-center gap-2 bg-zinc-900 text-white p-3 rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:bg-zinc-400"
          >
            {loading ? 'Memeriksa...' : 'Masuk'}
            {!loading && <LogIn size={18} />}
          </button>
        </form>
      </div>
    </div>
  )
}