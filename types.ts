export enum MainTab { 
  RKKS = 'RKKS', 
  PENDAPATAN = 'PENDAPATAN',
  BELANJA = 'BELANJA',
  FINANCIAL_HEALTH = 'FINANCIAL_HEALTH'
}
export enum SubTab { 
  PAGU_ANGGARAN = 'PAGU_ANGGARAN',
  RAB = 'RAB',
  RPD = 'RPD',
  REALISASI = 'REALISASI',
  BELANJA_JASA = 'BELANJA_JASA', 
  BELANJA_OPERASIONAL = 'BELANJA_OPERASIONAL', 
  BELANJA_MODAL = 'BELANJA_MODAL',
  BELANJA_PEMELIHARAAN = 'BELANJA_PEMELIHARAAN',
  REKAP_AUDIT = 'REKAP_AUDIT',
  TARGET_PENDAPATAN = 'TARGET_PENDAPATAN',
  REV_DAILY = 'REV_DAILY',
  // [S5.4] Tab 4 sub-tabs
  LAPORAN_LRA = 'LAPORAN_LRA',
  DEVIASI_TINJAUAN = 'DEVIASI_TINJAUAN',
}
export enum TabType { 
  PAGU = 'PAGU', 
  RAB = 'RAB', 
  RPD = 'RPD', 
  REALISASI = 'REALISASI', 
  JASA_BPJS = 'JASA_BPJS', 
  JASA_YANMASUM = 'JASA_YANMASUM', 
  BEKKES = 'BEKKES', 
  REKAP_OPERASIONAL = 'REKAP_OPERASIONAL',
  MODAL_DETAIL = 'MODAL_DETAIL',
  PEMELIHARAAN_DETAIL = 'PEMELIHARAAN_DETAIL',
  REV_DASHBOARD = 'REV_DASHBOARD',
  REV_SPECIALTY = 'REV_SPECIALTY',
  REV_DAILY = 'REV_DAILY',
  FINANCIAL_HEALTH = 'FINANCIAL_HEALTH'
}

export type JasaStatus = 'Verifikasi' | 'Pending' | 'Dispute' | 'Belum Verifikasi' | 'Lunas';
export type KepegawaianStatus = 'PNS' | 'Militer' | 'TKS' | 'PPP3' | 'Mitra';
export type BillCategory = 'JASA' | 'OPERASIONAL' | 'MODAL' | 'PEMELIHARAAN';
export type PatientCategory = 'BPJS_DINAS' | 'BPJS_UMUM' | 'BPJS_PLUS_JR' | 'YANMASUM' | 'JASA_RAHARJA';

export interface ScenarioSettings {
  specPct: number; specCap: number; raberCutPct: number; raberPoolPct: number;
  anestesiPct: number; anestesiCap: number; gpPct: number; gpCap: number;
  paramOKPct: number; paramICUPct: number; paramICUCap: number; paramGenPct: number; paramGenCap: number;
  penataAnestesiPct: number; penataAnestesiCap: number; konsulPct: number; konsulCap: number;
  bhpPct: number; pengelolaPct: number; manajemenPct: number; casemixPct: number;
  bedahSarafFlat: number; bedahSarafJRFlat: number; raberNeuroPct: number;
}

export interface BPJSCalcSettings {
  scenarioA: ScenarioSettings; scenarioB: ScenarioSettings;
  scenarioD: ScenarioSettings; scenarioE: ScenarioSettings; scenarioF: ScenarioSettings;
}

export interface TindakanItem {
  id: string; namaTindakan: string; jasaMedis: number; jasaAnestesi: number;
  jasaGP: number; jasaParamedis: number; jasaBHP: number; jasaRS: number;
}

export interface RevenueTarget {
  id: string; kategori: PatientCategory | 'LAINNYA'; tahun: number;
  targetNominal: number; targetPasien: number; targetRawatInap: number; targetRawatJalan: number;
}

export interface SpecialtyTarget {
  id: string; spesialisasi: string; tahun: number; targetNominal: number;
}

export interface PatientClaim {
  id: string; tanggalInput: string; sep: string; nama: string; nilaiKlaim: number;
  status: JasaStatus; alasan?: string; isBedah: boolean; isICU: boolean;
  isBedahSaraf: boolean; isJasaRaharja: boolean; dpjpUtama: string;
  drAnestesi?: string; drKonsulen?: string; drUmum?: string; timRaber?: string[];
  diagnosa: string; bulan: number; tahun: number; kategoriPasien: PatientCategory;
  itemsTindakan?: TindakanItem[];
}

export interface Employee {
  id: string; nama: string; pendidikan: string; foto?: string; str?: string;
  status: KepegawaianStatus; mulaiDinas: string; wa: string; rekening: string; bank: string;
  pangkat?: string; nrp?: string; roles: string[]; 
  baseHonor?: number; 
  baseTransport?: number; 
}

export interface Doctor extends Employee {
  spesialis: string;
}

export interface MonthlyFeeInput {
  id: string; nama: string; nominal: number; status: 'Sudah Dibayar' | 'Belum Dibayar';
}

export interface ServiceDetailState {
  transportSpesialis: MonthlyFeeInput[]; uangJagaUmum: MonthlyFeeInput[];
  honorTKS: MonthlyFeeInput[]; honorPengelola: MonthlyFeeInput[];
  honorCasemix: MonthlyFeeInput[]; jasaPerawatOK: MonthlyFeeInput[];
  jasaPerawatICU: MonthlyFeeInput[]; jasaPenataAnestesi: MonthlyFeeInput[];
}

export interface BillingItem {
  id: string; akun: string; namaBarang: string; volume: number; satuan: string;
  hargaSatuan: number; diskon: number; ppn: number; pph21: number; pph22: number;
}

export interface ProcurementFile { id: string; namaFile: string; tipe: string; url?: string; size?: string; }

export interface Bill {
  id: string; category: BillCategory; type: 'BEKKES' | 'LAINNYA' | 'JASA_DR' | 'JASA_PEGAWAI' | 'PENGADAAN_MODAL' | 'PEMELIHARAAN';
  namaTagihan: string; noFaktur: string; kegiatan: string; noSprin: string;
  bank: string; noRekening: string; npwp: string; namaRekanan: string; tanggal: string;
  items: BillingItem[]; files: ProcurementFile[]; status: 'Draft' | 'Verifikasi' | 'Lunas';
}

export interface PaguRow {
  id: string; kode: string; description: string; volume: number; satuan: string;
  hargaSatuanAwal: number; hargaSatuanRevisi: number; jumlahBiayaAwal: number;
  jumlahBiayaRevisi: number; sumberDana: string; level: number;
  // Note: realisasi adalah DERIVED dari bucketRegistry.absorptionMap (Sprint A1).
  // Tidak disimpan di PaguRow karena field zombie — selalu 0, tidak pernah dibaca.
}

export interface PaguSection { id: string; title: string; rows: PaguRow[]; }

export interface MinimizedForm {
  id: string;
  type: 'BILL' | 'PATIENT_LOG';
  data: any;
  title: string;
}

export interface JasaVerificationFiles {
  [periodKey: string]: { // periodKey: YYYY-MM
    tks: ProcurementFile[];
    nakes: ProcurementFile[];
    pengelola: ProcurementFile[];
  }
}

// Added missing RAB and RPD interfaces
export interface RABNarrative {
  kementerian: string;
  unitEselon: string;
  program: string;
  sasaranProgram: string;
  indikatorKinerjaProgram: string;
  kegiatan: string;
  sasaranKegiatan: string;
  indikatorKinerjaKegiatan: string;
  kro: string;
  indikatorKRO: string;
  ro: string;
  indikatorRO: string;
  volumeRO: number;
  satuanRO: string;
  komponen: string;
  subKomponen: string;
  indikatorSubKomponen: string;
  volumeSubKomponen: number;
  satuanSubKomponen: string;
}

export interface RABRow {
  id: string;
  kode: string;
  uraian: string;
  volumeSub: string;
  jenisKomponen: string;
  satuan: string;
  jumlahUnits: number;
  hargaSatuanAwal: number;
  hargaSatuanRevisi: number;
  jumlahHargaAwal: number;
  jumlahHargaRevisi: number;
  level: number;
}

export interface RABCategory {
  id: string;
  title: string;
  showNarrative: boolean;
  viewMode: 'SEMULA' | 'REVISI' | 'SEMUA';
  linkedPaguSectionId: string;
  narrative: RABNarrative;
  items: RABRow[];
}

export interface RPDRow {
  id: string;
  kode: string;
  description: string;
  totalBudget: number;
  totalBudgetRevisi: number;
  level: number;
  monthly: {
    m1: number; m2: number; m3: number; m4: number; m5: number; m6: number;
    m7: number; m8: number; m9: number; m10: number; m11: number; m12: number;
  };
}

export interface RPDSection {
  id: string;
  title: string;
  linkedSectionId: string;
  rows: RPDRow[];
}
