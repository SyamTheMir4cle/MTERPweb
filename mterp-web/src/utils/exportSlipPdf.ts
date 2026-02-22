import { jsPDF } from 'jspdf';

/**
 * Generate a professional salary slip PDF using jsPDF (direct drawing).
 * No html2canvas, no DOM rendering — 100% reliable.
 */

interface SlipPdfData {
  slipNumber: string;
  workerName: string;
  workerRole: string;
  periodStart: string;
  periodEnd: string;
  attendance: {
    totalDays: number;
    presentDays: number;
    lateDays: number;
    absentDays: number;
    permitDays: number;
    totalHours: number;
  };
  earnings: {
    dailyRate: number;
    totalDailyWage: number;
    totalOvertime: number;
    bonus: number;
    deductions: number;
    kasbonDeduction: number;
    netPay: number;
  };
  paymentInfo?: {
    bankPlatform: string;
    bankAccount: string;
    accountName: string;
  };
  authorization: {
    directorName?: string;
    directorSignedAt?: string;
    ownerName?: string;
    ownerSignedAt?: string;
  };
  notes?: string;
}

const fmtRp = (v: number) => `Rp ${new Intl.NumberFormat('id-ID').format(v || 0)}`;
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

export function exportSlipToPdf(data: SlipPdfData) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pw = doc.internal.pageSize.getWidth();  // ~210mm
  const mx = 18; // margin
  const cw = pw - mx * 2; // content width
  let y = 20;

  // Colors
  const GREEN = [5, 150, 105] as const;
  const DARK = [26, 26, 46] as const;
  const GRAY = [100, 100, 100] as const;
  const LIGHT = [170, 170, 170] as const;
  const RED = [220, 38, 38] as const;

  // ====== HEADER ======
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GREEN);
  doc.text('SLIP GAJI', pw / 2, y, { align: 'center' });
  y += 6;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text('SALARY SLIP / BUKTI PEMBAYARAN GAJI', pw / 2, y, { align: 'center' });
  y += 5;

  doc.setFontSize(8);
  doc.setTextColor(...LIGHT);
  doc.text(data.slipNumber, pw / 2, y, { align: 'center' });
  y += 4;

  // Header line
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.8);
  doc.line(mx, y, pw - mx, y);
  y += 10;

  // ====== WORKER INFO ======
  const labelX = mx;
  const valX = mx + 35;

  const addInfoRow = (label: string, value: string, bold = false) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text(label, labelX, y);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(...DARK);
    doc.text(`: ${value}`, valX, y);
    y += 5.5;
  };

  addInfoRow('Nama Pekerja', data.workerName, true);
  addInfoRow('Jabatan', data.workerRole.charAt(0).toUpperCase() + data.workerRole.slice(1));
  addInfoRow('Periode', `${fmtDate(data.periodStart)} — ${fmtDate(data.periodEnd)}`, true);

  if (data.paymentInfo?.bankPlatform) {
    addInfoRow('Rekening', `${data.paymentInfo.bankPlatform} — ${data.paymentInfo.bankAccount} (a/n ${data.paymentInfo.accountName})`);
  }

  y += 4;

  // ====== SECTION: ATTENDANCE ======
  const sectionTitle = (title: string) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GREEN);
    doc.text(title.toUpperCase(), mx, y);
    y += 2;
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.line(mx, y, pw - mx, y);
    y += 5;
  };

  sectionTitle('Ringkasan Kehadiran');

  // Attendance grid
  const att = data.attendance;
  const attItems = [
    { label: 'Total Hari', val: String(att.totalDays), color: DARK },
    { label: 'Hadir', val: String(att.presentDays), color: GREEN },
    { label: 'Terlambat', val: String(att.lateDays), color: [217, 119, 6] as const },
    { label: 'Absen', val: String(att.absentDays), color: RED },
    { label: 'Izin', val: String(att.permitDays), color: [124, 58, 237] as const },
    { label: 'Jam', val: `${att.totalHours}h`, color: DARK },
  ];

  const cellW = cw / attItems.length;
  const cellH = 14;
  const cellY = y;

  // Background
  doc.setFillColor(249, 250, 251);
  doc.rect(mx, cellY - 3, cw, cellH, 'F');

  attItems.forEach((item, i) => {
    const cx = mx + i * cellW + cellW / 2;
    // Border
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.rect(mx + i * cellW, cellY - 3, cellW, cellH, 'S');
    // Value
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...(item.color as [number, number, number]));
    doc.text(item.val, cx, cellY + 2, { align: 'center' });
    // Label
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...LIGHT);
    doc.text(item.label, cx, cellY + 7, { align: 'center' });
  });

  y = cellY + cellH + 6;

  // ====== SECTION: EARNINGS ======
  sectionTitle('Rincian Penghasilan');

  const workDays = att.presentDays + att.lateDays;
  const earn = data.earnings;

  const addEarningRow = (label: string, value: string, color: readonly [number, number, number] = DARK, bold = false) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text(label, mx, y);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(...color);
    doc.text(value, pw - mx, y, { align: 'right' });
    y += 5.5;
  };

  addEarningRow('Upah Harian', fmtRp(earn.dailyRate));
  addEarningRow(`Total Upah Harian (${workDays} hari)`, fmtRp(earn.totalDailyWage));
  addEarningRow('Lembur', fmtRp(earn.totalOvertime), GREEN);

  if (earn.bonus > 0) {
    addEarningRow('Bonus', fmtRp(earn.bonus), GREEN);
  }

  // Dashed separator
  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([2, 1.5], 0);
  doc.line(mx, y, pw - mx, y);
  doc.setLineDashPattern([], 0);
  y += 5;

  if (earn.deductions > 0) {
    addEarningRow('Potongan', `-${fmtRp(earn.deductions)}`, RED);
  }
  if (earn.kasbonDeduction > 0) {
    addEarningRow('Potongan Kasbon', `-${fmtRp(earn.kasbonDeduction)}`, RED);
  }

  // Net pay line
  doc.setDrawColor(...DARK);
  doc.setLineWidth(0.5);
  doc.line(mx, y, pw - mx, y);
  y += 7;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text('GAJI BERSIH', mx, y);
  doc.text(fmtRp(earn.netPay), pw - mx, y, { align: 'right' });
  y += 8;

  // ====== NOTES ======
  if (data.notes) {
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(mx, y - 3, cw, 10, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text(`Catatan: ${data.notes}`, mx + 4, y + 2);
    y += 14;
  }

  // ====== AUTHORIZATION ======
  y += 2;
  sectionTitle('Otorisasi Digital');

  const halfW = cw / 2;
  const boxH = 28;

  // Director box
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.rect(mx, y - 2, halfW, boxH, 'S');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...LIGHT);
  doc.text('DIREKTUR', mx + halfW / 2, y + 3, { align: 'center' });

  if (data.authorization.directorName) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text(data.authorization.directorName, mx + halfW / 2, y + 10, { align: 'center' });
    if (data.authorization.directorSignedAt) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...LIGHT);
      doc.text(fmtDate(data.authorization.directorSignedAt), mx + halfW / 2, y + 15, { align: 'center' });
    }
    doc.setFontSize(7);
    doc.setTextColor(...GREEN);
    doc.text('✓ Ditandatangani', mx + halfW / 2, y + 21, { align: 'center' });
  } else {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...LIGHT);
    doc.text('Menunggu tanda tangan', mx + halfW / 2, y + 12, { align: 'center' });
  }

  // Owner box
  doc.rect(mx + halfW, y - 2, halfW, boxH, 'S');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...LIGHT);
  doc.text('OWNER', mx + halfW + halfW / 2, y + 3, { align: 'center' });

  if (data.authorization.ownerName) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text(data.authorization.ownerName, mx + halfW + halfW / 2, y + 10, { align: 'center' });
    if (data.authorization.ownerSignedAt) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...LIGHT);
      doc.text(fmtDate(data.authorization.ownerSignedAt), mx + halfW + halfW / 2, y + 15, { align: 'center' });
    }
    doc.setFontSize(7);
    doc.setTextColor(...GREEN);
    doc.text('✓ Ditandatangani', mx + halfW + halfW / 2, y + 21, { align: 'center' });
  } else {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...LIGHT);
    doc.text('Menunggu tanda tangan', mx + halfW + halfW / 2, y + 12, { align: 'center' });
  }

  y += boxH + 8;

  // ====== FOOTER ======
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.line(mx, y, pw - mx, y);
  y += 5;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...LIGHT);
  doc.text(
    `Dokumen ini digenerate secara digital oleh sistem MTERP · ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    pw / 2,
    y,
    { align: 'center' }
  );

  // Save
  const filename = `SlipGaji_${data.workerName.replace(/\s+/g, '_')}_${data.slipNumber}.pdf`;
  doc.save(filename);
}
