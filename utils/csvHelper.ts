
export const exportToCSV = (filename: string, rows: string[][]) => {
  const processRow = (row: string[]) => {
    return row.map(val => {
      let cell = val === null || val === undefined ? '' : val.toString();
      // Apostrophe for numbers that should be strings in Excel
      if (/^\d{10,}$/.test(cell)) cell = `'${cell}`;
      if (cell.includes('"') || cell.includes(',') || cell.includes(';') || cell.includes('\n')) {
        cell = `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(';'); // Use semicolon for ID Excel
  };

  const csvContent = "\uFEFF" + rows.map(processRow).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
