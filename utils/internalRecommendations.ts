// ============================================================================
// SIKESUMA v3.1 · Internal Recommendation Dictionary — HITL Output
// ============================================================================
// File         : utils/internalRecommendations.ts
// Phase        : Sprint B post-closure / pre-D — HITL feature foundation
// Date         : 10 Mei 2026
// Source       : Klarifikasi Angga (Sie Renbang RS Tk.IV 02.07.03 Batin Tikal)
//
// Tujuan: Beda dari `utils/basDictionary.ts` (yang berisi 4,314 BAS resmi
// KEP-331/2021 verbatim), file ini menyimpan **rekomendasi internal RS**
// dari Angga sebagai HITL output:
//   - Pattern (description keyword OR SIKESUMA-internal kode prefix)
//   - Recommended kode_bas
//   - Justifikasi tertulis dari Angga (audit-friendly, KPPN best practice, dst)
//   - Source quote (untuk reference saat ada disagreement future)
//
// Cara pakai:
//   - `findRecommendations(query)` returns matching recommendations untuk
//     ditampilkan di autocomplete sebelum BAS dictionary results.
//   - `getRecommendationFor(description)` returns single best match untuk
//     auto-fill saat user pick item.
//
// Update workflow:
//   - Saat Angga (atau pemilik domain lain) memberikan klarifikasi baru:
//     1. Tambah entry ke RECOMMENDATIONS array
//     2. Quote justifikasi-nya di field `justification`
//     3. Update SOURCE_DOCS jika ada dokumen baru
//     4. Commit dengan referensi tanggal komunikasi
//   - Goal long-term: pindah ke Supabase table `internal_recommendations`
//     dengan UI HITL agar Angga bisa input langsung tanpa code change
//     (Sprint masa depan, lihat Konteks 6 user discussion).
// ============================================================================

export interface InternalRecommendation {
  /** Unique ID untuk reference / audit log */
  id: string;
  /** Pattern matcher — case-insensitive */
  trigger: {
    /** Description keywords/regex (any match → suggest this rec) */
    descriptionKeywords?: RegExp[];
    /** SIKESUMA-internal kode prefix patterns (any match → suggest this rec) */
    kodePrefixes?: string[];
  };
  /** Canonical BAS code yang Angga rekomendasikan */
  recommended_kode_bas: string;
  /** Alternatif yang TIDAK Angga rekomendasikan (untuk warning saat user salah pilih) */
  rejected_alternatives?: { kode_bas: string; reason: string }[];
  /** Justifikasi tertulis dari Angga (akan ditampilkan di tooltip saran) */
  justification: string;
  /** Source dokumen dimana Angga tulis justifikasi ini */
  source: string;
  /** Tanggal Angga memberikan klarifikasi */
  approvedDate: string;
  /** Confidence (Angga sebagai pemilik domain = high) */
  confidence: 'high' | 'medium' | 'low';
}

const SOURCE_DOCS = {
  RESPONS_ANGGA_B4: 'SPRINT-B4-RESPONS-ANGGA.md (10 Mei 2026)',
  KLARIFIKASI_FOLLOWUP: 'Komunikasi Angga 10 Mei 2026 (post B.4 closure)',
  CORRIGENDUM: 'SIKESUMA-Audit-BAS-Konformitas-CORRIGENDUM.md (10 Mei 2026)',
};

export const RECOMMENDATIONS: InternalRecommendation[] = [
  // ──────────────────────────────────────────────────────────────────────
  // ATK — 521811 (lebih spesifik vs 521111 umum)
  // ──────────────────────────────────────────────────────────────────────
  {
    id: 'ATK-001',
    trigger: {
      descriptionKeywords: [/\batk\b/i, /alat tulis kantor/i],
    },
    recommended_kode_bas: '521811',
    rejected_alternatives: [
      { kode_bas: '521111',
        reason: 'Belanja Keperluan Perkantoran umum — terlalu generik untuk ATK. Auditor BPK/KPPN minta penjelasan tambahan.' },
    ],
    justification: '521811 (Belanja Barang ATK) lebih spesifik dan memang disediakan untuk mencatat belanja Alat Tulis Kantor. ' +
      'Konsistensi DIPA: biasanya di DIPA satker sudah dialokasikan belanja ATK di 521811. ' +
      'Best practice KPPN: KPPN cenderung mendorong satker pakai akun yang paling spesifik agar tidak terjadi salah klasifikasi. ' +
      'Audit readiness: auditor BPK/KPPN lebih mudah menelusuri transaksi bila ATK langsung masuk ke akun khususnya.',
    source: SOURCE_DOCS.KLARIFIKASI_FOLLOWUP,
    approvedDate: '2026-05-10',
    confidence: 'high',
  },

  // ──────────────────────────────────────────────────────────────────────
  // Jasa Rujukan Pasien ke Rekanan — 521119 (sharing cost operasional, BUKAN 522191)
  // ──────────────────────────────────────────────────────────────────────
  {
    id: 'JASA-RUJUKAN-001',
    trigger: {
      descriptionKeywords: [
        /\bdiagnostik\b/i,
        /\bct scan\b/i,
        /\blab(oratorium)? pa\b/i,
        /pembayaran rujuk/i,
        /\blaundry\b/i,
      ],
    },
    recommended_kode_bas: '521119',
    rejected_alternatives: [
      { kode_bas: '522191',
        reason: 'Belanja Jasa Lainnya umum — kurang aman secara audit. Auditor bisa anggap "jasa kesehatan" hanya berlaku untuk pelayanan langsung di satker sendiri (bukan rujukan ke rekanan), sehingga pemilihan 522191 berisiko salah klasifikasi.' },
    ],
    justification: '521119 (Belanja Barang Operasional Lainnya) lebih aman secara audit untuk pembayaran rujukan pasien ke rekanan. ' +
      'Pembayaran rujukan dianggap sebagai biaya operasional rumah sakit (sharing cost atau biaya operasional rujukan), ' +
      'bukan langsung pembelian jasa kesehatan. Klasifikasi "jasa kesehatan" formal hanya berlaku untuk pelayanan langsung ' +
      'di satker sendiri. Item terkait: Jasa Diagnostik (Sun Clinik, Promedic), Jasa CT Scan (Famon Medica), ' +
      'Jasa Lab PA, LAUNDRY (jasa rekanan), Pembayaran Rujuk Pemeriksaan Diagnostik.',
    source: SOURCE_DOCS.KLARIFIKASI_FOLLOWUP,
    approvedDate: '2026-05-10',
    confidence: 'high',
  },

  // ──────────────────────────────────────────────────────────────────────
  // Honor Operasional — 521115 (continuous monthly per HB#2)
  // ──────────────────────────────────────────────────────────────────────
  {
    id: 'HONOR-001',
    trigger: {
      descriptionKeywords: [
        /\bhonor\s+(tks|tenaga\s+lepas|pengelola|nakes|kesehatan|tenaga\s+kerja)/i,
        /\btks\b/i,
        /\bnakes\b/i,
        /\bcasemix\b/i,
        /tim\s+verifikasi/i,
      ],
    },
    recommended_kode_bas: '521115',
    rejected_alternatives: [
      { kode_bas: '521213',
        reason: 'KEP-331 literal: 521213 requires "insidentil dan tidak terus-menerus". RS Batin Tikal Honor TKS/Nakes/Pengelola dibayar regular bulanan continuous → violates 521213 requirement. 521115 satu-satunya kode yang fit.' },
      { kode_bas: '525111',
        reason: 'RS Batin Tikal BUKAN BLU formal (status: sub-Satker di bawah Palembang) — seri 525xxx tidak relevan.' },
    ],
    justification: 'KEP-331 literal test untuk Honor: 521115 = "pembayaran honornya dilakukan secara terus menerus dari awal sampai dengan akhir tahun anggaran"; ' +
      '521213 = "pembayaran insidentil dan dapat dibayarkan tidak terus menerus". ' +
      'Di RS Batin Tikal, semua Honor (TKS gaji flat, Nakes Transport+Jasa Medis combined by-design, Pengelola Manajemen+Casemix+Tim Verifikasi) ' +
      'dibayar regular bulanan sepanjang tahun = continuous → 521115. ' +
      'Honor Nakes combined adalah keputusan by-design (fleksibilitas paket kompensasi dokter spesialis + status non-Satker mandiri).',
    source: SOURCE_DOCS.RESPONS_ANGGA_B4,
    approvedDate: '2026-05-10',
    confidence: 'high',
  },

  // ──────────────────────────────────────────────────────────────────────
  // Obat & BMHP — 521811 (NOT 521813 yang Pita Cukai)
  // ──────────────────────────────────────────────────────────────────────
  {
    id: 'BMHP-001',
    trigger: {
      descriptionKeywords: [
        /\bobat\b/i,
        /\bbmhp\b/i,
        /bahan medis/i,
        /persediaan medis/i,
        /\bgas medis\b/i,
        /\boksigen\b/i,
        /\breagen\b/i,
        /\blinen pasien\b/i,
      ],
    },
    recommended_kode_bas: '521811',
    rejected_alternatives: [
      { kode_bas: '521813',
        reason: 'KEP-331 literal: 521813 = "Belanja Barang Persediaan Pita Cukai, Meterai dan Leges" — bukan obat/medis sama sekali. Misinterpretasi awal di proposal Sprint B.4.' },
    ],
    justification: '521811 (Belanja Barang Persediaan Barang Konsumsi) adalah kode resmi untuk obat, BMHP, gas medis, reagen lab, oksigen. ' +
      'Substansi: barang habis pakai medis. Verifikasi langsung ke KEP-331 verbatim memastikan 521813 ≠ medis. ' +
      'Linen pasien juga masuk kategori ini karena masuk persediaan barang konsumsi RS.',
    source: SOURCE_DOCS.RESPONS_ANGGA_B4,
    approvedDate: '2026-05-10',
    confidence: 'high',
  },

  // ──────────────────────────────────────────────────────────────────────
  // BMP (Bahan Bakar Minyak dan Pelumas) — 523122 (Permenhan 5/2020)
  // ──────────────────────────────────────────────────────────────────────
  {
    id: 'BMP-001',
    trigger: {
      descriptionKeywords: [
        /\bbmp\b/i,
        /\bbbm\b/i,
        /bahan bakar/i,
        /\b(pertamax|premium|solar|hsd|avtur|avgas|minyak)\b/i,
        /\bpelumas\b/i,
      ],
    },
    recommended_kode_bas: '523122',
    rejected_alternatives: [
      { kode_bas: '521112',
        reason: 'Misinterpretasi BMP sebagai "Bahan Makanan Pokok" — di Kemhan/TNI, BMP = Bahan Bakar Minyak dan Pelumas (Permenhan 5/2020 Pasal 1).' },
      { kode_bas: '521113',
        reason: 'Bukan Belanja Penambah Daya Tahan Tubuh; BMP adalah BBM untuk kendaraan operasional.' },
    ],
    justification: 'Permenhan 5/2020 mendefinisikan BMP = "hasil minyak bumi/nabati seperti Avgas, Avtur, Premium, Pertamax, Solar/HSD, MDF, MFO". ' +
      'BAS resmi punya kode khusus Kemhan/TNI: 523122 (Belanja BMP Khusus Non Pertamina, pendekatan beban langsung) atau 523125 (persediaan, jika ada stockopname). ' +
      'Untuk RS Tk.IV nominal kecil tanpa inventarisir tangki: 523122 lebih tepat. Permenhan 5/2020 Pasal 28(3) eksplisit merujuk akun ini.',
    source: SOURCE_DOCS.RESPONS_ANGGA_B4,
    approvedDate: '2026-05-10',
    confidence: 'high',
  },

  // ──────────────────────────────────────────────────────────────────────
  // Listrik & Air — separate codes (cannot conflate)
  // ──────────────────────────────────────────────────────────────────────
  {
    id: 'UTILITAS-001',
    trigger: {
      descriptionKeywords: [/\blistrik\b/i, /\bpln\b/i],
    },
    recommended_kode_bas: '522111',
    rejected_alternatives: [
      { kode_bas: '522113', reason: 'Itu kode Air, bukan Listrik. BAS punya kode terpisah untuk masing-masing.' },
      { kode_bas: '521311', reason: '521311 tidak ada di BAS resmi.' },
    ],
    justification: '522111 (Belanja Langganan Listrik) khusus untuk PLN. Saat tagihan listrik+air gabung di 1 invoice, split di stage Pagu (rasio default 75% Listrik / 25% Air per konfirmasi operasional RS), bukan di stage Bill. ' +
      'STATUS RS Batin Tikal (10 Mei 2026): kode 522111 sedang persiapan, belum dipakai aktif karena listrik masih disubsidi. Tetap encode kode_bas untuk readiness saat subsidi berakhir.',
    source: SOURCE_DOCS.RESPONS_ANGGA_B4,
    approvedDate: '2026-05-10',
    confidence: 'high',
  },
  {
    id: 'UTILITAS-002',
    trigger: {
      descriptionKeywords: [/\bair\b/i, /\bpdam\b/i],
    },
    recommended_kode_bas: '522113',
    rejected_alternatives: [
      { kode_bas: '522111', reason: 'Itu kode Listrik, bukan Air.' },
    ],
    justification: '522113 (Belanja Langganan Air) khusus untuk PDAM. Lihat catatan split 75/25 di rec UTILITAS-001.',
    source: SOURCE_DOCS.RESPONS_ANGGA_B4,
    approvedDate: '2026-05-10',
    confidence: 'high',
  },
  {
    id: 'UTILITAS-003',
    trigger: {
      descriptionKeywords: [/\binternet\b/i, /\btelepon\b/i, /\bwifi\b/i, /\btelkom\b/i],
    },
    recommended_kode_bas: '522112',
    justification: '522112 (Belanja Langganan Telepon) sudah include internet & data — BAS tidak punya kode terpisah untuk internet.',
    source: SOURCE_DOCS.RESPONS_ANGGA_B4,
    approvedDate: '2026-05-10',
    confidence: 'high',
  },

  // ──────────────────────────────────────────────────────────────────────
  // Perjalanan Dinas — 524111 (biasa, dalam negeri)
  // ──────────────────────────────────────────────────────────────────────
  {
    id: 'BPD-001',
    trigger: {
      descriptionKeywords: [/\bbpd\b/i, /perjalanan dinas/i, /\bspd\b/i],
    },
    recommended_kode_bas: '524111',
    justification: '524111 (Belanja Perjalanan Dinas Biasa) = SPD dalam negeri reguler. Variant lain: 524112 luar negeri, 524119 lain-lain.',
    source: SOURCE_DOCS.RESPONS_ANGGA_B4,
    approvedDate: '2026-05-10',
    confidence: 'high',
  },
  // ──────────────────────────────────────────────────────────────────────
  // Belanja Modal Peralatan dan Mesin — 532111 (Pengadaan)
  // Catatan Konteks 4 (Angga 10 Mei 2026): konvensi subkode '.A'/'.B' di
  // SIKESUMA RS Batin Tikal hanya berlaku untuk BELANJA PENGADAAN, BUKAN
  // global standardization. Reasoning: akun Pengadaan sama (532111) tapi
  // komponen pembelanjaan berbeda (alsintor/alkes/alsatri) — perlu sub-
  // categorization internal. Akun lain tidak butuh ini karena beda komponen
  // sudah ada beda akun di BAS.
  // ──────────────────────────────────────────────────────────────────────
  {
    id: 'PENGADAAN-MODAL-001',
    trigger: {
      descriptionKeywords: [
        /pengadaan\s+(alsintor|alkes|alsatri)/i,
        /\balsintor\b/i,
        /\balsatri\b/i,
        /\balat\s+kesehatan\b/i,
        /\bperalatan\s+dan\s+mesin\b/i,
        /tensimeter|stethoscope|stetoskop|o2\s+sensor|laptop|computer|showcase\s+cooler|kursi|meja/i,
      ],
    },
    recommended_kode_bas: '532111',
    rejected_alternatives: [
      { kode_bas: '521411',
        reason: '521411 tidak ada di BAS resmi. Pengadaan = Belanja Modal seri 53xxxx, bukan Belanja Barang & Jasa seri 52xxxx.' },
    ],
    justification: '532111 (Belanja Modal Peralatan dan Mesin) adalah kode umum untuk pengadaan alat operasional. ' +
      'Untuk RS Batin Tikal sub-Satker non-BLU, pakai 532111 default (bukan variant 532113 BLU atau 532114 TNI/POLRI khusus). ' +
      'Konvensi subkode internal RS (KONFIRMASI ANGGA 10 Mei 2026): 532111.{nomor}.{kategori} dimana {kategori} = ' +
      'A (Alsintor: alat mesin kantor), B (Alkes: alat kesehatan), C (Alsatri: alat kesatriaan). ' +
      'Konvensi ini KHUSUS untuk Belanja Pengadaan saja, bukan global cross-section. ' +
      'Reasoning: akun pengadaan sama (532111) tapi komponen pembelanjaan beda → butuh sub-categorization internal. ' +
      'Akun lain tidak butuh ini karena beda komponen sudah ada beda akun di BAS.',
    source: SOURCE_DOCS.KLARIFIKASI_FOLLOWUP,
    approvedDate: '2026-05-10',
    confidence: 'high',
  },

  // ──────────────────────────────────────────────────────────────────────
  // Belanja Modal Lainnya — 536111 (software, aplikasi, license)
  // ──────────────────────────────────────────────────────────────────────
  {
    id: 'MODAL-LAINNYA-001',
    trigger: {
      descriptionKeywords: [
        /\baplikasi\b/i,
        /\bsoftware\b/i,
        /\blicense\b/i,
        /\bxdr\b/i,
        /belanja\s+modal\s+lainnya/i,
      ],
    },
    recommended_kode_bas: '536111',
    rejected_alternatives: [
      { kode_bas: '53611', reason: '53611 hanya 5-digit, BAS minimal 6-digit. Yang dimaksud adalah 536111 (Belanja Modal Lainnya).' },
      { kode_bas: '521411', reason: '521411 tidak valid BAS.' },
    ],
    justification: '536111 (Belanja Modal Lainnya) untuk pengadaan aset tak-berwujud seperti software, aplikasi, license. ' +
      'Software XDR (Extended Detection and Response) = belanja modal karena dikapitalisasi sebagai aset di neraca, ' +
      'bukan beban operasional langsung.',
    source: SOURCE_DOCS.RESPONS_ANGGA_B4,
    approvedDate: '2026-05-10',
    confidence: 'high',
  },

  // ──────────────────────────────────────────────────────────────────────
  // Pakaian Dinas / Seragam — 521219 (Belanja Bahan Lainnya / Pakaian Khusus)
  // ──────────────────────────────────────────────────────────────────────
  {
    id: 'SERAGAM-001',
    trigger: {
      descriptionKeywords: [
        /\bseragam\b/i,
        /\bpakaian\s+(dinas|kerja|khusus)\b/i,
      ],
    },
    recommended_kode_bas: '521219',
    justification: '521219 (Belanja Bahan Lainnya) digunakan untuk pakaian dinas/seragam pelaksana. ' +
      'Bila ada kode lebih spesifik untuk pakaian, prefer yang itu.',
    source: SOURCE_DOCS.KLARIFIKASI_FOLLOWUP,
    approvedDate: '2026-05-10',
    confidence: 'medium',
  },

  // ──────────────────────────────────────────────────────────────────────
  // Belanja Operasional Lainnya — 521119 (Konteks 6: BUKAN 521112)
  // ──────────────────────────────────────────────────────────────────────
  {
    id: 'OPERASIONAL-LAINNYA-001',
    trigger: {
      descriptionKeywords: [
        /belanja\s+(barang\s+)?operasional(\s+lainnya)?/i,
        /\boperasional\s+kantor\b/i,
      ],
    },
    recommended_kode_bas: '521119',
    rejected_alternatives: [
      { kode_bas: '521112',
        reason: 'Konteks 6 (Angga 10 Mei 2026): 521112 SPESIFIK untuk Belanja Pengadaan Bahan Makanan, BUKAN operasional umum. Untuk operasional lainnya pakai 521119.' },
    ],
    justification: 'Konteks 6 dari Angga: akun "BELANJA BARANG OPERASIONAL LAINNYA" = 521119, dengan sub akun internal .03. ' +
      'Klarifikasi penting: 521112 adalah kode KHUSUS untuk Belanja Pengadaan Bahan Makanan, bukan operasional lainnya. ' +
      'Hindari salah klasifikasi di section "Operasional Lainnya".',
    source: SOURCE_DOCS.KLARIFIKASI_FOLLOWUP,
    approvedDate: '2026-05-10',
    confidence: 'high',
  },

  // ──────────────────────────────────────────────────────────────────────
  // Bahan Makanan (pasien, snacks, dll) — 521112
  // ──────────────────────────────────────────────────────────────────────
  {
    id: 'BAHAN-MAKANAN-001',
    trigger: {
      descriptionKeywords: [
        /makan\s+pasien/i,
        /pengadaan\s+bahan\s+makanan/i,
        /\bbahan\s+makanan\b/i,
      ],
    },
    recommended_kode_bas: '521112',
    justification: '521112 (Belanja Pengadaan Bahan Makanan) khusus untuk konsumsi pasien & operasional makanan. ' +
      'JANGAN pakai untuk operasional non-makanan — itu pakai 521119.',
    source: SOURCE_DOCS.KLARIFIKASI_FOLLOWUP,
    approvedDate: '2026-05-10',
    confidence: 'high',
  },

  // ──────────────────────────────────────────────────────────────────────
  // CATATAN: Listrik 522111 (status: persiapan, belum aktif krn subsidi)
  // Tidak ada perubahan trigger di sini, tapi tetap UTILITAS-001 berlaku.
  // Field "approvedDate" + "confidence" tetap, hanya add note di justification.
  // ──────────────────────────────────────────────────────────────────────
];



/**
 * Cari rekomendasi internal yang cocok dengan deskripsi item.
 * Returns sorted by confidence descending, multiple matches possible.
 */
export function findRecommendations(
  description: string,
  kode?: string
): InternalRecommendation[] {
  const desc = (description || '').trim();
  const kd = (kode || '').trim();
  if (!desc && !kd) return [];

  const matches: InternalRecommendation[] = [];
  for (const rec of RECOMMENDATIONS) {
    let matched = false;
    if (rec.trigger.descriptionKeywords && desc) {
      for (const re of rec.trigger.descriptionKeywords) {
        if (re.test(desc)) { matched = true; break; }
      }
    }
    if (!matched && rec.trigger.kodePrefixes && kd) {
      for (const prefix of rec.trigger.kodePrefixes) {
        if (kd.startsWith(prefix)) { matched = true; break; }
      }
    }
    if (matched) matches.push(rec);
  }
  // Sort by confidence (high first)
  matches.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.confidence] - order[b.confidence];
  });
  return matches;
}

/**
 * Single best recommendation untuk auto-fill scenario.
 */
export function getRecommendationFor(
  description: string,
  kode?: string
): InternalRecommendation | null {
  const recs = findRecommendations(description, kode);
  return recs[0] || null;
}

/**
 * Cek apakah pilihan kode_bas user "rejected" oleh suatu rekomendasi
 * (returns warning kalau user pilih kode yang Angga eksplisit reject untuk pattern ini).
 */
export function checkRejectedAlternative(
  description: string,
  kodeBasUserPilih: string
): { rec: InternalRecommendation; rejected: { kode_bas: string; reason: string } } | null {
  const recs = findRecommendations(description);
  for (const rec of recs) {
    const rejected = (rec.rejected_alternatives || []).find(alt => alt.kode_bas === kodeBasUserPilih);
    if (rejected) return { rec, rejected };
  }
  return null;
}

/** Stats untuk diagnostics / "About HITL Dictionary" UI */
export const INTERNAL_DICT_STATS = Object.freeze({
  totalRecommendations: RECOMMENDATIONS.length,
  byConfidence: RECOMMENDATIONS.reduce((acc, r) => {
    acc[r.confidence] = (acc[r.confidence] || 0) + 1;
    return acc;
  }, {} as Record<string, number>),
  sources: Object.values(SOURCE_DOCS),
  lastUpdate: '2026-05-10',
});
