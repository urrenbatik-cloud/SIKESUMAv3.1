// ============================================================================
// SIKESUMA v3.1 · S6.0 · AI Budget Advisor
// ============================================================================
// File          : utils/aiAdvisor.ts
// Phase         : Step 6 / Phase 6.0 — AI Advisory Optimization
// Date          : 9 Mei 2026
// Purpose       : Unified AI analysis engine. Collects rich contextual data
//                 from pagu/RAB/RPD/realisasi/deviation/earlyWarning, constructs
//                 expert-level prompts, calls AI API (Claude primary, Gemini
//                 fallback), parses structured JSON responses.
//
// Non-goals     : No UI rendering, no Supabase calls, no state mutation.
//                 Pure async functions. Caller provides all data.
//
// Decisions     :
//   §S6.0-D1    : Dual provider — Claude API primary, Gemini fallback
//   §S6.0-D2    : Structured JSON output (not free-text)
//   §S6.0-D3    : Two analysis modes: jasa_efficiency + budget_reallocation
//   §S6.0-D4    : Full context: pagu+RAB+RPD+realisasi+deviasi+earlyWarning
// ============================================================================

import type { PaguSection, RPDSection, Bill } from '../types';
import type { DeviationData, CategoryDeviation } from './deviationMetrics';
import type { WarningAlert } from './earlyWarning';

// ─── §1. Types ─────────────────────────────────────────────────────────────

/** Analysis mode determines prompt structure and expected output. */
export type AnalysisMode = 'jasa_efficiency' | 'budget_reallocation';

/** Structured recommendation from AI. */
export interface AIRecommendation {
  id:          string;
  prioritas:   'tinggi' | 'sedang' | 'rendah';
  judul:       string;
  penjelasan:  string;
  aksi:        string;
}

/** Reallocation suggestion for POK revision. */
export interface ReallocationSuggestion {
  dari:         string;   // source budget item name
  dariKode:     string;   // source akun code
  ke:           string;   // target budget item name  
  keKode:       string;   // target akun code
  jumlah:       number;   // amount to transfer
  alasan:       string;   // justification
}

/** Complete AI analysis result. */
export interface AIAnalysisResult {
  mode:              AnalysisMode;
  timestamp:         string;
  ringkasan:         string;
  rekomendasi:       AIRecommendation[];
  realokasi?:        ReallocationSuggestion[];
  totalPaguSebelum?: number;
  totalPaguSesudah?: number;
  catatanRisiko:     string;
  provider:          'claude' | 'gemini';
}

/** Jasa-specific financial stats (from ServiceDetails). */
export interface JasaFinancialStats {
  klaimTotal:        number;
  totalBeban:        number;
  profit:            number;
  margin:            number;
  bpjsPools:         Record<string, number>;
  totalTransportDoc: number;
  totalHonorTKS:     number;
  subtotalBPJS:      number;
  subtotalYanmasum:  number;
  jumlahPasien:      number;
}

/** Budget briefing — all contextual data for AI analysis. */
export interface BudgetBriefing {
  namaRS:            string;
  tahun:             number;
  bulan?:            number;  // optional — for monthly analysis
  paguSections:      { id: string; title: string; pagu: number; realisasi: number; sisa: number; pctAbsorpsi: number }[];
  rpdVsRealisasi:    { kategori: string; bulan: number; rpd: number; realisasi: number; deviasi: number }[];
  earlyWarnings:     { severity: string; kategori: string; pesan: string; rekomendasi: string }[];
  totalPagu:         number;
  totalRealisasi:    number;
  totalDeviasi:      number;
  jasaStats?:        JasaFinancialStats;
}


// ─── §2. Data Collection ───────────────────────────────────────────────────

/** Format number as Indonesian Rupiah string (compact). */
function rpShort(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
  if (abs >= 1_000_000)     return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  if (abs >= 1_000)         return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return `Rp ${n}`;
}

/**
 * Collect budget briefing from all available data sources.
 * Caller provides raw data — this function structures it for the AI prompt.
 */
export function collectBudgetBriefing(
  year: number,
  paguSections: PaguSection[],
  rpdSections: RPDSection[],
  absorptionMap: Record<string, Record<string, number>>,
  deviationData: DeviationData | null,
  warnings: WarningAlert[],
  jasaStats?: JasaFinancialStats,
  bulan?: number,
): BudgetBriefing {
  // Build pagu summary
  const paguSummary = paguSections.map(sec => {
    const headerRow = sec.rows.find(r => r.level === 0) || sec.rows[0];
    const pagu = headerRow?.jumlahBiayaAwal || 0;
    const itemRows = sec.rows.filter(r => r.level > 0);
    const kodes = itemRows.map(r => r.kode.trim());

    // Sum realisasi from absorptionMap
    let realisasi = 0;
    for (const kode of kodes) {
      const codeMap = absorptionMap[kode] || {};
      realisasi += Object.values(codeMap).reduce((s, v) => s + v, 0);
    }

    return {
      id: sec.id,
      title: sec.title.replace('PAGU ANGGARAN ', ''),
      pagu,
      realisasi,
      sisa: pagu - realisasi,
      pctAbsorpsi: pagu > 0 ? Math.round((realisasi / pagu) * 100 * 10) / 10 : 0,
    };
  });

  // Build RPD vs Realisasi monthly breakdown from deviationData
  const rpdVsRealisasi: BudgetBriefing['rpdVsRealisasi'] = [];
  if (deviationData) {
    for (const cat of deviationData.categories) {
      for (const cell of cat.monthly) {
        if (cell.rpdPlanned > 0 || cell.realisasiActual > 0) {
          rpdVsRealisasi.push({
            kategori: cat.shortLabel,
            bulan: cell.month,
            rpd: cell.rpdPlanned,
            realisasi: cell.realisasiActual,
            deviasi: cell.deviationPct,
          });
        }
      }
    }
  }

  // Map warnings
  const warningsSummary = warnings.map(w => ({
    severity: w.severity,
    kategori: w.categoryLabel,
    pesan: w.message,
    rekomendasi: w.recommendation,
  }));

  const totalPagu = paguSummary.reduce((s, p) => s + p.pagu, 0);
  const totalRealisasi = paguSummary.reduce((s, p) => s + p.realisasi, 0);

  return {
    namaRS: 'RS Tk.IV 02.07.03 Batin Tikal',
    tahun: year,
    bulan,
    paguSections: paguSummary,
    rpdVsRealisasi,
    earlyWarnings: warningsSummary,
    totalPagu,
    totalRealisasi,
    totalDeviasi: totalPagu > 0 ? ((totalRealisasi - totalPagu) / totalPagu) * 100 : 0,
    jasaStats,
  };
}


// ─── §3. Prompt Engineering ────────────────────────────────────────────────

const SYSTEM_PROMPT = `Anda adalah AI Financial Advisor untuk Rumah Sakit TNI AD tingkat IV. 
Tugas Anda: menganalisis data keuangan rumah sakit dan memberikan rekomendasi strategis yang actionable.

ATURAN PENTING:
1. Selalu jawab dalam Bahasa Indonesia
2. Jawab HANYA dalam format JSON yang valid (tanpa markdown, tanpa backtick, tanpa penjelasan di luar JSON)
3. Rekomendasi harus spesifik dan actionable, bukan generik
4. Pertimbangkan konteks RS militer (TNI AD) — anggaran DIPA, PNBP, regulasi pemerintah
5. Jika ada realokasi, total pagu HARUS tetap sama (zero-sum reallocation)
6. Prioritaskan patient safety dan kebutuhan medis di atas efisiensi biaya`;

function buildReallocationPrompt(briefing: BudgetBriefing): string {
  const paguTable = briefing.paguSections.map(p =>
    `  - ${p.title}: Pagu ${rpShort(p.pagu)} | Realisasi ${rpShort(p.realisasi)} | Absorpsi ${p.pctAbsorpsi}% | Sisa ${rpShort(p.sisa)}`
  ).join('\n');

  const warningsText = briefing.earlyWarnings.length > 0
    ? briefing.earlyWarnings.map(w => `  - [${w.severity.toUpperCase()}] ${w.kategori}: ${w.pesan}`).join('\n')
    : '  Tidak ada peringatan aktif.';

  // Monthly deviation summary — group by category, show trend
  const deviationByCategory: Record<string, { bulan: number; deviasi: number }[]> = {};
  for (const r of briefing.rpdVsRealisasi) {
    if (!deviationByCategory[r.kategori]) deviationByCategory[r.kategori] = [];
    deviationByCategory[r.kategori].push({ bulan: r.bulan, deviasi: Math.round(r.deviasi * 10) / 10 });
  }
  const trendText = Object.entries(deviationByCategory).map(([cat, months]) => {
    const vals = months.sort((a, b) => a.bulan - b.bulan).map(m => `Bln${m.bulan}:${m.deviasi > 0 ? '+' : ''}${m.deviasi}%`);
    return `  - ${cat}: ${vals.join(', ')}`;
  }).join('\n');

  return `ANALISIS REALOKASI ANGGARAN (REVISI POK)

DATA RUMAH SAKIT: ${briefing.namaRS}
TAHUN ANGGARAN: ${briefing.tahun}
${briefing.bulan ? `BULAN ANALISIS: ${briefing.bulan}` : ''}
TOTAL PAGU: ${rpShort(briefing.totalPagu)}
TOTAL REALISASI: ${rpShort(briefing.totalRealisasi)}
DEVIASI KESELURUHAN: ${briefing.totalDeviasi > 0 ? '+' : ''}${briefing.totalDeviasi.toFixed(1)}%

PAGU PER KATEGORI:
${paguTable}

TREND DEVIASI BULANAN (RPD vs Realisasi):
${trendText}

EARLY WARNING AKTIF:
${warningsText}

INSTRUKSI: Analisis data di atas dan berikan rekomendasi realokasi anggaran (revisi POK). 
Pindahkan dana dari pos yang SURPLUS ke pos yang DEFISIT. Total pagu harus TETAP ${rpShort(briefing.totalPagu)}.

Jawab dalam JSON format berikut:
{
  "ringkasan": "ringkasan situasi anggaran 2-3 kalimat",
  "rekomendasi": [
    {
      "id": "rek-1",
      "prioritas": "tinggi|sedang|rendah",
      "judul": "judul singkat",
      "penjelasan": "penjelasan detail",
      "aksi": "langkah konkret yang harus diambil"
    }
  ],
  "realokasi": [
    {
      "dari": "nama pos sumber",
      "dariKode": "kode akun sumber",
      "ke": "nama pos tujuan",
      "keKode": "kode akun tujuan",
      "jumlah": 1000000,
      "alasan": "justifikasi pemindahan dana"
    }
  ],
  "totalPaguSebelum": ${briefing.totalPagu},
  "totalPaguSesudah": ${briefing.totalPagu},
  "catatanRisiko": "catatan risiko dari realokasi yang diusulkan"
}`;
}

function buildJasaEfficiencyPrompt(briefing: BudgetBriefing): string {
  if (!briefing.jasaStats) return '';

  const js = briefing.jasaStats;
  const poolsText = Object.entries(js.bpjsPools)
    .filter(([_, v]) => v > 0)
    .map(([k, v]) => `  - ${k}: ${rpShort(v)}`)
    .join('\n');

  return `ANALISIS EFISIENSI JASA PELAYANAN KESEHATAN

DATA RUMAH SAKIT: ${briefing.namaRS}
TAHUN: ${briefing.tahun} | BULAN: ${briefing.bulan || '-'}

RINGKASAN KEUANGAN JASA:
  Total Klaim BPJS: ${rpShort(js.klaimTotal)}
  Total Beban Jasa: ${rpShort(js.totalBeban)}
  Profit Operasional: ${rpShort(js.profit)}
  Margin Operasional: ${js.margin.toFixed(1)}%
  Jumlah Pasien: ${js.jumlahPasien}

BREAKDOWN BEBAN JASA:
  Honor TKS: ${rpShort(js.totalHonorTKS)}
  Transport Dokter: ${rpShort(js.totalTransportDoc)}
  Subtotal BPJS: ${rpShort(js.subtotalBPJS)}
  Subtotal Yanmasum: ${rpShort(js.subtotalYanmasum)}

POOL JASA MEDIS:
${poolsText}

KONTEKS ANGGARAN:
  Total Pagu: ${rpShort(briefing.totalPagu)}
  Total Realisasi: ${rpShort(briefing.totalRealisasi)}
  Deviasi: ${briefing.totalDeviasi > 0 ? '+' : ''}${briefing.totalDeviasi.toFixed(1)}%

EARLY WARNING:
${briefing.earlyWarnings.length > 0 
  ? briefing.earlyWarnings.map(w => `  - [${w.severity.toUpperCase()}] ${w.kategori}: ${w.pesan}`).join('\n')
  : '  Tidak ada peringatan aktif.'}

INSTRUKSI: Analisis efisiensi operasional jasa pelayanan RS ini. Fokus pada:
1. Apakah margin operasional sehat atau perlu perbaikan?
2. Pos mana yang bisa dioptimalkan?
3. Strategi peningkatan pendapatan dan/atau efisiensi biaya

Jawab dalam JSON format berikut:
{
  "ringkasan": "ringkasan kondisi keuangan jasa 2-3 kalimat",
  "rekomendasi": [
    {
      "id": "rek-1",
      "prioritas": "tinggi|sedang|rendah",
      "judul": "judul singkat",
      "penjelasan": "penjelasan detail",
      "aksi": "langkah konkret"
    }
  ],
  "catatanRisiko": "risiko dan hal yang perlu diperhatikan"
}`;
}


// ─── §4. API Calls ─────────────────────────────────────────────────────────

/** Call Claude API (Anthropic). */
async function callClaude(prompt: string): Promise<string> {
  const apiKey = (typeof process !== 'undefined' && process.env?.ANTHROPIC_API_KEY) || '';
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) throw new Error(`Claude API error: ${res.status}`);
  const data = await res.json();
  return data.content?.map((c: { text?: string }) => c.text || '').join('') || '';
}

/** Call Gemini API (Google). */
async function callGemini(prompt: string): Promise<string> {
  const apiKey = (typeof process !== 'undefined' && process.env?.API_KEY) || '';
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  // Dynamic import to avoid bundling if not used
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `${SYSTEM_PROMPT}\n\n${prompt}`,
  });
  return response.text || '';
}

/** Auto-detect available provider and call AI. */
async function callAI(prompt: string): Promise<{ text: string; provider: 'claude' | 'gemini' }> {
  // Try Claude first (primary), fallback to Gemini
  const hasAnthropicKey = !!(typeof process !== 'undefined' && process.env?.ANTHROPIC_API_KEY);
  const hasGeminiKey = !!(typeof process !== 'undefined' && process.env?.API_KEY);

  if (hasAnthropicKey) {
    try {
      const text = await callClaude(prompt);
      return { text, provider: 'claude' };
    } catch (e) {
      console.warn('Claude API failed, trying Gemini fallback:', e);
    }
  }

  if (hasGeminiKey) {
    try {
      const text = await callGemini(prompt);
      return { text, provider: 'gemini' };
    } catch (e) {
      console.warn('Gemini API also failed:', e);
      throw new Error('Kedua AI provider gagal. Periksa API key di environment variables.');
    }
  }

  throw new Error('Tidak ada API key AI yang dikonfigurasi. Tambahkan ANTHROPIC_API_KEY atau GEMINI_API_KEY di Vercel Environment Variables.');
}


// ─── §5. Response Parsing ──────────────────────────────────────────────────

/** Parse AI response into structured result. Handles JSON with/without backticks. */
function parseAIResponse(raw: string, mode: AnalysisMode, provider: 'claude' | 'gemini'): AIAnalysisResult {
  // Strip markdown code fences if present
  let clean = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  
  // Try to find JSON object in the response
  const jsonStart = clean.indexOf('{');
  const jsonEnd = clean.lastIndexOf('}');
  if (jsonStart >= 0 && jsonEnd > jsonStart) {
    clean = clean.substring(jsonStart, jsonEnd + 1);
  }

  try {
    const parsed = JSON.parse(clean);
    return {
      mode,
      timestamp: new Date().toISOString(),
      ringkasan: parsed.ringkasan || 'Analisis selesai.',
      rekomendasi: (parsed.rekomendasi || []).map((r: AIRecommendation, i: number) => ({
        id: r.id || `rek-${i + 1}`,
        prioritas: r.prioritas || 'sedang',
        judul: r.judul || '',
        penjelasan: r.penjelasan || '',
        aksi: r.aksi || '',
      })),
      realokasi: parsed.realokasi,
      totalPaguSebelum: parsed.totalPaguSebelum,
      totalPaguSesudah: parsed.totalPaguSesudah,
      catatanRisiko: parsed.catatanRisiko || '',
      provider,
    };
  } catch {
    // Fallback: treat entire response as unstructured text
    return {
      mode,
      timestamp: new Date().toISOString(),
      ringkasan: raw.substring(0, 500),
      rekomendasi: [{
        id: 'rek-fallback',
        prioritas: 'sedang',
        judul: 'Hasil Analisis',
        penjelasan: raw,
        aksi: 'Review manual diperlukan.',
      }],
      catatanRisiko: 'Output AI tidak dalam format terstruktur — perlu review manual.',
      provider,
    };
  }
}


// ─── §6. Public API ────────────────────────────────────────────────────────

/**
 * Run AI analysis — main entry point.
 *
 * @param mode       - 'jasa_efficiency' or 'budget_reallocation'
 * @param briefing   - Collected budget briefing data
 * @returns Structured analysis result
 */
export async function runAIAnalysis(
  mode: AnalysisMode,
  briefing: BudgetBriefing,
): Promise<AIAnalysisResult> {
  const prompt = mode === 'budget_reallocation'
    ? buildReallocationPrompt(briefing)
    : buildJasaEfficiencyPrompt(briefing);

  if (!prompt) {
    throw new Error('Tidak cukup data untuk analisis. Pastikan data jasa tersedia.');
  }

  const { text, provider } = await callAI(prompt);
  return parseAIResponse(text, mode, provider);
}

/**
 * Export briefing as Markdown — for manual analysis or rapat koordinasi.
 * This is Phase 6.1 Budget Briefing Generator output.
 */
export function exportBriefingMarkdown(briefing: BudgetBriefing): string {
  const monthNames = ['','Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

  let md = `# BUDGET BRIEFING — ${briefing.namaRS}\n`;
  md += `## Tahun Anggaran ${briefing.tahun}`;
  if (briefing.bulan) md += ` | Periode s.d. ${monthNames[briefing.bulan]}`;
  md += '\n\n';

  md += `### 1. Ringkasan Pagu\n\n`;
  md += `| Kategori | Pagu | Realisasi | Absorpsi | Sisa |\n`;
  md += `|----------|------|-----------|----------|------|\n`;
  for (const p of briefing.paguSections) {
    md += `| ${p.title} | ${rpShort(p.pagu)} | ${rpShort(p.realisasi)} | ${p.pctAbsorpsi}% | ${rpShort(p.sisa)} |\n`;
  }
  md += `| **TOTAL** | **${rpShort(briefing.totalPagu)}** | **${rpShort(briefing.totalRealisasi)}** | **${(briefing.totalPagu > 0 ? (briefing.totalRealisasi / briefing.totalPagu * 100) : 0).toFixed(1)}%** | **${rpShort(briefing.totalPagu - briefing.totalRealisasi)}** |\n\n`;

  if (briefing.earlyWarnings.length > 0) {
    md += `### 2. Early Warning Aktif\n\n`;
    for (const w of briefing.earlyWarnings) {
      md += `- **[${w.severity.toUpperCase()}]** ${w.kategori}: ${w.pesan}\n`;
    }
    md += '\n';
  }

  if (briefing.rpdVsRealisasi.length > 0) {
    md += `### 3. Trend Deviasi Bulanan\n\n`;
    const cats = [...new Set(briefing.rpdVsRealisasi.map(r => r.kategori))];
    for (const cat of cats) {
      const rows = briefing.rpdVsRealisasi.filter(r => r.kategori === cat).sort((a, b) => a.bulan - b.bulan);
      md += `**${cat}**: `;
      md += rows.map(r => `${monthNames[r.bulan]?.substring(0, 3)} ${r.deviasi > 0 ? '+' : ''}${r.deviasi.toFixed(0)}%`).join(', ');
      md += '\n';
    }
    md += '\n';
  }

  md += `---\n*Digenerate oleh SIKESUMA v3.1 AI Budget Advisor pada ${new Date().toLocaleString('id-ID')}*\n`;
  return md;
}
