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
  VALIDASI = 'VALIDASI',
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
  VALIDASI = 'VALIDASI',
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

/** [Sprint C.5] Bill state machine status.
 *  Valid transitions (lihat utils/billStateMachine.ts):
 *    Draft → Verifikasi (via klik 'Verifikasi' button, butuh items.length > 0 & akun valid)
 *    Verifikasi → Lunas (via klik 'Tandai Lunas', butuh tanggal pembayaran)
 *    Verifikasi → Draft (via klik 'Batal verifikasi' — kembali edit)
 *    Lunas → terminal (tidak boleh balik kecuali via admin override yang di-audit)
 */
export type BillStatus = 'Draft' | 'Verifikasi' | 'Lunas';

export interface Bill {
  id: string; category: BillCategory; type: 'BEKKES' | 'LAINNYA' | 'JASA_DR' | 'JASA_PEGAWAI' | 'PENGADAAN_MODAL' | 'PEMELIHARAAN';
  namaTagihan: string; noFaktur: string; kegiatan: string; noSprin: string;
  bank: string; noRekening: string; npwp: string; namaRekanan: string; tanggal: string;
  items: BillingItem[]; files: ProcurementFile[];
  status: BillStatus;
  /** [Sprint C.5] Audit trail untuk N1 enforcement (state transition history).
   *  Setiap transisi push entry. Tidak required (legacy bills tidak punya). */
  statusLog?: { from: BillStatus | null; to: BillStatus; at: string; by?: string; reason?: string }[];
}

export interface PaguRow {
  id: string;
  kode: string;          // SIKESUMA-internal code, mis. '521115.01' (boleh suffix sub-akun)
  kode_bas?: string;     // [Sprint B.2] Canonical 6-digit BAS code (mis. '521115').
                         // Optional saat ini; akan jadi required setelah backfill HITL approved by Angga.
                         // Sumber: utils/basDictionary.ts (KEP-331/2021 + KEP-291/2022).
  description: string;
  volume: number;
  satuan: string;
  hargaSatuanAwal: number;
  hargaSatuanRevisi: number;
  jumlahBiayaAwal: number;
  jumlahBiayaRevisi: number;
  sumberDana: string;
  level: number;
  // Note: realisasi adalah DERIVED dari bucketRegistry.absorptionMap (Sprint A1).
  // Tidak disimpan di PaguRow karena field zombie — selalu 0, tidak pernah dibaca.

  // ────────────────────────────────────────────────────────────────────────
  // [Tier 3] Metadata BAS untuk validasi 12 hard constraints Revisi POK
  // ────────────────────────────────────────────────────────────────────────
  // Per Perdirjen Renhan Kemhan 7/2025 Pasal 22 + Lampiran I Bagian 5.
  // Seed values dari RKKS 2025 (vKoreksi v3 §12.2):
  //   Program 012.01.AC, Kegiatan 6507, Sub-Komp F (RS Batin Tikal),
  //   KROs aktif: CAB (Sarana), CCB (OM Sarana), EBA (Layanan Dukungan),
  //   ROs: 1, 4, 5, 962.
  // Field-field di bawah ENVELOPE JSONB-native (lihat SSOT §0.7.5 AP-8) —
  // tidak butuh DDL, langsung persist via App.tsx upsert pagu_sections.
  // Filled via utils/metadataRecommender.ts pattern matching + manual edit
  // oleh Sie Renbang via UI PaguAnggaran.tsx (NO auto-fill, Konteks 4 dr Ferry).
  kro_code?: string;           // mis. "EBA", "CAB", "CCB" (3 huruf)
  kro_name?: string;           // mis. "Layanan Dukungan Manajemen Internal"
  kegiatan_code?: string;      // mis. "6507"
  kegiatan_name?: string;      // mis. "Penyelenggaraan Kesehatan Matra Darat"
  ro_code?: string;            // mis. "962" (Layanan Umum), "1" (Pengadaan Alkes),
                               //      "4" (Pemeliharaan Gedung), "5" (Pengadaan Alsintor).
                               //      Per RKKS 2025 §12.2 mapping: 521xxx/522xxx/524xxx → RO 962,
                               //      523111 → RO 4, 532111.A → RO 5, 532111.B → RO 1.
                               //      (Note: ro_name belum ada — pattern code+name pair konsisten
                               //       untuk kro_*/kegiatan_*/komponen_*, RO khusus hanya code per
                               //       owner spec. Add ro_name if descriptive lookup diperlukan.)
  komponen_code?: string;      // mis. "3" (Dukungan Operasional Hankam), "52" (Pengadaan)
  komponen_name?: string;      // mis. "Dukungan Operasional Pertahanan dan Keamanan"
  volume_ro?: number;          // volume RO dari DIPA Petikan (untuk C5 validation)
  satuan_ro?: string;          // satuan RO mis. "Layanan", "Unit", "Tahun" (untuk C5)
  sumber_dana_kode?:           // canonical kode sumber dana per BAS (untuk C7 validation)
    | 'RM'                     // Rupiah Murni (APBN)
    | 'PNBP'                   // Penerimaan Negara Bukan Pajak (BPJS, YANMASUM)
    | 'PHLN'                   // Pinjaman/Hibah Luar Negeri
    | 'PLN'                    // Pinjaman Luar Negeri (Perdirjen Renhan Pasal 1.24)
    | 'PDN'                    // Pinjaman Dalam Negeri (Pasal 1.25)
    | 'SBSN'                   // Surat Berharga Syariah Negara (Pasal 1.27)
    | 'HIBAH'                  // Hibah (Pasal 1.26)
    | string;                  // escape hatch — tapi prefer canonical literal

  // ────────────────────────────────────────────────────────────────────────
  // [Tier 3] Manual Review Override (per Owner direction 11 Mei 2026)
  // ────────────────────────────────────────────────────────────────────────
  // Untuk row yang recommender return MEDIUM/LOW confidence tapi Angga
  // sudah review manual dan confirm mapping benar — set field ini untuk
  // **override confidence ke HIGH**. Affects Tier 4 validation logic.
  //
  // UI (Phase 3) WAJIB tampilkan warning modal sebelum set:
  // > "Marking this row as manually reviewed will override recommendation
  // >  confidence to HIGH for all metadata fields. This affects Tier 4
  // >  validation. Confirm only after verifying KRO/RO/Komponen/Sumber Dana."
  //
  // Recommender behavior: jika row.metadata_review is set, all confidence
  // levels di output dipaksa = 'high' (lihat utils/metadataRecommender.ts).
  metadata_review?: {
    reviewed_at: string;       // ISO 8601 timestamp (when override was set)
    reviewed_by?: string;      // optional user identifier ("Angga", "Sie Renbang RS")
    override_to: 'high';       // confidence level forced (only 'high' supported v1)
    note?: string;             // optional reasoning ("verified vs DIPA Petikan", etc.)
  };
}

export interface PaguSection {
  id: string;
  tahun: number;     // [Sprint A3] Tahun anggaran — eksplisit, tidak lagi parsing dari ID
  title: string;
  rows: PaguRow[];
}

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
  level: number;
  // [Sprint A2] totalBudget & totalBudgetRevisi DIHAPUS — di-derive dari Pagu
  // via utils/paguLookup.ts. RPD hanya menyimpan distribusi monthly.
  monthly: {
    m1: number; m2: number; m3: number; m4: number; m5: number; m6: number;
    m7: number; m8: number; m9: number; m10: number; m11: number; m12: number;
  };
}

export interface RPDSection {
  id: string;
  title: string;
  /** [Sprint B.5] Renamed from linkedSectionId untuk konsistensi dengan
   *  RABCategory.linkedPaguSectionId. FK ke PaguSection.id. */
  linkedPaguSectionId: string;
  rows: RPDRow[];
}

// ============================================================================
// Tier 5 — Audit Trail + State Machine (Phase 2.1)
// ============================================================================
// Ref: docs/TIER-5-DESIGN.md §3 schema + §4 state machine, Owner-approved
//      R1c hybrid (columned status/tahun/jenis + JSONB data), R2b full snapshot,
//      R6+ manual override, R7c snapshot immutability.
// DB live: 3 tabel di Supabase (Phase 1.5 EXECUTED 12 Mei 2026, SSOT §0.12.7)
// ============================================================================

/**
 * State machine status untuk usulan revisi POK.
 * Normal flow: draft → direkomendasi → diteruskan → ditetapkan → berlaku_efektif
 * Reject branch: any → ditolak (kecuali berlaku_efektif → ditolak via R6+ override)
 */
export type UsulanStatus =
  | 'draft'
  | 'direkomendasi'
  | 'diteruskan'
  | 'ditetapkan'
  | 'berlaku_efektif'
  | 'ditolak';

/** Kategori usulan revisi per master domain vKoreksi §3 + §4. */
export type UsulanJenis = 'revisi_pok' | 'pagu_berubah';

/**
 * Audit trail per attempt Submit (β JSONB-embedded di `usulan_revisi.data`).
 * Per design §6 — useful untuk Itjenad audit. V2 extract ke separate table.
 */
export interface UsulanValidationAttempt {
  attempted_at: string;                    // ISO timestamp
  result: 'pass' | 'fail' | 'pending';
  violations_summary?: {
    constraintIds: string[];               // e.g., ['C8','C11']
    total: number;
  };
}

/**
 * R6+ manual override audit entry. Setiap transisi via Override path
 * append entry ini dengan flag `manual_override: true` untuk audit query.
 */
export interface UsulanManualOverrideEntry {
  from_state: UsulanStatus;
  to_state: UsulanStatus;
  reason: string;                          // mandatory, min 5 char (validate at state machine)
  actor: string;                           // Sie Renbang / Karumkit / KPA
  timestamp: string;                       // ISO timestamp
  manual_override: true;                   // discriminator untuk audit query
}

/**
 * R3c LHR APIP — tied audit per submission (companion ke system_settings global).
 * Per Pasal 22 huruf b angka 2 Perdirjen Renhan Kemhan 7/2025.
 */
export interface UsulanLhrApip {
  nomor: string;
  tanggal: string;                         // ISO date
  acknowledged_at: string;                 // ISO timestamp (saat Sie Renbang check checkbox)
}

/**
 * Tier 5+6 forward-compat (β) — schema accommodate Tier 6 SK template fields.
 * Populate manual di Tier 5; Tier 6 nanti add UI editor.
 * Per design §5.2.
 */
export interface UsulanTemplateSkMetadata {
  template_version?: string;               // e.g., 'v3-13.1'
  signatory_list?: Array<{
    name: string;
    jabatan: string;
    pangkat?: string;
    nrp?: string;
  }>;
  bas_context?: unknown;                   // freeform, Tier 6 define
  nomor_sk_format?: {
    prefix?: string;
    auto_increment?: boolean;
  };
}

/**
 * Shape JSONB `data` column di tabel `usulan_revisi`.
 * Semua field optional saat draft; di-populate progresif sepanjang state machine.
 */
export interface UsulanRevisiData {
  // SK + dates (populated as workflow progresses)
  no_sk?: string;
  tanggal_pengajuan?: string;              // ISO date (saat status = direkomendasi)
  tanggal_penetapan?: string;              // ISO date (= tanggal SK, saat status = ditetapkan)
  tanggal_berlaku_efektif?: string;        // = tanggal_penetapan per §3.6 vKoreksi

  // Actors (R5a single-user — Sie Renbang act as proxy)
  diusulkan_oleh?: string;                 // Sie Renbang
  direkomendasi_oleh?: string;             // Karumkit
  ditetapkan_oleh?: string;                // KPA Palembang

  // Content
  justifikasi?: string;                    // Pasal 22 narrative
  dasar_perintah?: string;                 // untuk pagu_berubah

  // R3c LHR APIP audit (tied to this submission)
  lhr_apip?: UsulanLhrApip;

  // R5+ validation history audit (β JSONB-embedded)
  validation_attempts?: UsulanValidationAttempt[];

  // R6+ manual override log
  manual_override_log?: UsulanManualOverrideEntry[];

  // Tier 5+6 overlap β (forward-compatible)
  template_sk_metadata?: UsulanTemplateSkMetadata;
}

/**
 * Row tabel `usulan_revisi` — R1c hybrid (columned + JSONB).
 * Schema live Supabase: 7 cols (id, status, tahun_anggaran, jenis, data, created_at, updated_at).
 * Note: BERBEDA dari pure envelope convention — tidak ada created_by/updated_by.
 */
export interface UsulanRevisi {
  id: string;                              // UUID
  status: UsulanStatus;
  tahun_anggaran: number;
  jenis: UsulanJenis;
  data: UsulanRevisiData;
  created_at: string;                      // ISO timestamp
  updated_at: string;                      // ISO timestamp
}

/**
 * Shape JSONB `data` column di tabel `usulan_revisi_perubahan`.
 * Per-row diff entry — apa yang berubah di 1 baris pagu dalam usulan ini.
 */
export interface UsulanRevisiPerubahanData {
  kode: string;                            // pagu kode (mis. 521115)
  description?: string;                    // snapshot description saat usulan dibuat
  nilai_semula: number;                    // jumlahBiayaAwal
  nilai_revisi: number;                    // jumlahBiayaRevisi
  alasan?: string;                         // optional per-row justifikasi
  section_id?: string;                     // parent section reference
}

/**
 * Row tabel `usulan_revisi_perubahan` — R1c hybrid.
 * Schema live Supabase: 5 cols (id, usulan_id, pagu_row_id, data, created_at).
 */
export interface UsulanRevisiPerubahan {
  id: string;                              // UUID
  usulan_id: string;                       // FK ke usulan_revisi.id
  pagu_row_id: string;                     // references PaguRow di JSONB data
  data: UsulanRevisiPerubahanData;
  created_at: string;
}

/**
 * Shape JSONB `snapshot_data` column di tabel `snapshot_pok`.
 * R2b full snapshot — entire POK state at tanggal_efektif.
 */
export interface SnapshotPokData {
  pagu_sections: PaguSection[];            // full pagu state
  total_pagu: number;                      // pre-computed for fast display
  total_realisasi?: number;                // kalau available
  generated_from_usulan_id: string;
  generated_at: string;                    // ISO timestamp
}

/**
 * Row tabel `snapshot_pok` — R1c hybrid + R7c immutable.
 * Schema live Supabase: 6 cols (id, tahun_anggaran, tanggal_efektif, usulan_id, snapshot_data, created_at).
 * NOTE JSONB column name = `snapshot_data` (BUKAN `data`) — beda dengan 2 tabel lain.
 * R7c immutability enforced via DB trigger `snapshot_pok_immutable BEFORE UPDATE` + app no-UPDATE endpoint.
 */
export interface SnapshotPok {
  id: string;                              // UUID
  tahun_anggaran: number;
  tanggal_efektif: string;                 // ISO date (= tanggal_penetapan SK)
  usulan_id: string;                       // FK ke usulan_revisi.id
  snapshot_data: SnapshotPokData;
  created_at: string;
}
