import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import React from 'react'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Cek apakah cookie otentikasi ada dan valid
  const cookieStore = cookies()
  const isAuthenticated = (await cookieStore).get('admin_auth')?.value === 'true'

  // Jika tidak terotentikasi, lempar kembali ke halaman login
  if (!isAuthenticated) {
    redirect('/admin/login')
  }

  // Jika terotentikasi, tampilkan halaman yang diminta
  return <>{children}</>
}