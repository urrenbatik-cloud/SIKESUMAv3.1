
export const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

// [F3.6 v2] Indonesian month names untuk readable periode labels
export const BULAN_INDONESIA = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Format periode (month + year) ke "Bulan Tahun" Indonesian (e.g., "Mei 2025").
 * Replace numeric format "5/2025" yang less readable.
 * 
 * @param month — 1-12
 * @param year — full year (2025, 2026, etc.)
 * @returns "Mei 2025" format
 */
export const formatPeriode = (month: number, year: number): string => {
  const monthIdx = Math.max(1, Math.min(12, month)) - 1; // safe clamp
  return `${BULAN_INDONESIA[monthIdx]} ${year}`;
};

export const calculatePPH21 = (amount: number, status?: string) => {
  // Indonesian PPH 21 for Professionals: (50% x Gross) x 5% = 2.5% of Gross
  // Applying this generally to doctors and professionals as requested
  return (amount * 0.5) * 0.05;
};

export const getDiffDays = (dateStr: string) => {
  const start = new Date(dateStr);
  const end = new Date();
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);
  const days = diffDays % 30;
  return { years, months, days };
};
