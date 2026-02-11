import { useState, useEffect } from 'react';
import { DollarSign, Clock, TrendingUp, Plus, ChevronDown, ChevronUp, AlertCircle, Inbox } from 'lucide-react';
import api from '../api/api';
import { Card, Badge, Button, EmptyState } from '../components/shared';
import { Alert } from '../components/shared';
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
}

export default function MyPayments() {
  const [activeTab, setActiveTab] = useState<'kasbon' | 'wages'>('kasbon');
  const [kasbons, setKasbons] = useState<KasbonRecord[]>([]);
  const [wageRecords, setWageRecords] = useState<WageRecord[]>([]);
  const [wageSummary, setWageSummary] = useState<WageSummary | null>(null);
  const [loading, setLoading] = useState(true);
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
          Wages
        </button>
      </div>

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
                <label className="form-label">Amount (IDR)</label>
                <input
                  type="number"
                  className="form-input"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 500000"
                  min="0"
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
    </div>
  );
}
