'use client'

import { useState } from 'react'
import { approvePayment, revertToWaiting } from './actions' 
import { Check, X, Eye, Loader2, Clock } from 'lucide-react'

type Props = {
  pendaftaranId: number
  buktiUrl: string | null
  nomorWhatsapp: string | null
  namaSekolah: string | null
  status: string | null
}

export default function AksiPembayaranButtons({ pendaftaranId, buktiUrl, nomorWhatsapp, namaSekolah, status }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const openWhatsApp = () => {
    if (!nomorWhatsapp) {
        alert('Nomor WhatsApp tidak ditemukan untuk pendaftar ini.');
        return;
    }
    
    let formattedNumber = nomorWhatsapp.startsWith('0') 
        ? '62' + nomorWhatsapp.substring(1) 
        : nomorWhatsapp;
    formattedNumber = formattedNumber.replace(/[\s-]/g, '');

    const message = `Assalamualaikum. Dengan hormat, dari panitia Pelantikan PMR Kab. Cianjur. Kami ingin mengonfirmasi pendaftaran dari *${namaSekolah}*. Mohon maaf, ada kendala pada bukti pembayaran yang Anda kirimkan. Mohon dapat mengirimkan ulang bukti yang valid atau hubungi kami untuk informasi lebih lanjut. Terima kasih.`;
    const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  const handleApprove = async () => {
    if (confirm('Apakah Anda yakin ingin MENYETUJUI pembayaran ini? Status akan diubah menjadi LUNAS.')) {
      setLoading(true)
      setError('')
      const result = await approvePayment(pendaftaranId)
      if (!result.success) {
        setError(result.message)
      }
      setLoading(false)
    }
  }

  const handleReject = () => {
    if (confirm('Anda akan diarahkan ke WhatsApp untuk memberitahu pendaftar. Status pendaftaran TIDAK akan diubah. Lanjutkan?')) {
      openWhatsApp();
    }
  }

  const handleRevert = async () => {
    if (confirm('Apakah Anda yakin ingin mengubah status kembali menjadi "Menunggu Konfirmasi"?')) {
      setLoading(true);
      setError('');
      const result = await revertToWaiting(pendaftaranId);
      if (!result.success) {
        setError(result.message);
      }
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-start items-center p-1 w-28">
        <Loader2 size={16} className="animate-spin text-slate-500" />
      </div>
    )
  }

  // Tampilkan tombol berdasarkan status pendaftaran
  if (status === 'WAITING_CONFIRMATION') {
    return (
      <div className="flex items-center gap-2">
        <a href={buktiUrl || '#'} target="_blank" rel="noopener noreferrer" title="Lihat Bukti Pembayaran" className="inline-flex items-center bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed" onClick={(e) => { if (!buktiUrl) e.preventDefault(); }} aria-disabled={!buktiUrl}>
            <Eye size={14} />
        </a>
        <button onClick={handleApprove} title="Setujui Pembayaran" className="inline-flex items-center bg-green-500 text-white p-2 rounded-md hover:bg-green-600 font-semibold transition">
            <Check size={14} />
        </button>
        <button onClick={handleReject} title="Tolak & Konfirmasi via WhatsApp" className="inline-flex items-center bg-orange-500 text-white p-2 rounded-md hover:bg-orange-600 font-semibold transition">
            <X size={14} />
        </button>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    )
  }

  if (status === 'PAID') {
    return (
      <button onClick={handleRevert} title="Ubah status ke Menunggu Konfirmasi" className="inline-flex items-center gap-2 bg-yellow-500 text-white px-2 py-1 rounded-md hover:bg-yellow-600 text-xs font-semibold transition">
        <Clock size={12} />
        Ubah ke Menunggu
      </button>
    )
  }

  return <span className="text-xs text-slate-400">-</span>;
}