import { create } from 'zustand';

// Definisikan tipe data state
export type PesertaState = {
  nama_lengkap: string;
  foto_file: File | null;
  status: 'Menunggu Foto' | 'Foto Cocok' | 'Error';
}
export type PendampingState = {
  nama_lengkap: string;
}

// Definisikan tipe data untuk seluruh toko state kita
type RegistrationState = {
  // Data dari form
  namaPembina: string;
  namaSekolah: string;
  nomorWhatsapp: string;
  kategori: 'Wira' | 'Madya';
  // Data dari Excel
  pesertaList: PesertaState[];
  pendampingList: PendampingState[];
  // Data Tenda & Lahan (BARU)
  lahanDipilihId: number | null;

  // Fungsi untuk mengatur state
  setData: (data: Partial<Omit<RegistrationState, 'setData' | 'reset'>>) => void;
  reset: () => void;
}

// Buat store Zustand
export const useRegistrationStore = create<RegistrationState>((set) => ({
  namaPembina: '',
  namaSekolah: '',
  nomorWhatsapp: '',
  kategori: 'Madya',
  pesertaList: [],
  pendampingList: [],
  lahanDipilihId: null, // Nilai awal
  setData: (data) => set((state) => ({ ...state, ...data })),
  reset: () => set({ 
    namaPembina: '',
    namaSekolah: '',
    nomorWhatsapp: '',
    kategori: 'Madya',
    pesertaList: [],
    pendampingList: [],
    lahanDipilihId: null, // Reset juga
  }),
}));