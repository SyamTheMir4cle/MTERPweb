import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Clock, DollarSign, AlertCircle, Check, LogOut, FileText,
  Building, CalendarOff, MapPin, Timer, Calendar, ChevronRight,
  Shield, TrendingUp, Loader,
} from 'lucide-react';
import api from '../api/api';
import { Card, Button, Input, Alert, CostInput } from '../components/shared';
import { useAuth } from '../contexts/AuthContext';
import './Attendance.css';

interface AttendanceRecord {
  _id: string;
  date: string;
  checkIn?: { time: string; photo?: string };
  checkOut?: { time: string; photo?: string };
  wageType: string;
  status: string;
  projectId?: { _id: string; nama: string };
  dailyRate?: number;
  paymentStatus?: string;
}

export default function Attendance() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Core state
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingToday, setFetchingToday] = useState(true);
  const [alertData, setAlertData] = useState<{ visible: boolean; type: 'success' | 'error'; title: string; message: string }>({
    visible: false, type: 'success', title: '', message: '',
  });

  // Live clock
  const [liveTime, setLiveTime] = useState(new Date());

  // Project & Permit
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [permitModal, setPermitModal] = useState(false);
  const [permitReason, setPermitReason] = useState('');
  const [permitPhoto, setPermitPhoto] = useState<File | null>(null);
  const [permitPhotoPreview, setPermitPhotoPreview] = useState<string | null>(null);

  // Kasbon
  const [kasbonOpen, setKasbonOpen] = useState(false);
  const [kasbonAmount, setKasbonAmount] = useState('');
  const [kasbonReason, setKasbonReason] = useState('');

  // Recent history
  const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  const isSupervisor = user?.role && ['owner', 'director', 'supervisor'].includes(user.role);

  // Live clock tick
  useEffect(() => {
    const interval = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchTodayAttendance();
    fetchProjects();
    fetchRecentHistory();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (err) {
      console.error('Failed to fetch projects', err);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const response = await api.get('/attendance/today');
      setTodayRecord(response.data);
    } catch (err) {
      console.error('Failed to fetch today attendance', err);
    } finally {
      setFetchingToday(false);
    }
  };

  const fetchRecentHistory = async () => {
    try {
      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const response = await api.get('/attendance', {
        params: {
          startDate: weekAgo.toISOString().split('T')[0],
          endDate: now.toISOString().split('T')[0],
        },
      });
      setRecentRecords((response.data || []).slice(0, 7));
    } catch (err) {
      console.error('Failed to fetch recent history', err);
    } finally {
      setLoadingRecent(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setPhoto(file); setPhotoPreview(URL.createObjectURL(file)); }
  };

  const handlePermitFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setPermitPhoto(file); setPermitPhotoPreview(URL.createObjectURL(file)); }
  };

  const handleCheckIn = async () => {
    if (!selectedProjectId) {
      setAlertData({ visible: true, type: 'error', title: 'Project Required', message: 'Please select a project before checking in.' });
      return;
    }
    setLoading(true);
    try {
      await api.post('/attendance/checkin', { projectId: selectedProjectId });
      setAlertData({ visible: true, type: 'success', title: 'Checked In!', message: `You've checked in at ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` });
      await fetchTodayAttendance();
      await fetchRecentHistory();
    } catch (err: any) {
      setAlertData({ visible: true, type: 'error', title: 'Check-in Failed', message: err.response?.data?.msg || 'Could not check in.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!photo) {
      setAlertData({ visible: true, type: 'error', title: 'Photo Required', message: 'Please upload a selfie photo for check-out.' });
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('photo', photo);
      await api.put('/attendance/checkout', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAlertData({ visible: true, type: 'success', title: 'Checked Out!', message: `You've checked out at ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` });
      setPhoto(null);
      setPhotoPreview(null);
      await fetchTodayAttendance();
      await fetchRecentHistory();
    } catch (err: any) {
      setAlertData({ visible: true, type: 'error', title: 'Check-out Failed', message: err.response?.data?.msg || 'Could not check out.' });
    } finally {
      setLoading(false);
    }
  };

  const handleKasbonSubmit = async () => {
    if (!kasbonAmount) return;
    try {
      await api.post('/kasbon', { amount: Number(kasbonAmount), reason: kasbonReason, userId: user?._id });
      setAlertData({ visible: true, type: 'success', title: 'Request Sent', message: 'Your kasbon request has been submitted.' });
      setKasbonOpen(false); setKasbonAmount(''); setKasbonReason('');
    } catch (err) { console.error('Kasbon request failed', err); }
  };

  const handlePermitSubmit = async () => {
    if (!permitReason || !permitPhoto) {
      setAlertData({ visible: true, type: 'error', title: 'Missing Info', message: 'Reason and photo evidence are required.' });
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('reason', permitReason);
      formData.append('evidence', permitPhoto);
      await api.post('/attendance/permit', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAlertData({ visible: true, type: 'success', title: 'Permit Sent', message: 'Your permit request has been submitted.' });
      setPermitModal(false); setPermitReason(''); setPermitPhoto(null); setPermitPhotoPreview(null);
      await fetchTodayAttendance();
    } catch (err: any) {
      setAlertData({ visible: true, type: 'error', title: 'Request Failed', message: err.response?.data?.msg || 'Failed to submit permit.' });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const formatDay = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });

  const hasCheckedIn = todayRecord?.checkIn?.time;
  const hasCheckedOut = todayRecord?.checkOut?.time;
  const isPermit = todayRecord?.status === 'Permit';

  // Working hours
  const now = liveTime;
  const currentHour = now.getHours();
  const isWorkingHours = currentHour >= 8 && currentHour < 16;
  const checkInDisabled = !isWorkingHours && user?.role === 'worker';

  // Duration
  const getDuration = () => {
    if (!todayRecord?.checkIn?.time) return null;
    const start = new Date(todayRecord.checkIn.time);
    const end = todayRecord.checkOut?.time ? new Date(todayRecord.checkOut.time) : liveTime;
    const diff = end.getTime() - start.getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m`;
  };

  // Status color map
  const getStatusInfo = (status: string) => {
    const map: Record<string, { color: string; bg: string; label: string }> = {
      Present: { color: '#059669', bg: '#D1FAE5', label: 'Present' },
      Late: { color: '#D97706', bg: '#FEF3C7', label: 'Late' },
      Absent: { color: '#DC2626', bg: '#FEE2E2', label: 'Absent' },
      Permit: { color: '#7C3AED', bg: '#EDE9FE', label: 'Permit' },
      'Half-day': { color: '#6366F1', bg: '#EEF2FF', label: 'Half Day' },
    };
    return map[status] || map.Present;
  };

  return (
    <div className="attendance-container">
      <Alert
        visible={alertData.visible}
        type={alertData.type}
        title={alertData.title}
        message={alertData.message}
        onClose={() => setAlertData({ ...alertData, visible: false })}
      />

      {/* Header with live clock */}
      <div className="att-page-header">
        <div className="att-header-left">
          <div className="att-header-icon">
            <Clock size={22} color="white" />
          </div>
          <div>
            <h1 className="att-page-title">Attendance</h1>
            <span className="att-page-date">
              {liveTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
        <div className="att-live-clock">
          <div className="att-clock-digits">
            {liveTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <span className={`att-clock-status ${isWorkingHours ? 'active' : ''}`}>
            {isWorkingHours ? 'Working Hours' : 'Outside Hours'}
          </span>
        </div>
      </div>

      {/* Today's Status Timeline */}
      <Card className="att-timeline-card">
        {fetchingToday ? (
          <div className="att-timeline-loading">
            <Loader size={20} className="dashboard-spinner" />
            <span>Loading...</span>
          </div>
        ) : (
          <>
            <div className="att-timeline">
              {/* Step 1: Check In */}
              <div className={`att-step ${hasCheckedIn ? 'completed' : isPermit ? 'skipped' : 'pending'}`}>
                <div className="att-step-dot">
                  {hasCheckedIn ? <Check size={14} /> : isPermit ? <CalendarOff size={14} /> : <span>1</span>}
                </div>
                <div className="att-step-info">
                  <span className="att-step-label">Check In</span>
                  <span className="att-step-value">
                    {hasCheckedIn ? formatTime(todayRecord!.checkIn!.time) : isPermit ? 'Permit' : '--:--'}
                  </span>
                </div>
              </div>

              <div className={`att-step-line ${hasCheckedIn ? 'active' : ''}`} />

              {/* Step 2: Working */}
              <div className={`att-step ${hasCheckedIn && !hasCheckedOut ? 'active' : hasCheckedOut ? 'completed' : 'pending'}`}>
                <div className="att-step-dot">
                  {hasCheckedIn && !hasCheckedOut ? (
                    <Timer size={14} />
                  ) : hasCheckedOut ? (
                    <Check size={14} />
                  ) : (
                    <span>2</span>
                  )}
                </div>
                <div className="att-step-info">
                  <span className="att-step-label">Working</span>
                  <span className="att-step-value">
                    {getDuration() || '--'}
                  </span>
                </div>
              </div>

              <div className={`att-step-line ${hasCheckedOut ? 'active' : ''}`} />

              {/* Step 3: Check Out */}
              <div className={`att-step ${hasCheckedOut ? 'completed' : 'pending'}`}>
                <div className="att-step-dot">
                  {hasCheckedOut ? <Check size={14} /> : <span>3</span>}
                </div>
                <div className="att-step-info">
                  <span className="att-step-label">Check Out</span>
                  <span className="att-step-value">
                    {hasCheckedOut ? formatTime(todayRecord!.checkOut!.time) : '--:--'}
                  </span>
                </div>
              </div>
            </div>

            {/* Status ribbon */}
            {todayRecord && (
              <div className="att-status-ribbon" style={{
                backgroundColor: getStatusInfo(todayRecord.status).bg,
                color: getStatusInfo(todayRecord.status).color,
              }}>
                <Shield size={14} />
                <span>Status: {getStatusInfo(todayRecord.status).label}</span>
                {todayRecord.projectId && (
                  <>
                    <span className="att-ribbon-sep">•</span>
                    <Building size={12} />
                    <span>{typeof todayRecord.projectId === 'object' ? todayRecord.projectId.nama : ''}</span>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </Card>

      {/* ===== ACTION CARDS ===== */}

      {/* Check In */}
      {!hasCheckedIn && !isPermit && (
        <Card className="att-action-card att-checkin-card">
          <div className="att-action-header">
            <div className="att-action-icon att-icon-green">
              <MapPin size={20} />
            </div>
            <div>
              <h3 className="att-action-title">Ready to Work?</h3>
              <p className="att-action-desc">Select your project and check in</p>
            </div>
          </div>

          <div className="att-project-select">
            <Building size={16} color="var(--text-muted)" />
            <select
              className="att-project-input"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              <option value="">-- Select Project --</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.nama || p.name}</option>
              ))}
            </select>
          </div>

          <button
            className={`att-big-btn att-btn-checkin ${checkInDisabled ? 'disabled' : ''}`}
            onClick={handleCheckIn}
            disabled={loading || checkInDisabled}
          >
            {loading ? (
              <Loader size={22} className="dashboard-spinner" />
            ) : (
              <>
                <Check size={22} />
                <span>Check In Now</span>
              </>
            )}
          </button>

          {checkInDisabled && (
            <p className="att-time-warning">
              <AlertCircle size={14} />
              Check-in only available between 08:00 – 16:00
            </p>
          )}

          <button className="att-permit-link" onClick={() => setPermitModal(true)}>
            <CalendarOff size={14} />
            <span>Can't work today? Request Permit</span>
            <ChevronRight size={14} />
          </button>
        </Card>
      )}

      {/* Check Out */}
      {hasCheckedIn && !hasCheckedOut && (
        <Card className="att-action-card att-checkout-card">
          <div className="att-action-header">
            <div className="att-action-icon att-icon-orange">
              <LogOut size={20} />
            </div>
            <div>
              <h3 className="att-action-title">Ready to Leave?</h3>
              <p className="att-action-desc">Upload a selfie photo to check out</p>
            </div>
          </div>

          <div className="photo-upload">
            {photoPreview ? (
              <div className="att-photo-preview">
                <img src={photoPreview} alt="Preview" />
                <button className="att-photo-remove" onClick={() => { setPhoto(null); setPhotoPreview(null); }}>
                  ✕ Remove
                </button>
              </div>
            ) : (
              <label className="att-photo-input">
                <Upload size={28} color="var(--text-muted)" />
                <span>Tap to upload selfie</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>

          <button
            className={`att-big-btn att-btn-checkout ${!photo ? 'disabled' : ''}`}
            onClick={handleCheckOut}
            disabled={loading || !photo}
          >
            {loading ? (
              <Loader size={22} className="dashboard-spinner" />
            ) : (
              <>
                <LogOut size={22} />
                <span>Check Out</span>
              </>
            )}
          </button>
        </Card>
      )}

      {/* ✅ All Done */}
      {hasCheckedIn && hasCheckedOut && (
        <Card className="att-done-card">
          <div className="att-done-icon">
            <Check size={36} />
          </div>
          <h3 className="att-done-title">All Done For Today!</h3>
          <p className="att-done-desc">
            Worked for <strong>{getDuration()}</strong> • {formatTime(todayRecord!.checkIn!.time)} – {formatTime(todayRecord!.checkOut!.time)}
          </p>
        </Card>
      )}

      {/* Permit status */}
      {isPermit && !hasCheckedIn && (
        <Card className="att-done-card att-permit-card">
          <div className="att-done-icon att-permit-icon">
            <CalendarOff size={36} />
          </div>
          <h3 className="att-done-title">Permit Requested</h3>
          <p className="att-done-desc">You have submitted a permit for today.</p>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="att-quick-actions">
        <button className="att-quick-btn" onClick={() => setKasbonOpen(true)}>
          <div className="att-quick-icon" style={{ backgroundColor: '#FEF3C7' }}>
            <DollarSign size={18} color="#D97706" />
          </div>
          <span>Request Kasbon</span>
          <ChevronRight size={16} color="var(--text-muted)" />
        </button>

        {isSupervisor && (
          <button className="att-quick-btn" onClick={() => navigate('/attendance-logs')}>
            <div className="att-quick-icon" style={{ backgroundColor: '#EEF2FF' }}>
              <FileText size={18} color="#6366F1" />
            </div>
            <span>Attendance Logs</span>
            <ChevronRight size={16} color="var(--text-muted)" />
          </button>
        )}
      </div>

      {/* Recent History */}
      <div className="att-recent-section">
        <div className="att-recent-header">
          <h3 className="att-recent-title">Recent History</h3>
          <span className="att-recent-hint">Last 7 days</span>
        </div>
        {loadingRecent ? (
          <div className="att-recent-loading">Loading...</div>
        ) : recentRecords.length === 0 ? (
          <div className="att-recent-empty">
            <Calendar size={24} color="var(--text-muted)" />
            <span>No recent records</span>
          </div>
        ) : (
          <div className="att-recent-list">
            {recentRecords.map((r) => {
              const info = getStatusInfo(r.status);
              return (
                <div key={r._id} className="att-recent-item">
                  <div className="att-recent-dot" style={{ backgroundColor: info.color }} />
                  <div className="att-recent-info">
                    <span className="att-recent-day">{formatDay(r.date)}</span>
                    <span className="att-recent-times">
                      {r.checkIn?.time ? formatTime(r.checkIn.time) : '--:--'}
                      {' → '}
                      {r.checkOut?.time ? formatTime(r.checkOut.time) : '--:--'}
                    </span>
                  </div>
                  <span className="att-recent-badge" style={{ backgroundColor: info.bg, color: info.color }}>
                    {info.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== MODALS ===== */}

      {/* Permit Modal */}
      {permitModal && (
        <div className="modal-overlay" onClick={() => setPermitModal(false)}>
          <div className="att-modal" onClick={(e) => e.stopPropagation()}>
            <div className="att-modal-title-row">
              <CalendarOff size={20} color="#7C3AED" />
              <h3>Request Permit / Leave</h3>
            </div>
            <p className="att-modal-desc">Upload evidence (e.g. medical letter) and reason.</p>

            <Input
              label="Reason"
              placeholder="Why are you unable to work?"
              value={permitReason}
              onChangeText={setPermitReason}
              multiline
            />

            <div className="photo-upload" style={{ marginTop: 12 }}>
              {permitPhotoPreview ? (
                <div className="att-photo-preview">
                  <img src={permitPhotoPreview} alt="Preview" />
                  <button className="att-photo-remove" onClick={() => { setPermitPhoto(null); setPermitPhotoPreview(null); }}>
                    ✕ Remove
                  </button>
                </div>
              ) : (
                <label className="att-photo-input">
                  <Upload size={28} color="var(--text-muted)" />
                  <span>Upload evidence photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePermitFileChange}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>

            <div className="att-modal-actions">
              <Button title="Cancel" onClick={() => setPermitModal(false)} variant="outline" />
              <Button title="Submit Request" onClick={handlePermitSubmit} loading={loading} />
            </div>
          </div>
        </div>
      )}

      {/* Kasbon Modal */}
      {kasbonOpen && (
        <div className="modal-overlay" onClick={() => setKasbonOpen(false)}>
          <div className="att-modal" onClick={(e) => e.stopPropagation()}>
            <div className="att-modal-title-row">
              <DollarSign size={20} color="#D97706" />
              <h3>Request Kasbon</h3>
            </div>
            <div className="att-kasbon-warning">
              <AlertCircle size={18} color="#D97706" />
              <span>Kasbon akan dipotong dari gaji bulanan Anda</span>
            </div>

            <CostInput
              label="Amount (Rp)"
              placeholder="e.g. 500000"
              value={Number(kasbonAmount) || 0}
              onChange={(v) => setKasbonAmount(v.toString())}
            />

            <Input
              label="Reason"
              placeholder="Why do you need this advance?"
              value={kasbonReason}
              onChangeText={setKasbonReason}
              multiline
            />

            <div className="att-modal-actions">
              <Button title="Cancel" onClick={() => setKasbonOpen(false)} variant="outline" />
              <Button title="Submit Request" onClick={handleKasbonSubmit} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
