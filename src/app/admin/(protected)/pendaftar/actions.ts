'use server'

import { supabase } from '@/lib/supabaseClient'
import { revalidatePath } from 'next/cache'

export async function approvePayment(pendaftaranId: number) {
  try {
    const { error } = await supabase
      .from('pendaftaran')
      .update({ status: 'PAID' })
      .eq('id', pendaftaranId)

    if (error) {
      throw new Error(`Gagal menyetujui pembayaran: ${error.message}`);
    }

    revalidatePath('/admin/pendaftar')
    return { success: true, message: 'Pembayaran berhasil disetujui.' }
  } catch (e) { // <-- Perbaikan dari 'any'
    if (e instanceof Error) {
        return { success: false, message: e.message }
    }
    return { success: false, message: 'Terjadi kesalahan yang tidak diketahui.' }
  }
}

export async function revertToWaiting(pendaftaranId: number) {
  try {
    const { error } = await supabase
      .from('pendaftaran')
      .update({ status: 'WAITING_CONFIRMATION' })
      .eq('id', pendaftaranId)

    if (error) {
        throw new Error(`Gagal mengembalikan status: ${error.message}`);
    }

    revalidatePath('/admin/pendaftar')
    return { success: true, message: 'Status berhasil dikembalikan ke Menunggu Konfirmasi.' }
  } catch (e) { // <-- Perbaikan dari 'any'
    if (e instanceof Error) {
        return { success: false, message: e.message }
    }
    return { success: false, message: 'Terjadi kesalahan yang tidak diketahui.' }
  }
}