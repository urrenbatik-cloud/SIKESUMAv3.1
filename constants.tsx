
import { PaguSection, PatientClaim, Doctor, Employee, RABNarrative, Bill, PatientCategory, BPJSCalcSettings, ScenarioSettings, RevenueTarget, SpecialtyTarget, RABCategory } from './types';

export const YEARS = Array.from({ length: 10 }, (_, i) => 2024 + i);
export const HONOR_PER_TKS = 3000000; 

// SETTINGS SKENARIO (Sesuai Kebijakan RS Batin Tikal)
const SCENARIO_1: ScenarioSettings = {
  specPct: 20, specCap: 0, raberCutPct: 35, raberPoolPct: 50,
  anestesiPct: 6.4, anestesiCap: 0, gpPct: 1.6, gpCap: 0,
  paramOKPct: 4, paramICUPct: 0, paramICUCap: 0, paramGenPct: 4, paramGenCap: 0,
  penataAnestesiPct: 1, penataAnestesiCap: 0, konsulPct: 1, konsulCap: 0,
  bhpPct: 35, pengelolaPct: 3, manajemenPct: 1, casemixPct: 1,
  bedahSarafFlat: 0, bedahSarafJRFlat: 0, raberNeuroPct: 0
};

const SCENARIO_2: ScenarioSettings = {
  specPct: 10, specCap: 8000000, raberCutPct: 35, raberPoolPct: 50,
  anestesiPct: 6, anestesiCap: 1800000, gpPct: 2, gpCap: 500000,
  paramOKPct: 2, paramICUPct: 3, paramICUCap: 1200000, paramGenPct: 5, paramGenCap: 0,
  penataAnestesiPct: 2, penataAnestesiCap: 700000, konsulPct: 1, konsulCap: 300000,
  bhpPct: 35, pengelolaPct: 3, manajemenPct: 1, casemixPct: 1,
  bedahSarafFlat: 6000000, bedahSarafJRFlat: 9000000, raberNeuroPct: 5
};

const SCENARIO_4: ScenarioSettings = {
  specPct: 15, specCap: 0, raberCutPct: 35, raberPoolPct: 50,
  anestesiPct: 0, anestesiCap: 0, gpPct: 3.5, gpCap: 0,
  paramOKPct: 0, paramICUPct: 0, paramICUCap: 0, paramGenPct: 18, paramGenCap: 0,
  penataAnestesiPct: 0, penataAnestesiCap: 0, konsulPct: 0, konsulCap: 0,
  bhpPct: 0, pengelolaPct: 3, manajemenPct: 1, casemixPct: 1,
  bedahSarafFlat: 0, bedahSarafJRFlat: 0, raberNeuroPct: 0
};

const SCENARIO_5: ScenarioSettings = {
  specPct: 5, specCap: 2000000, raberCutPct: 0, raberPoolPct: 0,
  anestesiPct: 10, anestesiCap: 1800000, gpPct: 2, gpCap: 400000,
  paramOKPct: 0, paramICUPct: 5, paramICUCap: 1500000, paramGenPct: 5, paramGenCap: 1500000,
  penataAnestesiPct: 0, penataAnestesiCap: 0, konsulPct: 5, konsulCap: 0,
  bhpPct: 35, pengelolaPct: 3, manajemenPct: 1, casemixPct: 1,
  bedahSarafFlat: 6000000, bedahSarafJRFlat: 9000000, raberNeuroPct: 5
};

const SCENARIO_6: ScenarioSettings = {
  specPct: 5, specCap: 0, raberCutPct: 0, raberPoolPct: 0,
  anestesiPct: 10, anestesiCap: 0, gpPct: 3, gpCap: 0,
  paramOKPct: 0, paramICUPct: 8, paramICUCap: 0, paramGenPct: 10, paramGenCap: 0,
  penataAnestesiPct: 0, penataAnestesiCap: 0, konsulPct: 5, konsulCap: 0,
  bhpPct: 0, pengelolaPct: 3, manajemenPct: 1, casemixPct: 1,
  bedahSarafFlat: 0, bedahSarafJRFlat: 0, raberNeuroPct: 0
};

export const DEFAULT_BPJS_SETTINGS: BPJSCalcSettings = {
  scenarioA: SCENARIO_1,
  scenarioB: SCENARIO_2,
  scenarioD: SCENARIO_4,
  scenarioE: SCENARIO_5,
  scenarioF: SCENARIO_6
};

// DATA DOKTER
export const DUMMY_DOCTORS: Doctor[] = [
  { id: 'dr-1', nama: 'dr. Ahmad, Sp.B', spesialis: 'Bedah', status: 'Militer', pangkat: 'Mayor Ckm', nrp: '110001', pendidikan: 'Spesialis Bedah', mulaiDinas: '2015-01-01', wa: '0812', rekening: '1001', bank: 'BNI', roles: ['Spesialis'], baseTransport: 3000000 },
  { id: 'dr-2', nama: 'dr. Budi, Sp.An', spesialis: 'Anestesi', status: 'PNS', pangkat: 'IV/a', nrp: '1980', pendidikan: 'Spesialis Anestesi', mulaiDinas: '2018-05-10', wa: '0812', rekening: '2002', bank: 'BRI', roles: ['Spesialis'], baseTransport: 2500000 },
];

// DATA PEGAWAI
export const DUMMY_EMPLOYEES: Employee[] = [
  { id: 'emp-1', nama: 'Ners Roni', pendidikan: 'S.Kep Ners', status: 'TKS', mulaiDinas: '2021-01-01', wa: '08', rekening: '7001', bank: 'BNI', roles: ['Perawat OK'], baseHonor: 3500000 },
  { id: 'emp-5', nama: 'Putri, S.Kom', pendidikan: 'S1 IT', status: 'TKS', mulaiDinas: '2021-05-01', wa: '08', rekening: '7005', bank: 'Mandiri', roles: ['Casemix'], baseHonor: 3200000 },
];

// DATA PASIEN
export const DUMMY_PATIENTS: PatientClaim[] = [
  { id: 'p-1', tanggalInput: '2025-01-05', sep: '123456789/JAN/01', nama: 'Tn. Syamsul', nilaiKlaim: 45000000, status: 'Verifikasi', isBedah: true, isICU: true, isBedahSaraf: true, isJasaRaharja: false, dpjpUtama: 'dr. Ahmad, Sp.B', drAnestesi: 'dr. Budi, Sp.An', diagnosa: 'SDH Kronik + Kraniotomi', bulan: 1, tahun: 2025, kategoriPasien: 'BPJS_UMUM' },
];

// DATA TAGIHAN OPERASIONAL (DUMMY DENGAN ANAK KODE)
export const DUMMY_BILLS: Bill[] = [
  { id: 'b-1', category: 'OPERASIONAL', type: 'BEKKES', namaTagihan: 'Pengadaan Obat Rutin', noFaktur: 'INV/OBAT/001', kegiatan: 'Dukungan Yanmed', noSprin: 'SPRIN/01/I/2025', bank: 'Mandiri', noRekening: '12345', npwp: '01.234', namaRekanan: 'PT. Kimia Farma', tanggal: '2025-01-20', status: 'Lunas', files: [], items: [{ id: 'i-1', akun: '521811.01', namaBarang: 'Paracetamol Infus', volume: 500, satuan: 'Flsh', hargaSatuan: 45000, diskon: 0, ppn: 2475000, pph21: 0, pph22: 337500 }] },
];

// INITIAL PAGU SECTIONS - DENGAN STRUKTUR ANAK KODE (SUB-AKUN)
export const INITIAL_PAGU_SECTIONS: PaguSection[] = [
  {
    id: 'sec-jasa',
    title: 'PAGU ANGGARAN JASA (HONOR OPERASIONAL SATKER)',
    rows: [
      { id: 'h1', kode: '521115.01', description: 'Honor Tenaga Lepas (TKS)', volume: 1, satuan: 'Thn', hargaSatuanAwal: 1200000000, hargaSatuanRevisi: 1200000000, jumlahBiayaAwal: 1200000000, jumlahBiayaRevisi: 1200000000, sumberDana: 'RM', level: 0 },
      { id: 'h2', kode: '521115.02', description: 'Honor Tenaga Kesehatan', volume: 1, satuan: 'Thn', hargaSatuanAwal: 1500000000, hargaSatuanRevisi: 1500000000, jumlahBiayaAwal: 1500000000, jumlahBiayaRevisi: 1500000000, sumberDana: 'RM', level: 0 },
      { id: 'h3', kode: '521115.03', description: 'Honor Pengelola', volume: 1, satuan: 'Thn', hargaSatuanAwal: 300000000, hargaSatuanRevisi: 300000000, jumlahBiayaAwal: 300000000, jumlahBiayaRevisi: 300000000, sumberDana: 'RM', level: 0 },
    ]
  },
  {
    id: 'sec-ops',
    title: 'PAGU ANGGARAN BELANJA OPERASIONAL',
    rows: [
      { id: 'o1', kode: '521111.01', description: 'Belanja Keperluan Perkantoran (ATK)', volume: 1, satuan: 'Thn', hargaSatuanAwal: 200000000, hargaSatuanRevisi: 200000000, jumlahBiayaAwal: 200000000, jumlahBiayaRevisi: 200000000, sumberDana: 'RM', level: 0 },
      { id: 'o2', kode: '521111.02', description: 'Belanja Daya dan Jasa (Listrik/Air)', volume: 1, satuan: 'Thn', hargaSatuanAwal: 300000000, hargaSatuanRevisi: 350000000, jumlahBiayaAwal: 300000000, jumlahBiayaRevisi: 350000000, sumberDana: 'RM', level: 0 },
      { id: 'o3', kode: '521811.01', description: 'Belanja Obat-obatan (Bekkes)', volume: 1, satuan: 'Thn', hargaSatuanAwal: 5000000000, hargaSatuanRevisi: 5000000000, jumlahBiayaAwal: 5000000000, jumlahBiayaRevisi: 5000000000, sumberDana: 'PNBP', level: 0 },
      { id: 'o4', kode: '521811.02', description: 'Belanja BMHP (Disposable)', volume: 1, satuan: 'Thn', hargaSatuanAwal: 3000000000, hargaSatuanRevisi: 3000000000, jumlahBiayaAwal: 3000000000, jumlahBiayaRevisi: 3000000000, sumberDana: 'PNBP', level: 0 },
    ]
  },
  {
    id: 'sec-modal',
    title: 'PAGU ANGGARAN BELANJA MODAL',
    rows: [
      { id: 'm1', kode: '532111.01', description: 'Modal Alat Kedokteran Umum', volume: 1, satuan: 'Thn', hargaSatuanAwal: 1500000000, hargaSatuanRevisi: 1500000000, jumlahBiayaAwal: 1500000000, jumlahBiayaRevisi: 1500000000, sumberDana: 'RM', level: 0 },
      { id: 'm2', kode: '532111.02', description: 'Modal Alat Kedokteran Spesialis', volume: 1, satuan: 'Thn', hargaSatuanAwal: 1000000000, hargaSatuanRevisi: 1000000000, jumlahBiayaAwal: 1000000000, jumlahBiayaRevisi: 1000000000, sumberDana: 'RM', level: 0 },
    ]
  },
  {
    id: 'sec-pemeliharaan',
    title: 'PAGU ANGGARAN BELANJA PEMELIHARAAN',
    rows: [
      { id: 'p1', kode: '523111.01', description: 'Pemeliharaan Gedung Kantor', volume: 1, satuan: 'Thn', hargaSatuanAwal: 200000000, hargaSatuanRevisi: 200000000, jumlahBiayaAwal: 200000000, jumlahBiayaRevisi: 200000000, sumberDana: 'RM', level: 0 },
      { id: 'p2', kode: '523111.02', description: 'Pemeliharaan Gedung Rawat Inap', volume: 1, satuan: 'Thn', hargaSatuanAwal: 200000000, hargaSatuanRevisi: 200000000, jumlahBiayaAwal: 200000000, jumlahBiayaRevisi: 200000000, sumberDana: 'RM', level: 0 },
      { id: 'p3', kode: '523121.01', description: 'Pemeliharaan Alkes Intensif', volume: 1, satuan: 'Thn', hargaSatuanAwal: 200000000, hargaSatuanRevisi: 200000000, jumlahBiayaAwal: 200000000, jumlahBiayaRevisi: 200000000, sumberDana: 'RM', level: 0 },
      { id: 'p4', kode: '523121.02', description: 'Pemeliharaan Ambulans / Kendaraan', volume: 1, satuan: 'Thn', hargaSatuanAwal: 100000000, hargaSatuanRevisi: 100000000, jumlahBiayaAwal: 100000000, jumlahBiayaRevisi: 100000000, sumberDana: 'RM', level: 0 },
    ]
  }
];

export const INITIAL_RAB_NARRATIVE: RABNarrative = {
  kementerian: 'Kemhan RI',
  unitEselon: 'Markas Besar TNI AD/Rumah Sakit Tk.IV 02.07.03 Batin Tikal',
  program: 'Program Profesionalisme dan Kesejahteraan Prajurit',
  sasaranProgram: 'Terwujudnya organisasi TNI AD yang profesional dalam rangka pelaksanaan tugas pokok',
  indikatorKinerjaProgram: 'Persentase Satker TNI yang dalam pelaksanaan tupoksi telah menerapkan standar operasional prosedur (SOP)',
  kegiatan: 'Penyelenggaraan Kesehatan matra darat',
  sasaranKegiatan: 'Terwujudnya Keluarga Prajurit dan PNS TNI AD, yang memiliki derajat kesehatan baik',
  indikatorKinerjaKegiatan: 'Persentase Prajurit dan PNS TNI AD beserta anggota keluarganya, yang mendapat pelayanan kesehatan sesuai standar mutu',
  kro: 'Sarana Bidang Kesehatan',
  indikatorKRO: 'Jumlah sarana bidang kesehatan yang diadakan',
  ro: 'Pengadaan Alsatri PNBP dan BLU',
  indikatorRO: 'Persentase Alsatri PNBP and BLU',
  volumeRO: 1,
  satuanRO: 'Layanan',
  komponen: 'Pelaksanaan Pengadaan Alkes PNBP dan BLU Pertahanan dan Keamanan',
  subKomponen: 'Belanja Dukungan Pengadaan Alsatri',
  indikatorSubKomponen: 'Persentase Layanan Dukungan Pengadaan Alkes yang dilaksanakan tepat waktu',
  volumeSubKomponen: 1,
  satuanSubKomponen: 'Tahun'
};

export const INITIAL_RAB_CATEGORIES: RABCategory[] = INITIAL_PAGU_SECTIONS.map(p => ({
  id: `rab-${p.id}`,
  title: p.title,
  showNarrative: false,
  viewMode: 'SEMUA',
  linkedPaguSectionId: p.id,
  narrative: { ...INITIAL_RAB_NARRATIVE },
  items: p.rows.map(r => ({
    id: `rab-row-${r.id}`,
    kode: r.kode,
    uraian: r.description,
    // Fix: Convert volume (number) to string to satisfy RABRow interface
    volumeSub: String(r.volume),
    jenisKomponen: 'Utama',
    satuan: r.satuan,
    jumlahUnits: 1,
    hargaSatuanAwal: r.hargaSatuanAwal,
    hargaSatuanRevisi: r.hargaSatuanRevisi,
    jumlahHargaAwal: r.jumlahBiayaAwal,
    jumlahHargaRevisi: r.jumlahBiayaRevisi,
    level: r.level
  }))
}));

export const DUMMY_REVENUE_TARGETS: RevenueTarget[] = [
  { id: 'rt1', kategori: 'BPJS_DINAS', tahun: 2025, targetNominal: 12000000000, targetPasien: 5000, targetRawatInap: 1000, targetRawatJalan: 4000 },
  { id: 'rt2', kategori: 'BPJS_UMUM', tahun: 2025, targetNominal: 45000000000, targetPasien: 15000, targetRawatInap: 3000, targetRawatJalan: 12000 },
];

export const DUMMY_SPECIALTY_TARGETS: SpecialtyTarget[] = [
  { id: 'st1', spesialisasi: 'Bedah', tahun: 2025, targetNominal: 15000000000 },
];
