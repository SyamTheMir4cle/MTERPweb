import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, Clock, TrendingUp, Plus, ChevronDown, ChevronUp, AlertCircle,
  Inbox, User, Wallet, Receipt, X, Calendar, CreditCard, Shield,
  CheckCircle2, Lock, Unlock, FileText, Briefcase, Download,
} from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, Badge, Button, EmptyState, CostInput } from '../components/shared';
import { Alert } from '../components/shared';
import { exportSlipToPdf } from '../utils/exportSlipPdf';
import './MyPayments.css';

interface KasbonRecord {
  _id: string;
  amount: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Paid';
  approvedBy?: { fullName: string };
  approvedAt?: string;
  paidAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

interface WageRecord {
  _id: string;
  date: string;
  wageType: string;
  wageMultiplier: number;
  status: string;
  checkIn?: { time: string };
  checkOut?: { time: string };
  projectId?: { nama: string };
}

interface WageSummary {
  total: number;
  present: number;
  late: number;
  totalHours: number;
  wageMultiplierTotal: number;
  totalPayment?: number;
}

interface MySlip {
  _id: string;
  slipNumber: string;
  workerId: { fullName: string; role: string };
  period: { startDate?: string; endDate?: string; month?: number; year?: number };
  attendanceSummary: {
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
  workerPaymentInfo: { bankAccount: string; bankPlatform: string; accountName: string };
  authorization: {
    directorName: string;
    directorSignedAt: string;
    ownerName: string;
    ownerSignedAt: string;
    directorPassphrase: string;
    ownerPassphrase: string;
  };
  status: string;
  notes: string;
  createdAt: string;
}

const formatRp = (v: number) => `Rp ${new Intl.NumberFormat('id-ID').format(v || 0)}`;
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const fmtPeriod = (p: { startDate?: string; endDate?: string; month?: number; year?: number }) => {
  if (p.startDate && p.endDate) return `${fmtDate(p.startDate)} — ${fmtDate(p.endDate)}`;
  if (p.month && p.year) return `${MONTHS_SHORT[(p.month || 1) - 1]} ${p.year}`;
  return 'N/A';
};

export default function MyPayments() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'kasbon' | 'wages' | 'slip'>('kasbon');
  const [kasbons, setKasbons] = useState<KasbonRecord[]>([]);
  const [wageRecords, setWageRecords] = useState<WageRecord[]>([]);
  const [wageSummary, setWageSummary] = useState<WageSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Slip gaji state
  const [mySlips, setMySlips] = useState<MySlip[]>([]);
  const [slipLoading, setSlipLoading] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState<MySlip | null>(null);
  const [slipDetailOpen, setSlipDetailOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Kasbon form
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alertData, setAlertData] = useState<{ visible: boolean; type: 'success' | 'error'; title: string; message: string }>({
    visible: false,
    type: 'success',
    title: '',
    message: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setError(null);
      setLoading(true);

      // Get current month range
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

      const [kasbonRes, wageRes] = await Promise.all([
        api.get('/kasbon'),
        api.get(`/attendance/recap?startDate=${startDate}&endDate=${endDate}`),
      ]);

      setKasbons(kasbonRes.data);
      setWageRecords(wageRes.data.records || []);
      setWageSummary(wageRes.data.summary || null);
    } catch (err: any) {
      console.error('Failed to fetch data', err);
      setError(err.response?.data?.msg || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch my slips when tab is active
  const fetchMySlips = useCallback(async () => {
    setSlipLoading(true);
    try {
      const res = await api.get('/slipgaji/my');
      setMySlips(res.data);
    } catch { /* empty */ }
    setSlipLoading(false);
  }, []);

  useEffect(() => {
    if (activeTab === 'slip') fetchMySlips();
  }, [activeTab, fetchMySlips]);

  const handleSubmitKasbon = async () => {
    if (!amount || Number(amount) <= 0) return;

    setSubmitting(true);
    try {
      await api.post('/kasbon', {
        amount: Number(amount),
        reason,
      });
      setAmount('');
      setReason('');
      setShowForm(false);
      setAlertData({
        visible: true,
        type: 'success',
        title: 'Kasbon Submitted',
        message: 'Your cash advance request has been submitted for approval.',
      });
      fetchData();
    } catch (err: any) {
      setAlertData({
        visible: true,
        type: 'error',
        title: 'Submit Failed',
        message: err.response?.data?.msg || 'Failed to submit kasbon request.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'warning' | 'success' | 'danger' | 'primary'> = {
      Pending: 'warning',
      Approved: 'success',
      Rejected: 'danger',
      Paid: 'primary',
    };
    return <Badge label={status.toUpperCase()} variant={variants[status] || 'neutral'} size="small" />;
  };

  const getWageLabel = (wageType: string) => {
    const labels: Record<string, string> = {
      daily: 'Daily',
      'overtime_1.5': 'OT 1.5x',
      'overtime_2': 'OT 2x',
    };
    return labels[wageType] || wageType;
  };

  const getWageBadge = (wageType: string) => {
    const variants: Record<string, 'primary' | 'warning' | 'danger'> = {
      daily: 'primary',
      'overtime_1.5': 'warning',
      'overtime_2': 'danger',
    };
    return <Badge label={getWageLabel(wageType)} variant={variants[wageType] || 'neutral'} size="small" />;
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '-';
    return new Date(timeStr).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalKasbonPending = kasbons.filter(k => k.status === 'Pending').reduce((sum, k) => sum + k.amount, 0);
  const totalKasbonApproved = kasbons.filter(k => k.status === 'Approved' || k.status === 'Paid').reduce((sum, k) => sum + k.amount, 0);

  return (
    <div className="mypayments-container">
      <Alert
        visible={alertData.visible}
        type={alertData.type}
        title={alertData.title}
        message={alertData.message}
        onClose={() => setAlertData({ ...alertData, visible: false })}
      />

      {/* Header */}
      <div className="mypayments-header">
        <h1 className="mypayments-title">My Payments</h1>
      </div>

      {/* Tabs */}
      <div className="mypayments-tabs">
        <button
          className={`mypayments-tab ${activeTab === 'kasbon' ? 'active' : ''}`}
          onClick={() => setActiveTab('kasbon')}
        >
          <DollarSign size={16} />
          Kasbon
        </button>
        <button
          className={`mypayments-tab ${activeTab === 'wages' ? 'active' : ''}`}
          onClick={() => setActiveTab('wages')}
        >
          <TrendingUp size={16} />
          Add Request
        </button>
        <button
          className={`mypayments-tab ${activeTab === 'slip' ? 'active' : ''}`}
          onClick={() => setActiveTab('slip')}
        >
          <Receipt size={16} />
          Slip Gaji
        </button>
      </div>

      {/* Slip Gaji / Summary Card */}
      <Card className="summary-card" style={{ marginBottom: 20, background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <User size={20} style={{ opacity: 0.9 }} />
              <span style={{ fontSize: '1.2em', fontWeight: 600 }}>{user?.fullName}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Badge label={user?.role || 'User'} variant="neutral" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }} />
              <span style={{ fontSize: '0.9em', opacity: 0.8 }}>Period: This Month</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginBottom: 4, opacity: 0.9 }}>
              <Wallet size={16} />
              <span style={{ fontSize: '0.9em' }}>Total Earnings</span>
            </div>
            <span style={{ fontSize: '1.5em', fontWeight: 700 }}>
              Rp {new Intl.NumberFormat('id-ID').format(wageSummary?.totalPayment || 0)}
            </span>
          </div>
        </div>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="mypayments-loading">
          <div className="spinner"></div>
          <span>Loading...</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <EmptyState icon={AlertCircle} title="Error" description={error} />
      )}

      {/* ===== KASBON TAB ===== */}
      {!loading && !error && activeTab === 'kasbon' && (
        <div className="mypayments-content">
          {/* Kasbon Summary Cards */}
          <div className="summary-cards">
            <div className="summary-card pending">
              <span className="summary-card-label">Pending</span>
              <span className="summary-card-value">{formatCurrency(totalKasbonPending)}</span>
            </div>
            <div className="summary-card approved">
              <span className="summary-card-label">Approved / Paid</span>
              <span className="summary-card-value">{formatCurrency(totalKasbonApproved)}</span>
            </div>
          </div>

          {/* New Kasbon Button */}
          <Button
            title={showForm ? 'Cancel' : 'Request Kasbon'}
            icon={showForm ? ChevronUp : Plus}
            onClick={() => setShowForm(!showForm)}
            variant={showForm ? 'secondary' : 'primary'}
            size="medium"
          />

          {/* Kasbon Form */}
          {showForm && (
            <Card className="kasbon-form-card">
              <h3 className="form-title">New Kasbon Request</h3>
              <div className="form-group">
                <CostInput
                  label="Amount (IDR)"
                  placeholder="e.g. 500000"
                  value={Number(amount) || 0}
                  onChange={(v) => setAmount(v.toString())}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Reason</label>
                <textarea
                  className="form-textarea"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why do you need this advance?"
                  rows={3}
                />
              </div>
              <Button
                title={submitting ? 'Submitting...' : 'Submit Request'}
                onClick={handleSubmitKasbon}
                variant="success"
                size="medium"
                loading={submitting}
              />
            </Card>
          )}

          {/* Kasbon List */}
          <h2 className="section-label">Request History</h2>
          {kasbons.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No Kasbon Requests"
              description="You haven't submitted any cash advance requests yet."
            />
          ) : (
            <div className="records-list">
              {kasbons.map((k) => (
                <Card key={k._id} className={`record-card kasbon-status-${k.status.toLowerCase()}`}>
                  <div className="record-header">
                    <span className="record-date">{formatDate(k.createdAt)}</span>
                    {getStatusBadge(k.status)}
                  </div>
                  <div className="record-amount">{formatCurrency(k.amount)}</div>
                  {k.reason && <p className="record-reason">{k.reason}</p>}
                  {k.rejectionReason && (
                    <p className="record-rejection">
                      <strong>Rejected:</strong> {k.rejectionReason}
                    </p>
                  )}
                  {k.approvedBy && (
                    <span className="record-meta">
                      Approved by {k.approvedBy.fullName}
                      {k.approvedAt && ` • ${formatDate(k.approvedAt)}`}
                    </span>
                  )}
                  {k.paidAt && (
                    <span className="record-meta paid">Paid on {formatDate(k.paidAt)}</span>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== WAGES TAB ===== */}
      {!loading && !error && activeTab === 'wages' && (
        <div className="mypayments-content">
          {/* Wage Summary */}
          {wageSummary && (
            <div className="summary-cards">
              <div className="summary-card wage-days">
                <span className="summary-card-label">Days Worked</span>
                <span className="summary-card-value">{wageSummary.present + wageSummary.late}</span>
              </div>
              <div className="summary-card wage-hours">
                <span className="summary-card-label">Total Hours</span>
                <span className="summary-card-value">{wageSummary.totalHours.toFixed(1)}h</span>
              </div>
              <div className="summary-card wage-multiplier">
                <span className="summary-card-label">Wage Multiplier</span>
                <span className="summary-card-value">{wageSummary.wageMultiplierTotal.toFixed(1)}x</span>
              </div>
            </div>
          )}

          <h2 className="section-label">
            <Clock size={16} />
            This Month's Wage Records
          </h2>

          {wageRecords.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No Records"
              description="No attendance records found for this month."
            />
          ) : (
            <div className="records-list">
              {wageRecords.map((r) => (
                <Card key={r._id} className="record-card wage-card">
                  <div className="record-header">
                    <span className="record-date">{formatDate(r.date)}</span>
                    {getWageBadge(r.wageType)}
                  </div>
                  <div className="wage-details">
                    <div className="wage-detail">
                      <span className="wage-detail-label">Check In</span>
                      <span className="wage-detail-value">{formatTime(r.checkIn?.time)}</span>
                    </div>
                    <div className="wage-detail">
                      <span className="wage-detail-label">Check Out</span>
                      <span className="wage-detail-value">{formatTime(r.checkOut?.time)}</span>
                    </div>
                    <div className="wage-detail">
                      <span className="wage-detail-label">Multiplier</span>
                      <span className="wage-detail-value multiplier">{r.wageMultiplier}x</span>
                    </div>
                  </div>
                  {r.projectId && (
                    <span className="record-meta">{r.projectId.nama}</span>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== SLIP GAJI TAB ===== */}
      {!loading && !error && activeTab === 'slip' && (
        <div className="mypayments-content">
          {slipLoading ? (
            <div className="mypayments-loading">
              <div className="spinner"></div>
              <span>Loading slips…</span>
            </div>
          ) : mySlips.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No Salary Slips"
              description="No authorized salary slips have been issued to you yet."
            />
          ) : (
            <div className="records-list">
              {mySlips.map((slip) => (
                <Card
                  key={slip._id}
                  className="record-card slip-card"
                  onClick={() => { setSelectedSlip(slip); setSlipDetailOpen(true); }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="record-header">
                    <span className="record-date">
                      <Calendar size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                      {fmtPeriod(slip.period)}
                    </span>
                    <Badge
                      label={slip.status.toUpperCase()}
                      variant={slip.status === 'authorized' ? 'success' : 'primary'}
                      size="small"
                    />
                  </div>
                  <div className="record-amount">{formatRp(slip.earnings.netPay)}</div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                    <span className="record-meta">
                      <Clock size={12} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                      {slip.attendanceSummary.presentDays} days
                    </span>
                    <span className="record-meta" style={{ fontFamily: 'monospace', fontSize: '0.75em' }}>
                      {slip.slipNumber}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== SLIP DETAIL MODAL ===== */}
      {slipDetailOpen && selectedSlip && (
        <div className="modal-overlay" onClick={() => setSlipDetailOpen(false)}>
          <div className="sg-modal sg-modal-detail" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-white)', borderRadius: 16, width: '92%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 48px rgba(0,0,0,0.18)', animation: 'sg-modal-in 0.25s ease-out' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 20px 0' }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #059669, #34D399)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={20} color="white" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1em', fontWeight: 700, margin: 0 }}>Salary Slip</h3>
                <p style={{ fontSize: '0.75em', color: 'var(--text-muted)', margin: 0 }}>{selectedSlip.slipNumber}</p>
              </div>
              <button
                onClick={() => setSlipDetailOpen(false)}
                style={{ marginLeft: 'auto', width: 32, height: 32, border: 'none', background: 'var(--bg-secondary)', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Worker Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #818CF8)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1em' }}>
                  {selectedSlip.workerId?.fullName?.[0]?.toUpperCase() || 'W'}
                </div>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '1em' }}>{selectedSlip.workerId?.fullName}</span><br />
                  <span style={{ fontSize: '0.75em', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{selectedSlip.workerId?.role}</span>
                </div>
              </div>

              {/* Period */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85em', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '8px 14px', borderRadius: 8 }}>
                <Calendar size={14} />
                Period: {fmtPeriod(selectedSlip.period)}
              </div>

              {/* Payment Info */}
              {selectedSlip.workerPaymentInfo?.bankPlatform && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85em', color: 'var(--text-secondary)', background: '#F0F9FF', padding: '8px 14px', borderRadius: 8 }}>
                  <CreditCard size={14} />
                  {selectedSlip.workerPaymentInfo.bankPlatform} — {selectedSlip.workerPaymentInfo.bankAccount}
                  <span style={{ marginLeft: 'auto', fontStyle: 'italic', color: 'var(--text-muted)' }}>a/n {selectedSlip.workerPaymentInfo.accountName}</span>
                </div>
              )}

              {/* Attendance Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {[
                  { val: selectedSlip.attendanceSummary.totalDays, label: 'Total Days', color: '' },
                  { val: selectedSlip.attendanceSummary.presentDays, label: 'Present', color: '#059669' },
                  { val: selectedSlip.attendanceSummary.lateDays, label: 'Late', color: '#D97706' },
                  { val: selectedSlip.attendanceSummary.absentDays, label: 'Absent', color: '#DC2626' },
                  { val: selectedSlip.attendanceSummary.permitDays, label: 'Permit', color: '#7C3AED' },
                  { val: `${selectedSlip.attendanceSummary.totalHours}h`, label: 'Hours', color: '' },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: 'center', padding: 10, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                    <span style={{ display: 'block', fontSize: '1.1em', fontWeight: 700, color: s.color || 'var(--text-primary)' }}>{s.val}</span>
                    <span style={{ fontSize: '0.6em', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.3 }}>{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Earnings Table */}
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 16 }}>
                <h4 style={{ fontSize: '0.7em', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 10px 0' }}>Earnings Breakdown</h4>
                {[
                  { label: 'Daily Rate', value: formatRp(selectedSlip.earnings.dailyRate) },
                  { label: `Daily Wages (${selectedSlip.attendanceSummary.presentDays + selectedSlip.attendanceSummary.lateDays} days)`, value: formatRp(selectedSlip.earnings.totalDailyWage) },
                  { label: 'Overtime', value: formatRp(selectedSlip.earnings.totalOvertime), color: '#059669' },
                  ...(selectedSlip.earnings.bonus > 0 ? [{ label: 'Bonus', value: formatRp(selectedSlip.earnings.bonus), color: '#059669' }] : []),
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '0.85em', color: 'var(--text-secondary)' }}>
                    <span>{row.label}</span>
                    <span style={{ color: row.color || 'inherit' }}>{row.value}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px dashed var(--border)', margin: '6px 0' }} />
                {selectedSlip.earnings.deductions > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '0.85em', color: '#DC2626' }}>
                    <span>Deductions</span><span>-{formatRp(selectedSlip.earnings.deductions)}</span>
                  </div>
                )}
                {selectedSlip.earnings.kasbonDeduction > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '0.85em', color: '#DC2626' }}>
                    <span>Kasbon</span><span>-{formatRp(selectedSlip.earnings.kasbonDeduction)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '2px solid var(--text-primary)', fontSize: '1em', fontWeight: 800 }}>
                  <span>Net Pay</span><span>{formatRp(selectedSlip.earnings.netPay)}</span>
                </div>
              </div>

              {/* Authorization Signatures */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { role: 'Director', name: selectedSlip.authorization.directorName, date: selectedSlip.authorization.directorSignedAt, signed: !!selectedSlip.authorization.directorPassphrase },
                  { role: 'Owner', name: selectedSlip.authorization.ownerName, date: selectedSlip.authorization.ownerSignedAt, signed: !!selectedSlip.authorization.ownerPassphrase },
                ].map((sig, i) => (
                  <div key={i} style={{
                    border: `1px ${sig.signed ? 'solid #D1FAE5' : 'dashed var(--border-light)'}`,
                    background: sig.signed ? '#F0FDF4' : 'var(--bg-secondary)',
                    borderRadius: 8, padding: 14, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: sig.signed ? '#D1FAE5' : 'var(--border-light)', color: sig.signed ? '#059669' : 'var(--text-muted)',
                    }}>
                      {sig.signed ? <Unlock size={16} /> : <Lock size={16} />}
                    </div>
                    <span style={{ fontSize: '0.7em', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>{sig.role}</span>
                    {sig.signed ? (
                      <>
                        <span style={{ fontSize: '0.8em', fontWeight: 600 }}>{sig.name}</span>
                        <span style={{ fontSize: '0.65em', color: 'var(--text-muted)' }}>
                          {new Date(sig.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <CheckCircle2 size={12} color="#059669" />
                      </>
                    ) : (
                      <span style={{ fontSize: '0.75em', color: 'var(--text-muted)', fontStyle: 'italic' }}>Pending</span>
                    )}
                  </div>
                ))}
              </div>

              {selectedSlip.notes && (
                <div style={{ fontSize: '0.85em', color: 'var(--text-secondary)', padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  <strong>Notes:</strong> {selectedSlip.notes}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '0 20px 20px' }}>
              <button
                onClick={() => setSlipDetailOpen(false)}
                style={{ padding: '10px 20px', border: '1px solid var(--border)', background: 'var(--bg-white)', borderRadius: 8, fontSize: '0.85em', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                Close
              </button>
              <button
                onClick={() => exportSlipToPdf({
                  slipNumber: selectedSlip.slipNumber,
                  workerName: selectedSlip.workerId?.fullName || 'Worker',
                  workerRole: selectedSlip.workerId?.role || '',
                  periodStart: selectedSlip.period.startDate || '',
                  periodEnd: selectedSlip.period.endDate || '',
                  attendance: selectedSlip.attendanceSummary,
                  earnings: selectedSlip.earnings,
                  paymentInfo: selectedSlip.workerPaymentInfo,
                  authorization: {
                    directorName: selectedSlip.authorization.directorName || undefined,
                    directorSignedAt: selectedSlip.authorization.directorSignedAt || undefined,
                    ownerName: selectedSlip.authorization.ownerName || undefined,
                    ownerSignedAt: selectedSlip.authorization.ownerSignedAt || undefined,
                  },
                  notes: selectedSlip.notes,
                })}
                style={{ padding: '10px 20px', border: 'none', background: 'linear-gradient(135deg, #059669, #34D399)', borderRadius: 8, fontSize: '0.85em', fontWeight: 600, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Download size={14} /> Export PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
