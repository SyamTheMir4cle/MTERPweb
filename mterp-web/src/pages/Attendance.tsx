import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Clock, DollarSign, AlertCircle, Check, LogOut, FileText, Building, CalendarOff } from 'lucide-react';
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
}

export default function Attendance() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingToday, setFetchingToday] = useState(true);
  const [alertData, setAlertData] = useState<{ visible: boolean; type: 'success' | 'error'; title: string; message: string }>({
    visible: false,
    type: 'success',
    title: '',
    message: '',
  });

  // Kasbon Modal
  const [kasbonOpen, setKasbonOpen] = useState(false);
  const [kasbonAmount, setKasbonAmount] = useState('');
  const [kasbonReason, setKasbonReason] = useState('');

  // Project & Permit
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [permitModal, setPermitModal] = useState(false);
  const [permitReason, setPermitReason] = useState('');
  const [permitPhoto, setPermitPhoto] = useState<File | null>(null);
  const [permitPhotoPreview, setPermitPhotoPreview] = useState<string | null>(null);

  const isSupervisor = user?.role && ['owner', 'director', 'supervisor'].includes(user.role);

  useEffect(() => {
    fetchTodayAttendance();
    fetchProjects();
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handlePermitFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPermitPhoto(file);
      setPermitPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleCheckIn = async () => {
    if (!selectedProjectId) {
      setAlertData({
        visible: true,
        type: 'error',
        title: 'Project Required',
        message: 'Please select a project before checking in.',
      });
      return;
    }

    setLoading(true);
    try {
      await api.post('/attendance/checkin', { projectId: selectedProjectId });

      setAlertData({
        visible: true,
        type: 'success',
        title: 'Checked In!',
        message: `You've successfully checked in at ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
      });
      
      await fetchTodayAttendance();
    } catch (err: any) {
      console.error('Check-in failed', err);
      setAlertData({
        visible: true,
        type: 'error',
        title: 'Check-in Failed',
        message: err.response?.data?.msg || 'Could not check in. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!photo) {
      setAlertData({
        visible: true,
        type: 'error',
        title: 'Photo Required',
        message: 'Please upload a selfie photo for check-out.',
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('photo', photo);

      await api.put('/attendance/checkout', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setAlertData({
        visible: true,
        type: 'success',
        title: 'Checked Out!',
        message: `You've successfully checked out at ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
      });
      
      setPhoto(null);
      setPhotoPreview(null);
      await fetchTodayAttendance();
    } catch (err: any) {
      console.error('Check-out failed', err);
      setAlertData({
        visible: true,
        type: 'error',
        title: 'Check-out Failed',
        message: err.response?.data?.msg || 'Could not check out. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKasbonSubmit = async () => {
    if (!kasbonAmount) return;

    try {
      await api.post('/kasbon', {
        amount: Number(kasbonAmount),
        reason: kasbonReason,
        userId: user?._id,
      });
      setAlertData({
        visible: true,
        type: 'success',
        title: 'Request Sent',
        message: 'Your kasbon request has been submitted.',
      });
      setKasbonOpen(false);
      setKasbonAmount('');
      setKasbonReason('');
    } catch (err) {
      console.error('Kasbon request failed', err);
    }
  };

  const handlePermitSubmit = async () => {
    if (!permitReason || !permitPhoto) {
      alert('Reason and photo evidence are required');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('reason', permitReason);
      formData.append('evidence', permitPhoto);

      await api.post('/attendance/permit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setAlertData({
        visible: true,
        type: 'success',
        title: 'Permit Sent',
        message: 'Your permit request has been submitted.',
      });
      setPermitModal(false);
      setPermitReason('');
      setPermitPhoto(null);
      setPermitPhotoPreview(null);
      await fetchTodayAttendance();
    } catch (err: any) {
      console.error('Permit failed', err);
      setAlertData({
        visible: true,
        type: 'error',
        title: 'Request Failed',
        message: err.response?.data?.msg || 'Failed to submit permit.'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const hasCheckedIn = todayRecord?.checkIn?.time;
  const hasCheckedOut = todayRecord?.checkOut?.time;
  const isPermit = todayRecord?.status === 'Permit';

  // Time Validation
  const now = new Date();
  const currentHour = now.getHours();
  // 08:00 to 16:00 means 8 <= hour < 16. So 15:59 is ok, 16:00 is not.
  const isWorkingHours = currentHour >= 8 && currentHour < 16;
  const checkInDisabled = !isWorkingHours && user?.role === 'worker'; // Only strict for workers

  return (
    <div className="attendance-container">
      <Alert
        visible={alertData.visible}
        type={alertData.type}
        title={alertData.title}
        message={alertData.message}
        onClose={() => setAlertData({ ...alertData, visible: false })}
      />

      {/* Header */}
      <div className="attendance-header">
        <div>
          <h1 className="attendance-title">Attendance</h1>
          <span className="attendance-date">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
        <span className="attendance-time">
          <Clock size={16} />
          {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Today's Status */}
      <Card className="status-card">
        <h3 className="section-title">Today's Status</h3>
        {fetchingToday ? (
          <div className="status-loading">Loading...</div>
        ) : (
          <div className="status-grid">
            <div className={`status-item ${hasCheckedIn ? 'active' : ''}`}>
              <Check size={20} />
              <span className="status-label">Check In</span>
              <span className="status-value">
                {hasCheckedIn ? formatTime(todayRecord!.checkIn!.time) : '--:--'}
              </span>
            </div>
            <div className={`status-item ${hasCheckedOut ? 'active' : ''}`}>
              <LogOut size={20} />
              <span className="status-label">Check Out</span>
              <span className="status-value">
                {hasCheckedOut ? formatTime(todayRecord!.checkOut!.time) : '--:--'}
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Check In Section - Simple Button */}
      {!hasCheckedIn && (
        <Card className="checkin-section">
          <h3 className="section-title">Ready to Work?</h3>
          <p className="section-desc">Click the button below to check in</p>
          <Button
            title="Check In Now"
            icon={Check}
            onClick={handleCheckIn}
            variant="success"
            size="large"
            loading={loading}
            fullWidth
            disabled={checkInDisabled}
          />
          
          <div className="form-group" style={{ marginTop: 16 }}>
            <label className="form-label">Work Location / Project</label>
            <select
              className="form-input"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              <option value="">-- Select Project --</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.nama || p.name}</option>
              ))}
            </select>
          </div>

          {!isWorkingHours && user?.role === 'worker' && (
            <p className="error-text" style={{ marginTop: 8, textAlign: 'center' }}>
              Check-in only available between 08:00 - 16:00
            </p>
          )}

          <Button
            title="Request Permit / Leave"
            icon={CalendarOff}
            onClick={() => setPermitModal(true)}
            variant="outline"
            size="medium"
            fullWidth
            style={{ marginTop: 12 }}
          />
        </Card>
      )}

      {/* Check Out Section - With Selfie */}
      {hasCheckedIn && !hasCheckedOut && (
        <Card className="checkout-section">
          <h3 className="section-title">Ready to Leave?</h3>
          <p className="section-desc">Upload a selfie photo to check out</p>

          <div className="photo-upload">
            {photoPreview ? (
              <div className="photo-preview">
                <img src={photoPreview} alt="Preview" />
                <button className="photo-remove" onClick={() => { setPhoto(null); setPhotoPreview(null); }}>
                  Remove
                </button>
              </div>
            ) : (
              <label className="photo-input">
                <Upload size={32} color="var(--text-muted)" />
                <span>Click to upload selfie</span>
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

          <Button
            title="Check Out"
            icon={LogOut}
            onClick={handleCheckOut}
            variant="danger"
            size="large"
            loading={loading}
            fullWidth
            disabled={!photo}
          />
        </Card>
      )}

      {/* Completed Message */}
      {hasCheckedIn && hasCheckedOut && (
        <Card className="complete-section">
          <div className="complete-icon">
            <Check size={40} />
          </div>
          <h3>All Done for Today!</h3>
          <p>You've completed your attendance for today.</p>
        </Card>
      )}

      {/* Actions */}
      <div className="attendance-actions">
        <Button
          title="Request Kasbon"
          icon={DollarSign}
          onClick={() => setKasbonOpen(true)}
          variant="outline"
          size="medium"
          fullWidth
        />
        
        {/* Attendance Logs button - for supervisors+ */}
        {isSupervisor && (
          <Button
            title="Attendance Logs"
            icon={FileText}
            onClick={() => navigate('/attendance-logs')}
            variant="outline"
            size="medium"
            fullWidth
            style={{ marginTop: 12 }}
          />
        )}
      </div>

      {/* Permit Modal */}
      {permitModal && (
        <div className="modal-overlay" onClick={() => setPermitModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Request Permit / Leave</h3>
            <p className="section-desc">Upload evidence (e.g. medical letter) and reason.</p>

            <Input
              label="Reason"
              placeholder="Why are you unable to work?"
              value={permitReason}
              onChangeText={setPermitReason}
              multiline
            />

            <div className="photo-upload">
              {permitPhotoPreview ? (
                <div className="photo-preview">
                  <img src={permitPhotoPreview} alt="Preview" />
                  <button className="photo-remove" onClick={() => { setPermitPhoto(null); setPermitPhotoPreview(null); }}>
                    Remove
                  </button>
                </div>
              ) : (
                <label className="photo-input">
                  <Upload size={32} color="var(--text-muted)" />
                  <span>Click to upload evidence</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePermitFileChange}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>

            <div className="modal-actions">
              <Button title="Cancel" onClick={() => setPermitModal(false)} variant="outline" />
              <Button title="Submit Request" onClick={handlePermitSubmit} loading={loading} />
            </div>
          </div>
        </div>
      )}

      {/* Kasbon Modal */}
      {kasbonOpen && (
        <div className="modal-overlay" onClick={() => setKasbonOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Request Kasbon</h3>
            <div className="kasbon-warning">
              <AlertCircle size={20} color="var(--warning)" />
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

            <div className="modal-actions">
              <Button title="Cancel" onClick={() => setKasbonOpen(false)} variant="outline" />
              <Button title="Submit Request" onClick={handleKasbonSubmit} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
