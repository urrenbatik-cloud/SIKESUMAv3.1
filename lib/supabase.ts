// ============================================================================
// SIKESUMA v3.1 - Supabase Client + Helpers (PURE Envelope JSONB)
// ============================================================================
// File          : lib/supabase.ts
// Project       : qjijsftbytozcoyrtric (urrenbatik-cloud's Project)
// Schema (REAL — verified via Network response 6 Mei 2026):
//   { id text PK, data jsonb, created_at, updated_at, created_by, updated_by }
//
// NOTE: SEMUA tabel pakai pure envelope JSONB. Title, rows, year, dll. SEMUA
// disimpan di dalam kolom `data` JSONB. Tidak ada kolom auxiliary terpisah.
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import type {
  PaguSection,
  Bill,
  PatientClaim,
  Doctor,
  Employee,
  BPJSCalcSettings,
} from '../types';

// ============================================================================
// 1. CLIENT INITIALIZATION
// ============================================================================

const supabaseUrl =
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  'https://qjijsftbytozcoyrtric.supabase.co';

const supabaseAnonKey =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqaWpzZnRieXRvemNveXJ0cmljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzU0NjcsImV4cCI6MjA4NjE1MTQ2N30.xhTQedwot78BMLoeiaSpBs6wGjb3zhZhnf6_jld14qA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================================================
// 2. GENERIC ENVELOPE HELPERS
// ============================================================================
// Karena SEMUA tabel pakai pola yang sama, kita bikin helper generic.
// Ini meminimalisir duplikasi kode dan typo.

/**
 * Fetch semua row dari tabel envelope JSONB.
 * Return array dengan field di-flatten: { id, ...data }
 */
async function fetchEnvelope<T extends { id: string }>(
  table: string,
  options?: { orderBy?: string }
): Promise<T[]> {
  let q = supabase.from(table).select('*');
  if (options?.orderBy) q = q.order(options.orderBy);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map((row: any): T => ({
    id: row.id,
    ...(row.data || {}),
  }) as T);
}

/**
 * Save (upsert) row ke tabel envelope JSONB.
 * Pisahkan id dari business fields, simpan business fields di kolom data.
 */
async function saveEnvelope<T extends { id: string }>(
  table: string,
  item: T
): Promise<void> {
  const { id, ...rest } = item;
  const { error } = await supabase.from(table).upsert({ id, data: rest });
  if (error) throw error;
}

/**
 * Delete row by id.
 */
async function deleteRow(table: string, id: string): Promise<void> {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
}

// ============================================================================
// 3. PAGU SECTIONS (RKKS) — Pure envelope, no year column
// ============================================================================
// Real schema: { id, data: { rows: [...], title: "..." }, created_at, ... }

export async function fetchPaguSections(): Promise<PaguSection[]> {
  return fetchEnvelope<PaguSection>('pagu_sections', { orderBy: 'id' });
}

export async function savePaguSection(section: PaguSection): Promise<void> {
  return saveEnvelope('pagu_sections', section);
}

export async function savePaguSections(sections: PaguSection[]): Promise<void> {
  // Bulk upsert untuk performance
  const payload = sections.map(s => {
    const { id, ...rest } = s;
    return { id, data: rest };
  });
  const { error } = await supabase.from('pagu_sections').upsert(payload);
  if (error) throw error;
}

export async function deletePaguSection(id: string): Promise<void> {
  return deleteRow('pagu_sections', id);
}

// ============================================================================
// 4. BILLS (TAGIHAN)
// ============================================================================

export async function fetchBills(): Promise<Bill[]> {
  return fetchEnvelope<Bill>('bills', { orderBy: 'created_at' });
}

export async function saveBill(bill: Bill): Promise<void> {
  return saveEnvelope('bills', bill);
}

export async function deleteBill(id: string): Promise<void> {
  return deleteRow('bills', id);
}

// ============================================================================
// 5. PATIENT CLAIMS (BPJS / KLAIM PASIEN)
// ============================================================================
// bulan & tahun ada di dalam `data` JSONB → filter pakai operator ->>

export async function fetchPatientClaims(filter?: {
  bulan?: number;
  tahun?: number;
}): Promise<PatientClaim[]> {
  let q = supabase.from('patient_claims').select('*');
  if (filter?.tahun !== undefined) {
    q = q.eq('data->>tahun', String(filter.tahun));
  }
  if (filter?.bulan !== undefined) {
    q = q.eq('data->>bulan', String(filter.bulan));
  }
  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((row: any): PatientClaim => ({
    id: row.id,
    ...(row.data || {}),
  }));
}

export async function savePatientClaim(claim: PatientClaim): Promise<void> {
  return saveEnvelope('patient_claims', claim);
}

export async function deletePatientClaim(id: string): Promise<void> {
  return deleteRow('patient_claims', id);
}

// ============================================================================
// 6. DOCTORS (DOKTER)
// ============================================================================

export async function fetchDoctors(): Promise<Doctor[]> {
  return fetchEnvelope<Doctor>('doctors', { orderBy: 'id' });
}

export async function saveDoctor(doctor: Doctor): Promise<void> {
  return saveEnvelope('doctors', doctor);
}

export async function deleteDoctor(id: string): Promise<void> {
  return deleteRow('doctors', id);
}

// ============================================================================
// 7. EMPLOYEES (PEGAWAI / STAF)
// ============================================================================

export async function fetchEmployees(): Promise<Employee[]> {
  return fetchEnvelope<Employee>('employees', { orderBy: 'id' });
}

export async function saveEmployee(employee: Employee): Promise<void> {
  return saveEnvelope('employees', employee);
}

export async function deleteEmployee(id: string): Promise<void> {
  return deleteRow('employees', id);
}

// ============================================================================
// 8. SYSTEM SETTINGS (key-value JSONB)
// ============================================================================
// Schema: { key text PK, value jsonb, updated_at, updated_by }

export async function getSetting<T = any>(key: string): Promise<T | null> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  if (error) throw error;
  return (data?.value as T) ?? null;
}

export async function saveSetting<T = any>(key: string, value: T): Promise<void> {
  const { error } = await supabase.from('system_settings').upsert({ key, value });
  if (error) throw error;
}

export async function deleteSetting(key: string): Promise<void> {
  const { error } = await supabase.from('system_settings').delete().eq('key', key);
  if (error) throw error;
}

// Specialized helpers untuk BPJS calculation settings
export async function getBPJSSettings(): Promise<BPJSCalcSettings | null> {
  return getSetting<BPJSCalcSettings>('bpjs_calc_settings');
}

export async function saveBPJSSettings(settings: BPJSCalcSettings): Promise<void> {
  return saveSetting('bpjs_calc_settings', settings);
}

// ============================================================================
// 9. CONNECTION TEST
// ============================================================================

export async function testConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('pagu_sections').select('id').limit(1);
    if (error) {
      console.error('❌ Supabase connection FAILED:', error.message);
      return false;
    }
    console.log('✅ Supabase connected to qjijsftbytozcoyrtric');
    return true;
  } catch (e) {
    console.error('❌ Supabase exception:', e);
    return false;
  }
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================
export default supabase;
