// ============================================================================
// SIKESUMA v3.1 - Supabase Client + Helpers (JSONB Schema)
// ============================================================================
// File          : lib/supabase.ts
// Project       : qjijsftbytozcoyrtric (urrenbatik-cloud's Project)
// Schema pattern: JSONB-as-storage
//   - Most tables: { id, data: JSONB, created_at }
//   - pagu_sections: { id, year, title, rows: JSONB[], created_at }
//   - system_settings: { key, value: JSONB, updated_at }
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
// Pakai env var dulu (production), fallback ke hardcode (development).
// File .env (untuk Vite): VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=...

const supabaseUrl =
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  'https://qjijsftbytozcoyrtric.supabase.co';

const supabaseAnonKey =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqaWpzZnRieXRvemNveXJ0cmljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzU0NjcsImV4cCI6MjA4NjE1MTQ2N30.xhTQedwot78BMLoeiaSpBs6wGjb3zhZhnf6_jld14qA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================================================
// 2. PAGU SECTIONS (RKKS) — STRUKTUR KHUSUS
// ============================================================================
// Schema:
//   id          text PRIMARY KEY
//   year        integer NOT NULL
//   title       text
//   rows        jsonb (array of PaguRow)
//   created_at  timestamptz

const CURRENT_YEAR = new Date().getFullYear();

export async function fetchPaguSections(year: number = CURRENT_YEAR): Promise<PaguSection[]> {
  const { data, error } = await supabase
    .from('pagu_sections')
    .select('*')
    .eq('year', year)
    .order('id');

  if (error) throw error;

  return (data || []).map((s: any): PaguSection => ({
    id: s.id,
    title: s.title || '',
    rows: Array.isArray(s.rows) ? s.rows : [],
  }));
}

export async function savePaguSection(section: PaguSection, year: number = CURRENT_YEAR) {
  const { error } = await supabase.from('pagu_sections').upsert({
    id: section.id,
    year,
    title: section.title,
    rows: section.rows,
  });
  if (error) throw error;
}

// Save semua sections sekaligus (cocok untuk auto-save dari App.tsx)
export async function savePaguSections(sections: PaguSection[], year: number = CURRENT_YEAR) {
  const payload = sections.map(s => ({
    id: s.id,
    year,
    title: s.title,
    rows: s.rows,
  }));
  const { error } = await supabase.from('pagu_sections').upsert(payload);
  if (error) throw error;
}

export async function deletePaguSection(id: string) {
  const { error } = await supabase.from('pagu_sections').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================================
// 3. BILLS (TAGIHAN)
// ============================================================================
// Schema: id text, data jsonb, created_at

export async function fetchBills(): Promise<Bill[]> {
  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any): Bill => ({
    id: row.id,
    ...(row.data || {}),
  }));
}

export async function saveBill(bill: Bill) {
  const { id, ...rest } = bill;
  const { error } = await supabase.from('bills').upsert({ id, data: rest });
  if (error) throw error;
}

export async function deleteBill(id: string) {
  const { error } = await supabase.from('bills').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================================
// 4. PATIENT CLAIMS (BPJS / KLAIM PASIEN)
// ============================================================================
// Schema: id text, data jsonb, created_at
// Field bulan & tahun ada di dalam data JSONB → query pakai operator ->>

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

export async function savePatientClaim(claim: PatientClaim) {
  const { id, ...rest } = claim;
  const { error } = await supabase.from('patient_claims').upsert({ id, data: rest });
  if (error) throw error;
}

export async function deletePatientClaim(id: string) {
  const { error } = await supabase.from('patient_claims').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================================
// 5. DOCTORS (DOKTER)
// ============================================================================
// Schema: id text, data jsonb, created_at

export async function fetchDoctors(): Promise<Doctor[]> {
  const { data, error } = await supabase.from('doctors').select('*').order('id');
  if (error) throw error;

  return (data || []).map((row: any): Doctor => ({
    id: row.id,
    ...(row.data || {}),
  }));
}

export async function saveDoctor(doctor: Doctor) {
  const { id, ...rest } = doctor;
  const { error } = await supabase.from('doctors').upsert({ id, data: rest });
  if (error) throw error;
}

export async function deleteDoctor(id: string) {
  const { error } = await supabase.from('doctors').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================================
// 6. EMPLOYEES (PEGAWAI / STAF)
// ============================================================================
// Schema: id text, data jsonb, created_at

export async function fetchEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase.from('employees').select('*').order('id');
  if (error) throw error;

  return (data || []).map((row: any): Employee => ({
    id: row.id,
    ...(row.data || {}),
  }));
}

export async function saveEmployee(employee: Employee) {
  const { id, ...rest } = employee;
  const { error } = await supabase.from('employees').upsert({ id, data: rest });
  if (error) throw error;
}

export async function deleteEmployee(id: string) {
  const { error } = await supabase.from('employees').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================================
// 7. SYSTEM SETTINGS (KONFIGURASI)
// ============================================================================
// Schema: key text PRIMARY KEY, value jsonb, updated_at

export async function getSetting<T = any>(key: string): Promise<T | null> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();

  if (error) throw error;
  return (data?.value as T) ?? null;
}

export async function saveSetting<T = any>(key: string, value: T) {
  const { error } = await supabase.from('system_settings').upsert({ key, value });
  if (error) throw error;
}

export async function deleteSetting(key: string) {
  const { error } = await supabase.from('system_settings').delete().eq('key', key);
  if (error) throw error;
}

// Specialized helpers untuk BPJS calculation settings
export async function getBPJSSettings(): Promise<BPJSCalcSettings | null> {
  return getSetting<BPJSCalcSettings>('bpjs_calc_settings');
}

export async function saveBPJSSettings(settings: BPJSCalcSettings) {
  return saveSetting('bpjs_calc_settings', settings);
}

// ============================================================================
// 8. BULK INITIAL SEED (PERTAMA KALI PAKAI)
// ============================================================================
// Panggil function ini SEKALI saat app pertama dijalankan untuk populate
// data dummy ke database (kalau database masih kosong).
//
// Cara pakai di App.tsx:
//   import { seedInitialData } from './lib/supabase';
//   await seedInitialData(); // jalankan sekali saja

import {
  INITIAL_PAGU_SECTIONS,
  DUMMY_DOCTORS,
  DUMMY_EMPLOYEES,
  DUMMY_PATIENTS,
  DUMMY_BILLS,
  DEFAULT_BPJS_SETTINGS,
} from '../constants';

export async function seedInitialData(year: number = CURRENT_YEAR) {
  console.log('🌱 Seeding initial data...');

  // Cek dulu — kalau pagu_sections sudah ada data, skip seeding
  const { count } = await supabase
    .from('pagu_sections')
    .select('*', { count: 'exact', head: true })
    .eq('year', year);

  if (count && count > 0) {
    console.log(`ℹ️  Data tahun ${year} sudah ada (${count} sections), skip seeding.`);
    return false;
  }

  try {
    await savePaguSections(INITIAL_PAGU_SECTIONS, year);
    console.log('✅ Pagu sections seeded');

    await Promise.all(DUMMY_DOCTORS.map(saveDoctor));
    console.log('✅ Doctors seeded');

    await Promise.all(DUMMY_EMPLOYEES.map(saveEmployee));
    console.log('✅ Employees seeded');

    await Promise.all(DUMMY_PATIENTS.map(savePatientClaim));
    console.log('✅ Patient claims seeded');

    await Promise.all(DUMMY_BILLS.map(saveBill));
    console.log('✅ Bills seeded');

    await saveBPJSSettings(DEFAULT_BPJS_SETTINGS);
    console.log('✅ BPJS settings seeded');

    console.log('🎉 All initial data seeded successfully!');
    return true;
  } catch (e) {
    console.error('❌ Seed failed:', e);
    throw e;
  }
}

// ============================================================================
// 9. CONNECTION TEST
// ============================================================================
// Panggil di App.tsx saat startup untuk verifikasi koneksi.

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
// EXPORT DEFAULT (kompatibel dengan import gaya lama)
// ============================================================================
export default supabase;
