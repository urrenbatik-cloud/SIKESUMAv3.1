
export const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
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
