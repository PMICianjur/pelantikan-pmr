import { create } from 'zustand';

// Definisikan tipe data state
type PesertaState = {
  nama_lengkap: string;
  foto_file: File | null;
  status: 'Menunggu Foto' | 'Foto Cocok' | 'Error';
}
type PendampingState = {
  nama_lengkap: string;
}

// Definisikan tipe data untuk seluruh toko state kita
type RegistrationState = {
  // Data dari form
  namaPembina: string;
  namaSekolah: string;
  nomorWhatsapp: string;
  kategori: string;
  // Data dari Excel
  pesertaList: PesertaState[];
  pendampingList: PendampingState[];
  // Fungsi untuk mengatur state
  setData: (data: Partial<RegistrationState>) => void;
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
  setData: (data) => set((state) => ({ ...state, ...data })),
  reset: () => set({ 
    namaPembina: '',
    namaSekolah: '',
    nomorWhatsapp: '',
    kategori: 'Madya',
    pesertaList: [],
    pendampingList: []
  }),
}));