import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, User, Clock, Filter, 
  ChevronDown, DollarSign, X, Check, Building
} from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, Badge, Button, EmptyState, CostInput } from '../components/shared';
import './AttendanceLogs.css';

interface UserOption {
  _id: string;
  fullName: string;
  role: string;
}

interface AttendanceRecord {
  _id: string;
  userId: { _id: string; fullName: string; role: string };
  date: string;
  checkIn?: { time: string; photo?: string };
  checkOut?: { time: string; photo?: string };
  wageType: string;
  wageMultiplier: number;
  dailyRate: number;
  hourlyRate: number;
  overtimePay: number;
  paymentStatus: 'Unpaid' | 'Paid';
  paidAt?: string;
  projectId?: { _id: string; nama: string };
  status: string;
}

interface RecapSummary {
  total: number;
  present: number;
  late: number;
  absent: number;
  totalHours: number;
  wageMultiplierTotal: number;
  totalPayment: number;
}

const WAGE_OPTIONS = [
  { label: 'Harian Biasa', value: 'daily', multiplier: 1 },
  { label: 'Lembur 1.5x', value: 'overtime_1.5', multiplier: 1.5 },
  { label: 'Lembur 2x', value: 'overtime_2', multiplier: 2 },
];

export default function AttendanceLogs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<RecapSummary | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'custom'>('week');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'All' | 'Unpaid' | 'Paid'>('Unpaid');
  
  // Wage modal
  const [wageModal, setWageModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [newWageType, setNewWageType] = useState('daily');
  const [newDailyRate, setNewDailyRate] = useState<number>(0);
  const [newOvertimePay, setNewOvertimePay] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [paying, setPaying] = useState(false);

  const isSupervisor = user?.role && ['owner', 'director', 'supervisor'].includes(user.role);

  useEffect(() => {
    // Set default date range (this week)
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    setStartDate(weekStart.toISOString().split('T')[0]);
    setEndDate(now.toISOString().split('T')[0]);
    
    fetchUsers();
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchRecords();
    }
    if (startDate && endDate) {
      fetchRecords();
    }
  }, [startDate, endDate, selectedUser, paymentStatus]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/attendance/users');
      setUsers(response.data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params: any = { startDate, endDate };
      if (selectedUser) params.userId = selectedUser;
      
      const response = await api.get('/attendance/recap', { params });
      
      let fetchedRecords = response.data.records;
      
      // Client-side filter for payment status if backend doesn't support it directly yet
      if (paymentStatus !== 'All') {
        fetchedRecords = fetchedRecords.filter((r: AttendanceRecord) => 
          (r.paymentStatus || 'Unpaid') === paymentStatus
        );
      }

      setRecords(fetchedRecords);
      setSummary(response.data.summary);
    } catch (err) {
      console.error('Failed to fetch attendance', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (range: 'week' | 'month' | 'custom') => {
    setDateRange(range);
    const now = new Date();
    
    if (range === 'week') {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      setStartDate(weekStart.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (range === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(monthStart.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    }
    // For custom, user sets dates manually
  };

  const openWageModal = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setNewWageType(record.wageType);
    setNewDailyRate(record.dailyRate || 0);
    setNewOvertimePay(record.overtimePay || 0);
    setWageModal(true);
  };

  const calculateAutoOvertime = (rate: number, type: string) => {
    if (!selectedRecord?.checkIn?.time || !selectedRecord?.checkOut?.time) return 0;
    if (!type.startsWith('overtime')) return 0;
    
    const start = new Date(selectedRecord.checkIn.time).getTime();
    const end = new Date(selectedRecord.checkOut.time).getTime();
    const durationHours = Math.max(0, (end - start) / (1000 * 60 * 60));
    
    const hourlyRate = rate / 8;
    const multiplier = type === 'overtime_1.5' ? 1.5 : (type === 'overtime_2' ? 2 : 1);
    
    return Math.round(durationHours * hourlyRate * multiplier);
  };

  const handleRateChange = (val: number) => {
    setNewDailyRate(val);
    const newOvertime = calculateAutoOvertime(val, newWageType);
    setNewOvertimePay(newOvertime);
  };

  const handleTypeChange = (val: string) => {
    setNewWageType(val);
    const newOvertime = calculateAutoOvertime(newDailyRate, val);
    setNewOvertimePay(newOvertime);
  };

  const handleSaveWage = async () => {
    if (!selectedRecord) return;
    
    setSubmitting(true);
    try {
      await api.put(`/attendance/${selectedRecord._id}/rate`, { 
        wageType: newWageType,
        dailyRate: newDailyRate,
        overtimePay: newOvertimePay,
      });
      await fetchRecords();
      setWageModal(false);
      setSelectedRecord(null);
    } catch (err) {
      console.error('Failed to update wage', err);
      alert('Failed to update wage type');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (records.length === 0) return;
    const unpaidIds = records.filter(r => r.paymentStatus !== 'Paid').map(r => r._id);
    if (unpaidIds.length === 0) {
      alert('No unpaid records to pay.');
      return;
    }

    if (!window.confirm(`Mark ${unpaidIds.length} records as PAID? Total: Rp ${new Intl.NumberFormat('id-ID').format(summary?.totalPayment || 0)}`)) return;

    setPaying(true);
    try {
      await api.post('/attendance/pay', { attendanceIds: unpaidIds });
      await fetchRecords(); // Refresh to see updated status
    } catch (err) {
      console.error('Payment failed', err);
      alert('Failed to mark as paid');
    } finally {
      setPaying(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getWageLabel = (wageType: string) => {
    const option = WAGE_OPTIONS.find(o => o.value === wageType);
    return option?.label || wageType;
  };

  const getWageBadge = (wageType: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
      'daily': 'neutral',
      'overtime_1.5': 'warning',
      'overtime_2': 'danger',
    };
    return <Badge label={getWageLabel(wageType)} variant={variants[wageType] || 'neutral'} size="small" />;
  };

  return (
    <div className="logs-container">
      {/* Header */}
      <div className="logs-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="logs-title">Attendance Logs</h1>
          <p className="logs-subtitle">View and manage attendance records</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="filters-card">
        <div className="filters-row">
          <div className="filter-group">
            <label className="filter-label">Date Range</label>
            <div className="date-range-tabs">
              <button 
                className={`tab ${dateRange === 'week' ? 'active' : ''}`}
                onClick={() => handleDateRangeChange('week')}
              >
                This Week
              </button>
              <button 
                className={`tab ${dateRange === 'month' ? 'active' : ''}`}
                onClick={() => handleDateRangeChange('month')}
              >
                This Month
              </button>
              <button 
                className={`tab ${dateRange === 'custom' ? 'active' : ''}`}
                onClick={() => handleDateRangeChange('custom')}
              >
                Custom
              </button>
            </div>
          </div>
        </div>

        {dateRange === 'custom' && (
          <div className="custom-dates">
            <div className="date-input-group">
              <label>Start Date</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="date-input"
              />
            </div>
            <div className="date-input-group">
              <label>End Date</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="date-input"
              />
            </div>
          </div>
        )}

        {users.length > 0 && (
          <div className="filter-group" style={{ marginTop: 'var(--space-4)' }}>
            <label className="filter-label">Filter by User</label>
            <div className="select-wrapper">
              <select 
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="form-select"
              >
                <option value="">All Users</option>
                {users.map(u => (
                  <option key={u._id} value={u._id}>{u.fullName} ({u.role})</option>
                ))}
              </select>
              <ChevronDown size={16} className="select-icon" />
            </div>
          </div>
        )}

        <div className="filter-group">
          <label className="filter-label">Payment Status</label>
          <div className="select-wrapper">
            <select 
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value as any)}
              className="form-select"
            >
              <option value="Unpaid">Unpaid</option>
              <option value="Paid">Paid</option>
              <option value="All">All</option>
            </select>
            <ChevronDown size={16} className="select-icon" />
          </div>
        </div>
      </Card>

      {/* Summary */}
      {summary && (
        <Card className="summary-card">
          <h3 className="summary-title">Summary</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-value">{summary.total}</span>
              <span className="summary-label">Total Days</span>
            </div>
            <div className="summary-item success">
              <span className="summary-value">{summary.present}</span>
              <span className="summary-label">Present</span>
            </div>
            <div className="summary-item warning">
              <span className="summary-value">{summary.totalHours.toFixed(1)}</span>
              <span className="summary-label">Total Hours</span>
            </div>
            <div className="summary-item info">
              <span className="summary-value">{summary.wageMultiplierTotal.toFixed(1)}x</span>
              <span className="summary-label">Wage Total</span>
            </div>
            
            <div className="summary-item" style={{ borderLeft: '4px solid var(--primary)' }}>
              <span className="summary-value" style={{ color: 'var(--primary)', fontSize: '1.2em' }}>
                Rp {new Intl.NumberFormat('id-ID').format(summary.totalPayment || 0)}
              </span>
              <span className="summary-label">Total Payment</span>
            </div>
          </div>

          {isSupervisor && paymentStatus === 'Unpaid' && (summary.totalPayment || 0) > 0 && (
            <div className="pay-action" style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                title="Mark All as Paid"
                icon={Check}
                onClick={handleMarkAsPaid}
                loading={paying}
                variant="primary"
              />
            </div>
          )}
        </Card>
      )}

      {/* Records List */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <span>Loading records...</span>
        </div>
      ) : records.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No Records Found"
          description="No attendance records found for the selected date range."
        />
      ) : (
        <div className="records-list">
          {records.map((record) => (
            <Card key={record._id} className="record-card">
              <div className="record-header">
                <div className="record-date">
                  <Calendar size={16} />
                  <span>{formatDate(record.date)}</span>
                </div>
                {getWageBadge(record.wageType)}
              </div>
              
              <div className="record-user">
                <User size={16} />
                <span>{record.userId.fullName}</span>
                <Badge label={record.userId.role} variant="neutral" size="small" />
              </div>

              <div className="record-times">
                <div className="time-item">
                  <Clock size={14} />
                  <span>In: {record.checkIn?.time ? formatTime(record.checkIn.time) : '--:--'}</span>
                </div>
                <div className="time-item">
                  <Clock size={14} />
                  <span>Out: {record.checkOut?.time ? formatTime(record.checkOut.time) : '--:--'}</span>
                </div>
                </div>

              {/* Rate & Payment Info */}
              <div className="record-financials" style={{ marginTop: 8, fontSize: '0.9em', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Daily: Rp {new Intl.NumberFormat('id-ID').format(record.dailyRate || 0)}</span>
                  <span>Overtime: Rp {new Intl.NumberFormat('id-ID').format(record.overtimePay || 0)}</span>
                </div>
                {record.projectId && (
                  <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Building size={12} />
                    <span>{record.projectId.nama}</span>
                  </div>
                )}
                <div style={{ marginTop: 4 }}>
                  <Badge 
                    label={record.paymentStatus || 'Unpaid'} 
                    variant={record.paymentStatus === 'Paid' ? 'success' : 'warning'} 
                    size="small" 
                  />
                </div>
              </div>

              {isSupervisor && (
                <div className="record-actions">
                  <Button
                    title="Set Wage Type"
                    icon={DollarSign}
                    onClick={() => openWageModal(record)}
                    variant="outline"
                    size="small"
                  />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Wage Modal */}
      {wageModal && selectedRecord && (
        <div className="modal-overlay" onClick={() => setWageModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Set Wage Type</h2>
              <button className="modal-close" onClick={() => setWageModal(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="selected-record-info">
                <User size={16} />
                <span>{selectedRecord.userId.fullName}</span>
                <span>•</span>
                <span>{formatDate(selectedRecord.date)}</span>
              </div>

              <div className="wage-options">
                {WAGE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    className={`wage-option ${newWageType === opt.value ? 'active' : ''}`}
                    onClick={() => handleTypeChange(opt.value)}
                  >
                    {newWageType === opt.value && <Check size={16} />}
                    <span>{opt.label}</span>
                    <span className="wage-multiplier">{opt.multiplier}x</span>
                  </button>
                ))}
              </div>

              <div className="rate-input-section" style={{ marginTop: 24 }}>
                <CostInput
                  label="Rate per Day (Rp)"
                  value={newDailyRate}
                  onChange={handleRateChange}
                  placeholder="e.g. 150000"
                />
                
                {newWageType.startsWith('overtime') && (
                  <div style={{ marginTop: 16 }}>
                    <CostInput
                      label="Overtime Pay (Rp)"
                      value={newOvertimePay}
                      onChange={setNewOvertimePay}
                      placeholder="Auto-calculated or Manual Override"
                    />
                    {selectedRecord.checkIn?.time && selectedRecord.checkOut?.time && (
                      <p className="helper-text" style={{ fontSize: '0.8em', color: 'var(--text-secondary)', marginTop: 4 }}>
                        Duration: {((new Date(selectedRecord.checkOut.time).getTime() - new Date(selectedRecord.checkIn.time).getTime()) / (1000 * 60 * 60)).toFixed(2)} hours
                      </p>
                    )}
                  </div>
                )}

                <p className="helper-text" style={{ fontSize: '0.8em', color: 'var(--text-muted)', marginTop: 12 }}>
                  Hourly rate is auto-calculated (Daily / 8). Overtime is calculated based on duration, but can be manually overridden above.
                </p>
              </div>
            </div>
            
            <div className="modal-footer">
              <Button
                title="Cancel"
                onClick={() => setWageModal(false)}
                variant="outline"
              />
              <Button
                title="Save"
                onClick={handleSaveWage}
                loading={submitting}
                variant="primary"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
