import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Receipt,
    UserCheck,
    Calendar,
    Plus,
    Lock,
    Unlock,
    Trash2,
    Eye,
    X,
    ChevronDown,
    Shield,
    CreditCard,
    Loader2,
    CheckCircle2,
    AlertCircle,
    FileText,
    DollarSign,
    Clock,
    Briefcase,
    Search,
    Download,
} from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, Alert, Button } from '../components/shared';
import { exportSlipToPdf } from '../utils/exportSlipPdf';
import './SlipGaji.css';

/* ---- helpers ---- */
/** Get Monday→Saturday of the current week */
const getWeekRange = (refDate = new Date()) => {
    const d = new Date(refDate);
    const day = d.getDay(); // 0=Sun
    const diffToMon = day === 0 ? 6 : day - 1;
    const monday = new Date(d);
    monday.setDate(d.getDate() - diffToMon);
    monday.setHours(0, 0, 0, 0);
    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);
    saturday.setHours(23, 59, 59, 999);
    return { startDate: monday, endDate: saturday };
};

const toInputDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
};

const formatDateShort = (iso: string) => new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
const formatDateRange = (s: string, e: string) => `${formatDateShort(s)} — ${formatDateShort(e)}`;
const formatRp = (v: number) => `Rp ${new Intl.NumberFormat('id-ID').format(v || 0)}`;

/* ---- types ---- */
interface Worker {
    _id: string;
    fullName: string;
    role: string;
    paymentInfo?: { bankAccount: string; bankPlatform: string; accountName: string };
}

interface SlipData {
    _id: string;
    slipNumber: string;
    workerId: Worker;
    period: { startDate: string; endDate: string };
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
    status: 'draft' | 'authorized' | 'issued';
    createdBy?: { fullName: string };
    notes: string;
    createdAt: string;
}

const STATUS_BADGE: Record<string, { color: string; bg: string; label: string }> = {
    draft: { color: '#D97706', bg: '#FEF3C7', label: 'Draft' },
    authorized: { color: '#059669', bg: '#D1FAE5', label: 'Authorized' },
    issued: { color: '#6366F1', bg: '#EEF2FF', label: 'Issued' },
};

export default function SlipGaji() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const role = user?.role?.toLowerCase() || '';

    // Access guard
    if (!['owner', 'director', 'supervisor'].includes(role)) {
        navigate('/home');
        return null;
    }

    /* ---- state ---- */
    const [slips, setSlips] = useState<SlipData[]>([]);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);
    const [alertData, setAlertData] = useState<{ visible: boolean; type: 'success' | 'error'; title: string; message: string }>({
        visible: false, type: 'success', title: '', message: '',
    });

    // Filter by date range (default: current week Mon→Sat)
    const weekRange = getWeekRange();
    const [filterStart, setFilterStart] = useState(toInputDate(weekRange.startDate));
    const [filterEnd, setFilterEnd] = useState(toInputDate(weekRange.endDate));

    // Generate modal
    const [genModal, setGenModal] = useState(false);
    const [genWorker, setGenWorker] = useState('');
    const [genStart, setGenStart] = useState(toInputDate(weekRange.startDate));
    const [genEnd, setGenEnd] = useState(toInputDate(weekRange.endDate));
    const [genBonus, setGenBonus] = useState(0);
    const [genDeductions, setGenDeductions] = useState(0);
    const [genNotes, setGenNotes] = useState('');
    const [generating, setGenerating] = useState(false);

    // Detail modal
    const [detailModal, setDetailModal] = useState(false);
    const [selectedSlip, setSelectedSlip] = useState<SlipData | null>(null);

    // Auth modal
    const [authModal, setAuthModal] = useState(false);
    const [authSlipId, setAuthSlipId] = useState('');
    const [passphrase, setPassphrase] = useState('');
    const [authorizing, setAuthorizing] = useState(false);

    /* ---- data loading ---- */
    const fetchSlips = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/slipgaji', { params: { startDate: filterStart, endDate: filterEnd } });
            setSlips(res.data);
        } catch { /* empty */ }
        setLoading(false);
    }, [filterStart, filterEnd]);

    const fetchWorkers = useCallback(async () => {
        try {
            const res = await api.get('/slipgaji/workers');
            setWorkers(res.data);
        } catch { /* empty */ }
    }, []);

    useEffect(() => { fetchSlips(); }, [fetchSlips]);
    useEffect(() => { fetchWorkers(); }, [fetchWorkers]);

    /* ---- quick week navigation ---- */
    const shiftWeek = (dir: number) => {
        const s = new Date(filterStart);
        s.setDate(s.getDate() + dir * 7);
        const range = getWeekRange(s);
        setFilterStart(toInputDate(range.startDate));
        setFilterEnd(toInputDate(range.endDate));
    };

    /* ---- actions ---- */
    const handleGenerate = async () => {
        if (!genWorker) return;
        setGenerating(true);
        try {
            await api.post('/slipgaji/generate', {
                workerId: genWorker,
                startDate: genStart,
                endDate: genEnd,
                bonus: genBonus,
                deductions: genDeductions,
                notes: genNotes,
            });
            setGenModal(false);
            setGenWorker('');
            setGenBonus(0);
            setGenDeductions(0);
            setGenNotes('');
            setAlertData({ visible: true, type: 'success', title: 'Slip Generated', message: 'Salary slip has been created as draft.' });
            fetchSlips();
        } catch (err: any) {
            setAlertData({ visible: true, type: 'error', title: 'Error', message: err?.response?.data?.msg || 'Failed to generate slip' });
        }
        setGenerating(false);
    };

    const handleAuthorize = async () => {
        if (!passphrase || passphrase.length < 4) return;
        setAuthorizing(true);
        try {
            const res = await api.post(`/slipgaji/${authSlipId}/authorize`, { passphrase });
            setAuthModal(false);
            setPassphrase('');
            setAlertData({ visible: true, type: 'success', title: 'Authorized', message: `Slip signed by ${user?.fullName}` });
            if (selectedSlip?._id === authSlipId) setSelectedSlip(res.data);
            fetchSlips();
        } catch (err: any) {
            setAlertData({ visible: true, type: 'error', title: 'Authorization Failed', message: err?.response?.data?.msg || 'Failed to authorize' });
        }
        setAuthorizing(false);
    };

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/slipgaji/${id}`);
            setAlertData({ visible: true, type: 'success', title: 'Deleted', message: 'Draft slip has been deleted.' });
            fetchSlips();
            if (selectedSlip?._id === id) { setDetailModal(false); setSelectedSlip(null); }
        } catch (err: any) {
            setAlertData({ visible: true, type: 'error', title: 'Error', message: err?.response?.data?.msg || 'Failed to delete' });
        }
    };

    const openDetail = (slip: SlipData) => { setSelectedSlip(slip); setDetailModal(true); };
    const openAuth = (slipId: string) => { setAuthSlipId(slipId); setPassphrase(''); setAuthModal(true); };
    const canSign = (slip: SlipData) => {
        if (role === 'director' && !slip.authorization.directorPassphrase) return true;
        if (role === 'owner' && !slip.authorization.ownerPassphrase) return true;
        return false;
    };

    const handleExportPdf = (slip: SlipData) => {
        exportSlipToPdf({
            slipNumber: slip.slipNumber,
            workerName: slip.workerId?.fullName || 'Worker',
            workerRole: slip.workerId?.role || '',
            periodStart: slip.period.startDate,
            periodEnd: slip.period.endDate,
            attendance: slip.attendanceSummary,
            earnings: slip.earnings,
            paymentInfo: slip.workerPaymentInfo,
            authorization: {
                directorName: slip.authorization.directorName || undefined,
                directorSignedAt: slip.authorization.directorSignedAt || undefined,
                ownerName: slip.authorization.ownerName || undefined,
                ownerSignedAt: slip.authorization.ownerSignedAt || undefined,
            },
            notes: slip.notes,
        });
    };

    return (
        <div className="sg-container">
            <Alert
                visible={alertData.visible}
                type={alertData.type}
                title={alertData.title}
                message={alertData.message}
                onClose={() => setAlertData({ ...alertData, visible: false })}
            />

            {/* Header */}
            <div className="sg-header">
                <button className="sg-back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                </button>
                <div className="sg-header-icon">
                    <Receipt size={22} color="white" />
                </div>
                <div>
                    <h1 className="sg-title">Slip Gaji</h1>
                    <p className="sg-subtitle">Weekly salary slips · Payment every Saturday</p>
                </div>
            </div>

            {/* Action Bar — Date Range Filter */}
            <div className="sg-action-bar">
                <div className="sg-filters">
                    <button className="sg-week-btn" onClick={() => shiftWeek(-1)}>◀</button>
                    <div className="sg-date-range">
                        <Calendar size={14} />
                        <input type="date" className="sg-date-input" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} />
                        <span className="sg-date-sep">—</span>
                        <input type="date" className="sg-date-input" value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} />
                    </div>
                    <button className="sg-week-btn" onClick={() => shiftWeek(1)}>▶</button>
                </div>
                <button className="sg-generate-btn" onClick={() => setGenModal(true)}>
                    <Plus size={18} />
                    <span>Generate Slip</span>
                </button>
            </div>

            {/* Slips List */}
            {loading ? (
                <div className="sg-loading">
                    <Loader2 size={32} className="sg-spinner" />
                    <span>Loading slips…</span>
                </div>
            ) : slips.length === 0 ? (
                <Card className="sg-empty">
                    <FileText size={48} color="var(--text-muted)" />
                    <p>No salary slips for this period</p>
                    <button className="sg-generate-btn" onClick={() => setGenModal(true)}>
                        <Plus size={18} />
                        <span>Generate First Slip</span>
                    </button>
                </Card>
            ) : (
                <div className="sg-slips-list">
                    {slips.map((slip) => {
                        const badge = STATUS_BADGE[slip.status] || STATUS_BADGE.draft;
                        return (
                            <Card key={slip._id} className="sg-slip-card" onClick={() => openDetail(slip)}>
                                <div className="sg-slip-top">
                                    <div className="sg-slip-worker">
                                        <div className="sg-slip-avatar" style={{ background: badge.bg, color: badge.color }}>
                                            {slip.workerId?.fullName?.[0]?.toUpperCase() || 'W'}
                                        </div>
                                        <div>
                                            <span className="sg-slip-name">{slip.workerId?.fullName || 'Worker'}</span>
                                            <span className="sg-slip-number">{slip.slipNumber}</span>
                                        </div>
                                    </div>
                                    <span className="sg-slip-badge" style={{ color: badge.color, background: badge.bg }}>
                                        {badge.label}
                                    </span>
                                </div>

                                <div className="sg-slip-period-row">
                                    <Calendar size={11} />
                                    <span>{formatDateRange(slip.period.startDate, slip.period.endDate)}</span>
                                </div>

                                <div className="sg-slip-middle">
                                    <div className="sg-slip-stat">
                                        <Clock size={12} />
                                        <span>{slip.attendanceSummary.presentDays} days</span>
                                    </div>
                                    <div className="sg-slip-stat">
                                        <Briefcase size={12} />
                                        <span>{formatRp(slip.earnings.totalDailyWage)}</span>
                                    </div>
                                    <div className="sg-slip-stat sg-net-pay">
                                        <DollarSign size={12} />
                                        <span>{formatRp(slip.earnings.netPay)}</span>
                                    </div>
                                </div>

                                <div className="sg-slip-bottom">
                                    <div className="sg-slip-sigs">
                                        <div className={`sg-sig-dot ${slip.authorization.directorPassphrase ? 'signed' : ''}`}>
                                            <Shield size={10} />
                                            <span>Director</span>
                                        </div>
                                        <div className={`sg-sig-dot ${slip.authorization.ownerPassphrase ? 'signed' : ''}`}>
                                            <Shield size={10} />
                                            <span>Owner</span>
                                        </div>
                                    </div>
                                    <div className="sg-slip-actions" onClick={(e) => e.stopPropagation()}>
                                        {canSign(slip) && (
                                            <button className="sg-action-btn sg-sign-btn" onClick={() => openAuth(slip._id)} title="Sign">
                                                <Lock size={14} />
                                            </button>
                                        )}
                                        {slip.status === 'draft' && (
                                            <button className="sg-action-btn sg-delete-btn" onClick={() => handleDelete(slip._id)} title="Delete">
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* ===== Generate Modal ===== */}
            {genModal && (
                <div className="modal-overlay" onClick={() => setGenModal(false)}>
                    <div className="sg-modal sg-modal-gen" onClick={(e) => e.stopPropagation()}>
                        <div className="sg-modal-header">
                            <div className="sg-modal-icon" style={{ background: 'linear-gradient(135deg, #6366F1, #818CF8)' }}>
                                <Receipt size={20} color="white" />
                            </div>
                            <div>
                                <h3 className="sg-modal-title">Generate Salary Slip</h3>
                                <p className="sg-modal-desc">Weekly period · Payment on Saturday</p>
                            </div>
                            <button className="sg-modal-close" onClick={() => setGenModal(false)}><X size={18} /></button>
                        </div>

                        <div className="sg-modal-body">
                            <div className="sg-form-group">
                                <label className="sg-label"><UserCheck size={14} /> Select Worker</label>
                                <div className="sg-select-group sg-full">
                                    <Search size={14} className="sg-select-icon" />
                                    <select className="sg-select" value={genWorker} onChange={(e) => setGenWorker(e.target.value)}>
                                        <option value="">-- Choose worker --</option>
                                        {workers.map(w => <option key={w._id} value={w._id}>{w.fullName}</option>)}
                                    </select>
                                    <ChevronDown size={14} className="sg-select-arrow" />
                                </div>
                            </div>

                            <div className="sg-form-row">
                                <div className="sg-form-group">
                                    <label className="sg-label"><Calendar size={14} /> Start Date</label>
                                    <input type="date" className="sg-input" value={genStart} onChange={(e) => setGenStart(e.target.value)} />
                                </div>
                                <div className="sg-form-group">
                                    <label className="sg-label">End Date (Sat)</label>
                                    <input type="date" className="sg-input" value={genEnd} onChange={(e) => setGenEnd(e.target.value)} />
                                </div>
                            </div>

                            <div className="sg-form-row">
                                <div className="sg-form-group">
                                    <label className="sg-label"><DollarSign size={14} /> Bonus</label>
                                    <input type="number" className="sg-input" value={genBonus || ''} onChange={(e) => setGenBonus(Number(e.target.value))} placeholder="0" />
                                </div>
                                <div className="sg-form-group">
                                    <label className="sg-label">Deductions</label>
                                    <input type="number" className="sg-input" value={genDeductions || ''} onChange={(e) => setGenDeductions(Number(e.target.value))} placeholder="0" />
                                </div>
                            </div>

                            <div className="sg-form-group">
                                <label className="sg-label"><FileText size={14} /> Notes</label>
                                <textarea className="sg-textarea" value={genNotes} onChange={(e) => setGenNotes(e.target.value)} placeholder="Optional notes…" rows={2} />
                            </div>
                        </div>

                        <div className="sg-modal-footer">
                            <button className="sg-btn-cancel" onClick={() => setGenModal(false)}>Cancel</button>
                            <button className="sg-btn-primary" onClick={handleGenerate} disabled={!genWorker || generating}>
                                {generating ? <><Loader2 size={16} className="sg-spinner" /> Generating…</> : <><Receipt size={16} /> Generate Slip</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== Detail Modal ===== */}
            {detailModal && selectedSlip && (
                <div className="modal-overlay" onClick={() => setDetailModal(false)}>
                    <div className="sg-modal sg-modal-detail" onClick={(e) => e.stopPropagation()}>
                        <div className="sg-modal-header">
                            <div className="sg-modal-icon" style={{ background: 'linear-gradient(135deg, #059669, #34D399)' }}>
                                <FileText size={20} color="white" />
                            </div>
                            <div>
                                <h3 className="sg-modal-title">Salary Slip</h3>
                                <p className="sg-modal-desc">{selectedSlip.slipNumber}</p>
                            </div>
                            <button className="sg-modal-close" onClick={() => setDetailModal(false)}><X size={18} /></button>
                        </div>

                        <div className="sg-modal-body sg-slip-detail">
                            {/* Worker Info */}
                            <div className="sg-detail-section">
                                <div className="sg-detail-worker">
                                    <div className="sg-detail-avatar">
                                        {selectedSlip.workerId?.fullName?.[0]?.toUpperCase() || 'W'}
                                    </div>
                                    <div>
                                        <span className="sg-detail-name">{selectedSlip.workerId?.fullName}</span>
                                        <span className="sg-detail-role">{selectedSlip.workerId?.role}</span>
                                    </div>
                                    <span className="sg-slip-badge" style={{
                                        color: STATUS_BADGE[selectedSlip.status]?.color,
                                        background: STATUS_BADGE[selectedSlip.status]?.bg,
                                    }}>
                                        {STATUS_BADGE[selectedSlip.status]?.label}
                                    </span>
                                </div>
                            </div>

                            {/* Period */}
                            <div className="sg-detail-period">
                                <Calendar size={14} />
                                <span>Period: {formatDateRange(selectedSlip.period.startDate, selectedSlip.period.endDate)}</span>
                            </div>

                            {/* Payment Info */}
                            {selectedSlip.workerPaymentInfo?.bankPlatform && (
                                <div className="sg-detail-payment">
                                    <CreditCard size={14} />
                                    <span>{selectedSlip.workerPaymentInfo.bankPlatform} — {selectedSlip.workerPaymentInfo.bankAccount}</span>
                                    <span className="sg-detail-accname">a/n {selectedSlip.workerPaymentInfo.accountName}</span>
                                </div>
                            )}

                            {/* Attendance Summary */}
                            <div className="sg-detail-grid">
                                <div className="sg-detail-stat">
                                    <span className="sg-detail-stat-val">{selectedSlip.attendanceSummary.totalDays}</span>
                                    <span className="sg-detail-stat-label">Total Days</span>
                                </div>
                                <div className="sg-detail-stat">
                                    <span className="sg-detail-stat-val sg-green">{selectedSlip.attendanceSummary.presentDays}</span>
                                    <span className="sg-detail-stat-label">Present</span>
                                </div>
                                <div className="sg-detail-stat">
                                    <span className="sg-detail-stat-val sg-amber">{selectedSlip.attendanceSummary.lateDays}</span>
                                    <span className="sg-detail-stat-label">Late</span>
                                </div>
                                <div className="sg-detail-stat">
                                    <span className="sg-detail-stat-val sg-red">{selectedSlip.attendanceSummary.absentDays}</span>
                                    <span className="sg-detail-stat-label">Absent</span>
                                </div>
                                <div className="sg-detail-stat">
                                    <span className="sg-detail-stat-val sg-purple">{selectedSlip.attendanceSummary.permitDays}</span>
                                    <span className="sg-detail-stat-label">Permit</span>
                                </div>
                                <div className="sg-detail-stat">
                                    <span className="sg-detail-stat-val">{selectedSlip.attendanceSummary.totalHours}h</span>
                                    <span className="sg-detail-stat-label">Total Hours</span>
                                </div>
                            </div>

                            {/* Earnings Table */}
                            <div className="sg-detail-table">
                                <h4 className="sg-detail-table-title">Earnings Breakdown</h4>
                                <div className="sg-table-row">
                                    <span>Daily Rate</span>
                                    <span>{formatRp(selectedSlip.earnings.dailyRate)}</span>
                                </div>
                                <div className="sg-table-row">
                                    <span>Total Daily Wages ({selectedSlip.attendanceSummary.presentDays + selectedSlip.attendanceSummary.lateDays} days)</span>
                                    <span>{formatRp(selectedSlip.earnings.totalDailyWage)}</span>
                                </div>
                                <div className="sg-table-row">
                                    <span>Overtime</span>
                                    <span className="sg-green">{formatRp(selectedSlip.earnings.totalOvertime)}</span>
                                </div>
                                {selectedSlip.earnings.bonus > 0 && (
                                    <div className="sg-table-row">
                                        <span>Bonus</span>
                                        <span className="sg-green">{formatRp(selectedSlip.earnings.bonus)}</span>
                                    </div>
                                )}
                                <div className="sg-table-divider" />
                                {selectedSlip.earnings.deductions > 0 && (
                                    <div className="sg-table-row">
                                        <span>Deductions</span>
                                        <span className="sg-red">-{formatRp(selectedSlip.earnings.deductions)}</span>
                                    </div>
                                )}
                                {selectedSlip.earnings.kasbonDeduction > 0 && (
                                    <div className="sg-table-row">
                                        <span>Kasbon Deduction</span>
                                        <span className="sg-red">-{formatRp(selectedSlip.earnings.kasbonDeduction)}</span>
                                    </div>
                                )}
                                <div className="sg-table-total">
                                    <span>Net Pay</span>
                                    <span>{formatRp(selectedSlip.earnings.netPay)}</span>
                                </div>
                            </div>

                            {/* Authorization */}
                            <div className="sg-auth-section">
                                <h4 className="sg-detail-table-title">Digital Authorization</h4>
                                <div className="sg-auth-grid">
                                    <div className={`sg-auth-card ${selectedSlip.authorization.directorPassphrase ? 'signed' : 'pending'}`}>
                                        <div className="sg-auth-icon">
                                            {selectedSlip.authorization.directorPassphrase ? <Unlock size={20} /> : <Lock size={20} />}
                                        </div>
                                        <span className="sg-auth-role">Director</span>
                                        {selectedSlip.authorization.directorPassphrase ? (
                                            <>
                                                <span className="sg-auth-name">{selectedSlip.authorization.directorName}</span>
                                                <span className="sg-auth-date">
                                                    {new Date(selectedSlip.authorization.directorSignedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                                <CheckCircle2 size={14} className="sg-auth-check" />
                                            </>
                                        ) : (
                                            <>
                                                <span className="sg-auth-pending">Awaiting signature</span>
                                                {role === 'director' && (
                                                    <button className="sg-auth-sign-btn" onClick={() => openAuth(selectedSlip._id)}>
                                                        <Shield size={12} /> Sign Now
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    <div className={`sg-auth-card ${selectedSlip.authorization.ownerPassphrase ? 'signed' : 'pending'}`}>
                                        <div className="sg-auth-icon">
                                            {selectedSlip.authorization.ownerPassphrase ? <Unlock size={20} /> : <Lock size={20} />}
                                        </div>
                                        <span className="sg-auth-role">Owner</span>
                                        {selectedSlip.authorization.ownerPassphrase ? (
                                            <>
                                                <span className="sg-auth-name">{selectedSlip.authorization.ownerName}</span>
                                                <span className="sg-auth-date">
                                                    {new Date(selectedSlip.authorization.ownerSignedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                                <CheckCircle2 size={14} className="sg-auth-check" />
                                            </>
                                        ) : (
                                            <>
                                                <span className="sg-auth-pending">Awaiting signature</span>
                                                {role === 'owner' && (
                                                    <button className="sg-auth-sign-btn" onClick={() => openAuth(selectedSlip._id)}>
                                                        <Shield size={12} /> Sign Now
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {selectedSlip.notes && (
                                <div className="sg-detail-notes">
                                    <strong>Notes:</strong> {selectedSlip.notes}
                                </div>
                            )}
                        </div>

                        <div className="sg-modal-footer">
                            <button className="sg-btn-cancel" onClick={() => setDetailModal(false)}>Close</button>
                            <button className="sg-btn-export" onClick={() => handleExportPdf(selectedSlip)}>
                                <Download size={16} /> Export PDF
                            </button>
                            {canSign(selectedSlip) && (
                                <button className="sg-btn-primary" onClick={() => openAuth(selectedSlip._id)}>
                                    <Lock size={16} /> Authorize
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ===== Authorization Modal ===== */}
            {authModal && (
                <div className="modal-overlay" onClick={() => setAuthModal(false)}>
                    <div className="sg-modal sg-modal-auth" onClick={(e) => e.stopPropagation()}>
                        <div className="sg-auth-modal-body">
                            <div className="sg-auth-lock-icon">
                                <Lock size={32} />
                            </div>
                            <h3 className="sg-auth-modal-title">Digital Passphrase</h3>
                            <p className="sg-auth-modal-desc">
                                Enter your secure passphrase to authorize this salary slip as <strong>{role}</strong>
                            </p>
                            <div className="sg-auth-input-wrap">
                                <Shield size={16} className="sg-auth-input-icon" />
                                <input
                                    type="password"
                                    className="sg-auth-input"
                                    value={passphrase}
                                    onChange={(e) => setPassphrase(e.target.value)}
                                    placeholder="Enter passphrase (min 4 chars)"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleAuthorize()}
                                />
                            </div>
                            <div className="sg-auth-modal-actions">
                                <button className="sg-btn-cancel" onClick={() => setAuthModal(false)}>Cancel</button>
                                <button
                                    className="sg-btn-authorize"
                                    onClick={handleAuthorize}
                                    disabled={passphrase.length < 4 || authorizing}
                                >
                                    {authorizing ? (
                                        <><Loader2 size={16} className="sg-spinner" /> Authorizing…</>
                                    ) : (
                                        <><Unlock size={16} /> Authorize</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
