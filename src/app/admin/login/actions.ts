'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function login(password: string) {
  // Bandingkan password yang dimasukkan dengan yang ada di .env
  if (password === process.env.ADMIN_PASSWORD) {
    // Jika cocok, buat cookie sebagai "tiket masuk"
    (await
      // Jika cocok, buat cookie sebagai "tiket masuk"
      cookies()).set('admin_auth', 'true', {
      httpOnly: true, // Cookie tidak bisa diakses dari JavaScript di browser
      secure: process.env.NODE_ENV === 'production', // Hanya kirim via HTTPS di produksi
      path: '/admin', // Cookie hanya berlaku untuk path /admin
      maxAge: 60 * 60 * 24 // Berlaku selama 24 jam
    })
    // Arahkan ke dashboard utama
    redirect('/admin')
  }

  // Jika tidak cocok, kembalikan pesan error
  return 'Kata sandi salah.'
}