import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Package, Search, DollarSign, Calendar, Plus, Send, Clock, User, FileText
} from 'lucide-react';
import api from '../api/api';
import { Card, Input, Button, Alert, EmptyState, LoadingOverlay, CostInput } from '../components/shared';
import './ProjectMaterials.css';
import { ProjectData } from '../types';

interface Supply {
  _id: string;
  item: string;
  qty: number;
  unit: string;
  cost: number;
  actualCost: number;
  totalQtyUsed: number;
  status: 'Pending' | 'Ordered' | 'Delivered';
}

interface MaterialLog {
  _id: string;
  supplyId: { _id: string; item: string; unit: string; qty: number; totalQtyUsed: number } | null;
  date: string;
  qtyUsed: number;
  qtyLeft: number;
  notes: string;
  recordedBy: { fullName: string } | null;
  createdAt: string;
}

export default function MaterialUsage() {
  const { t } = useTranslation();
  const { id: projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState<ProjectData | null>(null);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [logs, setLogs] = useState<MaterialLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [alertData, setAlertData] = useState<{ visible: boolean; type: 'success' | 'error'; title: string; message: string }>({
    visible: false, type: 'success', title: '', message: '',
  });

  // Form state
  const [formData, setFormData] = useState({
    supplyId: '',
    qtyUsed: '',
    notes: '',
    date: (() => {
      const d = new Date();
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      return d.toISOString().split('T')[0];
    })(),
  });

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      const [projectRes, suppliesRes, logsRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/projects/${projectId}/supplies`),
        api.get(`/projects/${projectId}/material-logs`),
      ]);
      setProject(projectRes.data);
      setSupplies(suppliesRes.data || []);
      setLogs(logsRes.data || []);
    } catch (err: any) {
      console.error('Failed to fetch material usage', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.supplyId || !formData.qtyUsed || Number(formData.qtyUsed) <= 0) {
      setAlertData({ visible: true, type: 'error', title: 'Error', message: 'Please select a material and enter a valid quantity.' });
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/projects/${projectId}/material-logs`, {
        supplyId: formData.supplyId,
        qtyUsed: Number(formData.qtyUsed),
        notes: formData.notes,
        date: formData.date,
      });

      setAlertData({ visible: true, type: 'success', title: 'Success', message: 'Material usage logged successfully!' });
      setFormData({ ...formData, supplyId: '', qtyUsed: '', notes: '' });
      setShowForm(false);
      fetchData(); // Refresh data
    } catch (err: any) {
      console.error('Failed to log material usage', err);
      setAlertData({ visible: true, type: 'error', title: 'Error', message: err.response?.data?.msg || 'Failed to log usage.' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  // Derived stats
  const totalPlannedQty = supplies.reduce((sum, s) => sum + (s.qty || 0), 0);
  const totalUsedQty = supplies.reduce((sum, s) => sum + (s.totalQtyUsed || 0), 0);
  const totalPlannedCost = supplies.reduce((sum, s) => sum + (s.cost || 0), 0);
  const totalActualCost = supplies.reduce((sum, s) => sum + (s.actualCost || 0), 0);

  const filteredLogs = logs.filter(log =>
    (log.supplyId?.item || '').toLowerCase().includes(search.toLowerCase()) ||
    (log.notes || '').toLowerCase().includes(search.toLowerCase())
  );

  const selectedSupply = supplies.find(s => s._id === formData.supplyId);

  if (loading) {
    return <div className="pm-container"><LoadingOverlay visible={true} /></div>;
  }

  return (
    <div className="pm-container">
      <Alert
        visible={alertData.visible}
        type={alertData.type}
        title={alertData.title}
        message={alertData.message}
        onClose={() => setAlertData({ ...alertData, visible: false })}
      />

      {/* Header */}
      <div className="pm-header">
        <button className="pm-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <div className="pm-header-info">
          <h1 className="pm-title">Material Usage</h1>
          <p className="pm-subtitle">{project?.nama || 'Project'}</p>
        </div>
        <Button
          title={showForm ? 'Cancel' : 'Log Usage'}
          icon={showForm ? ArrowLeft : Plus}
          onClick={() => setShowForm(!showForm)}
          variant={showForm ? 'outline' : 'primary'}
          size="small"
        />
      </div>

      {/* KPI Stats */}
      <div className="pm-stats-row">
        <div className="pm-stat-card">
          <div className="pm-stat-icon" style={{ backgroundColor: '#EDE9FE', color: '#7C3AED' }}>
            <Package size={20} />
          </div>
          <div className="pm-stat-info">
            <span className="pm-stat-value">{supplies.length}</span>
            <span className="pm-stat-label">Materials</span>
          </div>
        </div>
        <div className="pm-stat-card">
          <div className="pm-stat-icon" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
            <FileText size={20} />
          </div>
          <div className="pm-stat-info">
            <span className="pm-stat-value">{logs.length}</span>
            <span className="pm-stat-label">Usage Logs</span>
          </div>
        </div>
        <div className="pm-stat-card">
          <div className="pm-stat-icon" style={{ backgroundColor: '#DBEAFE', color: '#2563EB' }}>
            <Package size={20} />
          </div>
          <div className="pm-stat-info">
            <span className="pm-stat-value">{totalUsedQty}/{totalPlannedQty}</span>
            <span className="pm-stat-label">Total Qty Used</span>
          </div>
        </div>
      </div>

      {/* Log Usage Form */}
      {showForm && (
        <Card className="pm-card" style={{ borderLeft: '4px solid #7C3AED', marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', color: '#1E293B' }}>
            <Plus size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Log Material Usage
          </h3>

          {/* Date */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748B', marginBottom: 4, fontWeight: 500 }}>Date</label>
            <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 12px' }}>
              <Calendar size={16} color="#64748B" style={{ marginRight: 8 }} />
              <input
                type="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.95rem', color: '#1E293B' }}
              />
            </div>
          </div>

          {/* Select Material */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748B', marginBottom: 4, fontWeight: 500 }}>Material</label>
            <select
              value={formData.supplyId}
              onChange={e => setFormData({ ...formData, supplyId: e.target.value })}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E2E8F0',
                background: '#F8FAFC', fontSize: '0.95rem', color: '#1E293B', outline: 'none',
              }}
            >
              <option value="">-- Select Material --</option>
              {supplies.map(s => (
                <option key={s._id} value={s._id}>
                  {s.item} ({s.qty - (s.totalQtyUsed || 0)} {s.unit} remaining)
                </option>
              ))}
            </select>
          </div>

          {/* Qty Used */}
          {selectedSupply && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748B', marginBottom: 4, fontWeight: 500 }}>
                Qty Used ({selectedSupply.unit}) — {selectedSupply.qty - (selectedSupply.totalQtyUsed || 0)} remaining
              </label>
              <input
                type="number"
                min="0"
                max={selectedSupply.qty - (selectedSupply.totalQtyUsed || 0)}
                placeholder="e.g. 3"
                value={formData.qtyUsed}
                onChange={e => setFormData({ ...formData, qtyUsed: e.target.value })}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E2E8F0',
                  background: '#F8FAFC', fontSize: '0.95rem', color: '#1E293B', outline: 'none',
                }}
              />
            </div>
          )}

          {/* Notes */}
          <Input
            label="Usage Notes"
            placeholder="e.g. Used by Worker for foundation work"
            value={formData.notes}
            onChangeText={v => setFormData({ ...formData, notes: v })}
            multiline
          />

          {/* Submit */}
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              title="Log Usage"
              icon={Send}
              onClick={handleSubmit}
              loading={submitting}
              variant="success"
            />
          </div>
        </Card>
      )}

      {/* Search */}
      {logs.length > 0 && (
        <Input
          placeholder="Search usage logs..."
          value={search}
          onChangeText={setSearch}
          icon={Search}
          style={{ marginBottom: 20 }}
        />
      )}

      {/* Supply Overview Cards */}
      {supplies.length > 0 && (
        <>
          <h3 style={{ fontSize: '1rem', color: '#475569', marginBottom: 12 }}>📦 Supply Inventory</h3>
          <div className="pm-list" style={{ marginBottom: 24 }}>
            {supplies.map((supply) => {
              const remaining = supply.qty - (supply.totalQtyUsed || 0);
              const usagePercent = supply.qty > 0 ? Math.round((supply.totalQtyUsed || 0) / supply.qty * 100) : 0;
              const isLow = remaining <= 0;

              return (
                <Card
                  key={supply._id}
                  className="pm-card"
                  style={{ borderLeft: `4px solid ${isLow ? '#EF4444' : usagePercent > 75 ? '#F59E0B' : '#10B981'}` }}
                >
                  <div className="pm-card-body">
                    <div className="pm-icon-wrap" style={{ backgroundColor: isLow ? '#FEE2E2' : '#D1FAE5' }}>
                      <Package size={24} color={isLow ? '#EF4444' : '#10B981'} />
                    </div>
                    <div className="pm-info">
                      <div className="pm-info-top">
                        <h3 className="pm-item-name">{supply.item}</h3>
                        <div className={`pm-status-badge pm-status-${supply.status.toLowerCase()}`}>
                          {supply.status}
                        </div>
                      </div>
                      <div className="pm-meta-row">
                        <span className="pm-meta-item">
                          <Package size={14} /> Used: <strong>{supply.totalQtyUsed || 0}</strong> / {supply.qty} {supply.unit}
                        </span>
                        <span className="pm-meta-item" style={{ color: isLow ? '#EF4444' : '#059669', fontWeight: 600 }}>
                          Remaining: {remaining} {supply.unit}
                        </span>
                      </div>
                      {/* Usage Progress Bar */}
                      <div style={{ marginTop: 6, background: '#E2E8F0', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                        <div style={{
                          width: `${Math.min(usagePercent, 100)}%`,
                          height: '100%',
                          borderRadius: 4,
                          backgroundColor: isLow ? '#EF4444' : usagePercent > 75 ? '#F59E0B' : '#10B981',
                          transition: 'width 0.5s ease',
                        }} />
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Usage History */}
      <h3 style={{ fontSize: '1rem', color: '#475569', marginBottom: 12 }}>📝 Usage History</h3>

      {filteredLogs.length === 0 && (
        <EmptyState
          icon={FileText}
          title="No Usage Logs Yet"
          description="Click 'Log Usage' above to record material usage for this project."
        />
      )}

      {filteredLogs.length > 0 && (
        <div className="pm-list">
          {filteredLogs.map((log, index) => (
            <Card
              key={log._id}
              className="pm-card"
              style={{ borderLeft: '4px solid #7C3AED', animationDelay: `${index * 0.03}s` }}
            >
              <div className="pm-card-body">
                <div className="pm-icon-wrap" style={{ backgroundColor: '#EDE9FE' }}>
                  <Package size={24} color="#7C3AED" />
                </div>
                <div className="pm-info">
                  <div className="pm-info-top">
                    <h3 className="pm-item-name">
                      {log.supplyId?.item || 'Unknown Material'}
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                      <Calendar size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                      {formatDate(log.date)}
                    </span>
                  </div>
                  <div className="pm-meta-row">
                    <span className="pm-meta-item" style={{ fontWeight: 600, color: '#7C3AED' }}>
                      -{log.qtyUsed} {log.supplyId?.unit || ''}
                    </span>
                    <span className="pm-meta-item" style={{ color: '#059669' }}>
                      Left: {log.qtyLeft} {log.supplyId?.unit || ''}
                    </span>
                    {log.recordedBy && (
                      <span className="pm-meta-item">
                        <User size={14} /> {log.recordedBy.fullName}
                      </span>
                    )}
                  </div>
                  {log.notes && (
                    <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: '#475569', fontStyle: 'italic' }}>
                      "{log.notes}"
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
