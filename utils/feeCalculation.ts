
import { PatientClaim, TindakanItem, BPJSCalcSettings, ScenarioSettings } from '../types';

export interface FeeBreakdown {
  klaim: number;
  spesialis: number; 
  raberTotal: number;
  anestesi: number;
  gp: number;
  paramOK: number;
  paramICU: number;
  paramGen: number;
  penataAnestesi: number;
  konsul: number; 
  pengelola: number;
  manajemen: number;
  casemix: number;
  bhp: number;
  operasional: number;
}

export const getEffectiveSettings = (
  year: number, 
  month: number, 
  history: Record<string, BPJSCalcSettings>
): BPJSCalcSettings => {
  const keys = Object.keys(history).sort().reverse(); 
  const targetKey = `${year}-${month.toString().padStart(2, '0')}`;
  
  const effectiveKey = keys.find(k => k <= targetKey) || keys[keys.length - 1];
  
  if (!effectiveKey || !history[effectiveKey]) {
     const mockScenario: ScenarioSettings = {
        specPct: 0, specCap: 0, raberCutPct: 0, raberPoolPct: 0,
        anestesiPct: 0, anestesiCap: 0, gpPct: 0, gpCap: 0,
        paramOKPct: 0, paramICUPct: 0, paramICUCap: 0, paramGenPct: 0, paramGenCap: 0,
        penataAnestesiPct: 0, penataAnestesiCap: 0, konsulPct: 0, konsulCap: 0,
        bhpPct: 0, pengelolaPct: 0, manajemenPct: 0, casemixPct: 0,
        bedahSarafFlat: 0, bedahSarafJRFlat: 0, raberNeuroPct: 0
     };
     return {
        scenarioA: mockScenario, scenarioB: mockScenario,
        scenarioD: mockScenario, scenarioE: mockScenario, scenarioF: mockScenario
     };
  }
  return history[effectiveKey];
};

const applyScenario = (k: number, pat: PatientClaim, s: ScenarioSettings): FeeBreakdown => {
  const raberCount = pat.timRaber?.length || 0;
  const hasRaber = raberCount > 0;
  const isJR = pat.isJasaRaharja || pat.kategoriPasien === 'BPJS_PLUS_JR';

  let res: FeeBreakdown = {
    klaim: k, spesialis: 0, raberTotal: 0, anestesi: 0, gp: 0, paramOK: 0, paramICU: 0, 
    paramGen: 0, penataAnestesi: 0, konsul: 0, pengelola: 0, manajemen: 0, casemix: 0, bhp: 0, operasional: 0
  };

  // 1. Logika BHP, Pengelola, Manajemen, Casemix (Umum di hampir semua skenario)
  res.bhp = k * (s.bhpPct / 100);
  res.pengelola = k * (s.pengelolaPct / 100);
  res.manajemen = k * (s.manajemenPct / 100);
  res.casemix = k * (s.casemixPct / 100);
  
  // 2. Logika Anestesi, GP, Penata, Paramedis dengan Caps
  res.anestesi = s.anestesiCap > 0 ? Math.min(k * (s.anestesiPct / 100), s.anestesiCap) : k * (s.anestesiPct / 100);
  res.gp = s.gpCap > 0 ? Math.min(k * (s.gpPct / 100), s.gpCap) : k * (s.gpPct / 100);
  res.penataAnestesi = s.penataAnestesiCap > 0 ? Math.min(k * (s.penataAnestesiPct / 100), s.penataAnestesiCap) : k * (s.penataAnestesiPct / 100);
  res.paramOK = k * (s.paramOKPct / 100);
  res.paramICU = s.paramICUCap > 0 ? Math.min(k * (s.paramICUPct / 100), s.paramICUCap) : k * (s.paramICUPct / 100);
  res.paramGen = s.paramGenCap > 0 ? Math.min(k * (s.paramGenPct / 100), s.paramGenCap) : k * (s.paramGenPct / 100);

  // 3. Logika Konsul Spesialis (Jika tidak ada masuk ke BHP)
  const baseKonsul = s.konsulCap > 0 ? Math.min(k * (s.konsulPct / 100), s.konsulCap) : k * (s.konsulPct / 100);
  if (hasRaber || pat.drKonsulen) res.konsul = baseKonsul;
  else res.bhp += baseKonsul;

  // 4. Logika Spesialis Utama & Raber
  // Cek khusus Bedah Saraf (Scenario 2 & 5)
  if (pat.isBedahSaraf && s.bedahSarafFlat > 0) {
    res.spesialis = isJR ? s.bedahSarafJRFlat : s.bedahSarafFlat;
    if (hasRaber) {
        // Raber bedah saraf dapat 5% claim (Scenario 2 & 5)
        res.raberTotal = k * (s.raberNeuroPct / 100);
    }
  } else {
    // Logika Spesialis Standar (Scenario 1, 4, 6)
    let pool = s.specCap > 0 ? Math.min(k * (s.specPct / 100), s.specCap) : k * (s.specPct / 100);
    
    if (raberCount === 1) {
      // Potong 35% untuk raber
      res.spesialis = pool * (1 - (s.raberCutPct / 100));
      res.raberTotal = pool * (s.raberCutPct / 100);
    } else if (raberCount > 1) {
      // Bagi 50% spesialis utama, 50% pool raber
      res.spesialis = pool * (1 - (s.raberPoolPct / 100));
      res.raberTotal = pool * (s.raberPoolPct / 100);
    } else {
      res.spesialis = pool;
    }
  }

  // 5. Sisa masuk ke Operasional RS
  const totalDist = Object.entries(res).reduce((sum, [key, val]) => {
    if (key === 'klaim') return sum;
    return sum + (typeof val === 'number' ? val : 0);
  }, 0);
  
  res.operasional = k > totalDist ? k - totalDist : 0;
  
  return res;
};

export const calculateBPJSFees = (pat: PatientClaim, settings: BPJSCalcSettings): FeeBreakdown => {
  const k = pat.nilaiKlaim;
  const isBedah = pat.isBedah;
  const isICU = pat.isICU;
  const isHighClaim = k > 20000000;

  if (isBedah) {
    // Skenario 1, 2, 3
    if (isICU && isHighClaim) {
        // Skenario 2: Bedah ICU > 20jt
        return applyScenario(k, pat, settings.scenarioB);
    }
    // Skenario 1: Bedah Non-ICU atau Bedah ICU <= 20jt
    return applyScenario(k, pat, settings.scenarioA);
  } else {
    // Skenario 4, 5, 6
    if (!isICU) {
        // Skenario 4: Non-Bedah Non-ICU
        return applyScenario(k, pat, settings.scenarioD);
    }
    if (isHighClaim) {
        // Skenario 5: Non-Bedah ICU > 20jt
        return applyScenario(k, pat, settings.scenarioE);
    }
    // Skenario 6: Non-Bedah ICU <= 20jt
    return applyScenario(k, pat, settings.scenarioF);
  }
};

const calculateYanmasumFees = (pat: PatientClaim): FeeBreakdown => {
  const items = pat.itemsTindakan || [];
  let res: FeeBreakdown = {
    klaim: pat.nilaiKlaim, spesialis: 0, raberTotal: 0, anestesi: 0, gp: 0, paramOK: 0, paramICU: 0, 
    paramGen: 0, penataAnestesi: 0, konsul: 0, pengelola: 0, manajemen: 0, casemix: 0, bhp: 0, operasional: 0
  };
  items.forEach(item => {
    res.spesialis += item.jasaMedis || 0;
    res.anestesi += item.jasaAnestesi || 0;
    res.gp += item.jasaGP || 0;
    res.paramGen += item.jasaParamedis || 0;
    res.bhp += item.jasaBHP || 0;
    res.operasional += item.jasaRS || 0;
  });
  return res;
};

export const calculatePatientFees = (pat: PatientClaim, settings: BPJSCalcSettings): FeeBreakdown => {
  if (pat.kategoriPasien === 'YANMASUM' || pat.kategoriPasien === 'JASA_RAHARJA') {
    return calculateYanmasumFees(pat);
  }
  return calculateBPJSFees(pat, settings);
};
