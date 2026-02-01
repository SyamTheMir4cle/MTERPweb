import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Save, Cloud, Users, Package } from 'lucide-react';
import api from '../api/api';
import { Card, Button, Input, Alert } from '../components/shared';
import './DailyReport.css';

export default function DailyReport() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');

  const [loading, setLoading] = useState(false);
  const [alertData, setAlertData] = useState<{ visible: boolean; type: 'success' | 'error'; title: string; message: string }>({
    visible: false,
    type: 'success',
    title: '',
    message: '',
  });

  const [formData, setFormData] = useState({
    progressPercent: '',
    weather: 'Cerah',
    materials: '',
    workforce: '',
    notes: '',
  });

  const handleSubmit = async () => {
    if (!formData.progressPercent) {
      setAlertData({
        visible: true,
        type: 'error',
        title: 'Error',
        message: 'Please enter progress percentage.',
      });
      return;
    }

    setLoading(true);
    try {
      await api.post(`/projects/${projectId}/daily-report`, {
        ...formData,
        progressPercent: Number(formData.progressPercent),
        date: new Date().toISOString().split('T')[0],
      });

      setAlertData({
        visible: true,
        type: 'success',
        title: 'Report Submitted',
        message: 'Daily progress report has been saved.',
      });

      setTimeout(() => {
        navigate(-1);
      }, 1500);
    } catch (err) {
      console.error('Failed to submit report', err);
      setAlertData({
        visible: true,
        type: 'error',
        title: 'Failed',
        message: 'Could not submit report. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-container">
      <Alert
        visible={alertData.visible}
        type={alertData.type}
        title={alertData.title}
        message={alertData.message}
        onClose={() => setAlertData({ ...alertData, visible: false })}
      />

      {/* Header */}
      <div className="report-header">
        <h1 className="report-title">Daily Report</h1>
        <span className="report-date">{new Date().toLocaleDateString('id-ID')}</span>
      </div>

      {/* Progress */}
      <Card className="report-card">
        <h3 className="card-title">Progress Today</h3>
        <Input
          label="Progress Percentage"
          type="number"
          placeholder="e.g. 5"
          value={formData.progressPercent}
          onChangeText={(t) => setFormData({ ...formData, progressPercent: t })}
        />
      </Card>

      {/* Weather */}
      <Card className="report-card">
        <h3 className="card-title">
          <Cloud size={18} /> Weather Condition
        </h3>
        <div className="weather-options">
          {['Cerah', 'Berawan', 'Hujan'].map((w) => (
            <button
              key={w}
              className={`weather-btn ${formData.weather === w ? 'active' : ''}`}
              onClick={() => setFormData({ ...formData, weather: w })}
            >
              {w}
            </button>
          ))}
        </div>
      </Card>

      {/* Materials */}
      <Card className="report-card">
        <h3 className="card-title">
          <Package size={18} /> Materials Used
        </h3>
        <Input
          placeholder="List materials used today"
          value={formData.materials}
          onChangeText={(t) => setFormData({ ...formData, materials: t })}
          multiline
          numberOfLines={3}
        />
      </Card>

      {/* Workforce */}
      <Card className="report-card">
        <h3 className="card-title">
          <Users size={18} /> Workforce
        </h3>
        <Input
          placeholder="Number of workers, roles, etc."
          value={formData.workforce}
          onChangeText={(t) => setFormData({ ...formData, workforce: t })}
          multiline
          numberOfLines={3}
        />
      </Card>

      {/* Notes */}
      <Card className="report-card">
        <h3 className="card-title">Additional Notes</h3>
        <Input
          placeholder="Any issues, updates, or comments"
          value={formData.notes}
          onChangeText={(t) => setFormData({ ...formData, notes: t })}
          multiline
          numberOfLines={4}
        />
      </Card>

      {/* Submit */}
      <Button
        title="Submit Report"
        icon={Save}
        onClick={handleSubmit}
        loading={loading}
        variant="primary"
        size="large"
        fullWidth
        style={{ marginTop: 16 }}
      />
    </div>
  );
}
