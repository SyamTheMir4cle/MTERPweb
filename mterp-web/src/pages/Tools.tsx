import { useState, useEffect } from 'react';
import {
  Search, Wrench, Plus, Package, MapPin, User,
  Calendar, Edit3, Trash2, X, ChevronDown, AlertTriangle,
  CheckCircle2, Settings, Archive
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getToolDashboard, createTool, updateTool, deleteTool } from '../api/api';
import { Card, Input, Badge, EmptyState, LoadingOverlay, Button } from '../components/shared';
import { useAuth } from '../contexts/AuthContext';
import { Tool } from '../types';
import './Tools.css';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];

const CONDITION_CONFIG: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  'Baik': { color: '#059669', bg: '#D1FAE5', icon: CheckCircle2, label: 'Good' },
  'Maintenance': { color: '#D97706', bg: '#FEF3C7', icon: Settings, label: 'Service' },
  'Rusak': { color: '#DC2626', bg: '#FEE2E2', icon: AlertTriangle, label: 'Damaged' },
};

type FilterType = 'all' | 'Baik' | 'inUse' | 'Maintenance' | 'Rusak';

const FILTERS: { key: FilterType; label: string; icon: any }[] = [
  { key: 'all', label: 'All', icon: Package },
  { key: 'Baik', label: 'Available', icon: CheckCircle2 },
  { key: 'inUse', label: 'In Use', icon: User },
  { key: 'Maintenance', label: 'Service', icon: Settings },
  { key: 'Rusak', label: 'Damaged', icon: AlertTriangle },
];

const EMPTY_FORM = {
  nama: '', kategori: '', stok: 1, satuan: 'unit', kondisi: 'Baik', lokasi: 'Warehouse'
};

export default function Tools() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [tools, setTools] = useState<Tool[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const canManage = user?.role && ['owner', 'director', 'asset_admin'].includes(user.role);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await getToolDashboard(search);
      setTools(data.tools || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error('Failed to fetch tools', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  // Filtered tools
  const filteredTools = tools.filter(tool => {
    if (filter === 'all') return true;
    if (filter === 'inUse') return !!tool.assignedTo;
    return tool.kondisi === filter;
  });

  const pieData = stats ? [
    { name: t('tools.filter.available'), value: stats.available || 0 },
    { name: t('tools.filter.inUse'), value: stats.inUse || 0 },
    { name: t('tools.filter.service'), value: stats.maintenance || 0 },
    { name: t('tools.filter.damaged'), value: stats.other || 0 },
  ] : [];

  const getConditionStyle = (kondisi?: string) => {
    const config = CONDITION_CONFIG[kondisi || ''];
    if (!config) {
      return { color: '#94A3B8', bg: '#F1F5F9', icon: Package, label: t('tools.condition.na') };
    }
    const labelMapping: Record<string, string> = {
      'Good': t('tools.condition.good'),
      'Service': t('tools.condition.service'),
      'Damaged': t('tools.condition.damaged')
    };
    return { ...config, label: labelMapping[config.label] };
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  // CRUD handlers
  const openAddModal = () => {
    setEditingTool(null);
    setFormData(EMPTY_FORM);
    setShowAddModal(true);
  };

  const openEditModal = (tool: Tool) => {
    setEditingTool(tool);
    setFormData({
      nama: tool.nama,
      kategori: tool.kategori || '',
      stok: tool.stok,
      satuan: tool.satuan,
      kondisi: tool.kondisi || 'Baik',
      lokasi: tool.lokasi || '',
    });
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!formData.nama.trim()) return;
    setSubmitting(true);
    try {
      if (editingTool) {
        await updateTool(editingTool._id, formData);
      } else {
        await createTool(formData);
      }
      setShowAddModal(false);
      setEditingTool(null);
      setFormData(EMPTY_FORM);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.msg || t('tools.messages.saveFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (tool: Tool) => {
    if (!confirm(t('tools.messages.deleteConfirm', { name: tool.nama }))) return;
    try {
      await deleteTool(tool._id);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.msg || t('tools.messages.deleteFailed'));
    }
  };

  // Filter counts
  const filterCounts: Record<FilterType, number> = {
    all: tools.length,
    Baik: tools.filter(t => t.kondisi === 'Baik' && !t.assignedTo).length,
    inUse: tools.filter(t => !!t.assignedTo).length,
    Maintenance: tools.filter(t => t.kondisi === 'Maintenance').length,
    Rusak: tools.filter(t => t.kondisi === 'Rusak').length,
  };

  return (
    <div className="tools-container">
      <LoadingOverlay visible={loading} />

      {/* Header */}
      <div className="tools-header">
        <div className="tools-header-left">
          <div className="tools-header-icon">
            <Wrench size={24} color="white" />
          </div>
          <div>
            <h1 className="tools-title">{t('tools.title')}</h1>
            <p className="tools-subtitle">{t('tools.subtitle')}</p>
          </div>
        </div>
        {canManage && (
          <Button
            title={t('tools.actions.add')}
            icon={Plus}
            onClick={openAddModal}
            variant="primary"
          />
        )}
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="tools-kpi-grid">
          <Card className="tools-kpi-card">
            <div className="tools-kpi-icon" style={{ backgroundColor: '#EDE9FE' }}>
              <Package size={20} color="#7C3AED" />
            </div>
            <div className="tools-kpi-info">
              <span className="tools-kpi-value">{stats.total || 0}</span>
              <span className="tools-kpi-label">{t('tools.stats.total')}</span>
            </div>
          </Card>

          <Card className="tools-kpi-card">
            <div className="tools-kpi-icon" style={{ backgroundColor: '#D1FAE5' }}>
              <CheckCircle2 size={20} color="#059669" />
            </div>
            <div className="tools-kpi-info">
              <span className="tools-kpi-value" style={{ color: '#059669' }}>{stats.available || 0}</span>
              <span className="tools-kpi-label">{t('tools.stats.available')}</span>
            </div>
          </Card>

          <Card className="tools-kpi-card">
            <div className="tools-kpi-icon" style={{ backgroundColor: '#DBEAFE' }}>
              <User size={20} color="#2563EB" />
            </div>
            <div className="tools-kpi-info">
              <span className="tools-kpi-value" style={{ color: '#2563EB' }}>{stats.inUse || 0}</span>
              <span className="tools-kpi-label">{t('tools.stats.inUse')}</span>
            </div>
          </Card>

          <Card className="tools-kpi-card">
            <div className="tools-kpi-icon" style={{ backgroundColor: '#FEF3C7' }}>
              <AlertTriangle size={20} color="#D97706" />
            </div>
            <div className="tools-kpi-info">
              <span className="tools-kpi-value" style={{ color: '#D97706' }}>{(stats.maintenance || 0) + (stats.other || 0)}</span>
              <span className="tools-kpi-label">{t('tools.stats.needsAttention')}</span>
            </div>
          </Card>
        </div>
      )}

      {/* Search + Filters Row */}
      <div className="tools-controls">
        <Input
          placeholder={t('tools.searchPlaceholder')}
          value={search}
          onChangeText={setSearch}
          icon={Search}
          style={{ flex: 1 }}
        />
        <div className="tools-filter-tabs">
          {FILTERS.map(f => {
            const Icon = f.icon;
            const filterLabelMapping: Record<string, string> = {
              'All': t('tools.filter.all'),
              'Available': t('tools.filter.available'),
              'In Use': t('tools.filter.inUse'),
              'Service': t('tools.filter.service'),
              'Damaged': t('tools.filter.damaged'),
            };
            return (
              <button
                key={f.key}
                className={`filter-tab ${filter === f.key ? 'filter-tab-active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                <Icon size={14} />
                <span>{filterLabelMapping[f.label]}</span>
                <span className="filter-count">{filterCounts[f.key]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content: Chart + List */}
      <div className="tools-content">
        {/* Donut Chart Side Panel */}
        {stats && (stats.total || 0) > 0 && (
          <Card className="tools-chart-panel">
            <h3 className="chart-panel-title">{t('tools.overview')}</h3>
            <div className="chart-panel-donut">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-white)',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      boxShadow: 'var(--shadow-md)',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-panel-legend">
              {pieData.map((entry, i) => (
                <div key={i} className="legend-item">
                  <span className="legend-dot" style={{ backgroundColor: COLORS[i] }} />
                  <span className="legend-label">{entry.name}</span>
                  <span className="legend-value">{entry.value}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Tool List */}
        <div className="tools-list-section">
          {filteredTools.length === 0 && !loading ? (
            <EmptyState
              icon={Wrench}
              title={t('tools.empty.title')}
              description={filter !== 'all'
                ? t('tools.empty.filtered')
                : t('tools.empty.default')}
            />
          ) : (
            <div className="tools-list">
              {filteredTools.map((tool, index) => {
                const condStyle = getConditionStyle(tool.kondisi);
                const CondIcon = condStyle.icon;
                return (
                  <Card
                    key={tool._id}
                    className="tool-card"
                    style={{
                      borderLeft: `4px solid ${condStyle.color}`,
                      animationDelay: `${index * 0.04}s`,
                    }}
                  >
                    <div className="tool-card-body">
                      <div className="tool-icon-wrap" style={{ backgroundColor: condStyle.bg }}>
                        <Wrench size={22} color={condStyle.color} />
                      </div>

                      <div className="tool-info">
                        <div className="tool-info-top">
                          <h3 className="tool-name">{tool.nama}</h3>
                          <div className="tool-badges">
                            {tool.kategori && (
                              <span className="tool-category-badge">{tool.kategori}</span>
                            )}
                            <span
                              className="tool-condition-badge"
                              style={{ backgroundColor: condStyle.bg, color: condStyle.color }}
                            >
                              <CondIcon size={12} />
                              {condStyle.label}
                            </span>
                          </div>
                        </div>

                        <div className="tool-meta-row">
                          <span className="tool-meta-item">
                            <Archive size={13} />
                            {tool.stok} {tool.satuan}
                          </span>
                          {tool.lokasi && (
                            <span className="tool-meta-item">
                              <MapPin size={13} />
                              {tool.lokasi}
                            </span>
                          )}
                          {tool.assignedTo && (
                            <span className="tool-meta-item tool-meta-assigned">
                              <User size={13} />
                              {tool.assignedTo.fullName}
                            </span>
                          )}
                          {tool.projectId && (
                            <span className="tool-meta-item tool-meta-project">
                              <Package size={13} />
                              {tool.projectId.nama}
                            </span>
                          )}
                          {tool.lastChecked && (
                            <span className="tool-meta-item">
                              <Calendar size={13} />
                              {formatDate(tool.lastChecked)}
                            </span>
                          )}
                        </div>
                      </div>

                      {canManage && (
                        <div className="tool-actions">
                          <button className="tool-action-btn tool-edit-btn" onClick={() => openEditModal(tool)} title={t('tools.actions.edit')}>
                            <Edit3 size={16} />
                          </button>
                          <button className="tool-action-btn tool-delete-btn" onClick={() => handleDelete(tool)} title={t('tools.actions.delete')}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => { setShowAddModal(false); setEditingTool(null); }}>
          <div className="modal-content tools-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTool ? t('tools.modal.editTitle') : t('tools.modal.addTitle')}</h2>
              <button className="modal-close" onClick={() => { setShowAddModal(false); setEditingTool(null); }}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">{t('tools.modal.name')}</label>
                <input
                  className="form-input"
                  value={formData.nama}
                  onChange={e => setFormData(p => ({ ...p, nama: e.target.value }))}
                  placeholder={t('tools.modal.namePlaceholder')}
                />
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">{t('tools.modal.category')}</label>
                  <input
                    className="form-input"
                    value={formData.kategori}
                    onChange={e => setFormData(p => ({ ...p, kategori: e.target.value }))}
                    placeholder={t('tools.modal.categoryPlaceholder')}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">{t('tools.modal.location')}</label>
                  <input
                    className="form-input"
                    value={formData.lokasi}
                    onChange={e => setFormData(p => ({ ...p, lokasi: e.target.value }))}
                    placeholder={t('tools.modal.locationPlaceholder')}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">{t('tools.modal.stock')}</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    value={formData.stok}
                    onChange={e => setFormData(p => ({ ...p, stok: Number(e.target.value) }))}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">{t('tools.modal.unit')}</label>
                  <input
                    className="form-input"
                    value={formData.satuan}
                    onChange={e => setFormData(p => ({ ...p, satuan: e.target.value }))}
                    placeholder={t('tools.modal.unitPlaceholder')}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('tools.modal.condition')}</label>
                <div className="condition-selector">
                  {(['Baik', 'Maintenance', 'Rusak'] as const).map(k => {
                    const cfg = CONDITION_CONFIG[k];
                    const isActive = formData.kondisi === k;
                    const Icon = cfg.icon;
                    const labelMapping: Record<string, string> = {
                      'Good': t('tools.condition.good'),
                      'Service': t('tools.condition.service'),
                      'Damaged': t('tools.condition.damaged')
                    };
                    const translatedLabel = labelMapping[cfg.label];
                    return (
                      <button
                        key={k}
                        className={`condition-option ${isActive ? 'condition-option-active' : ''}`}
                        style={isActive ? { backgroundColor: cfg.bg, color: cfg.color, borderColor: cfg.color } : {}}
                        onClick={() => setFormData(p => ({ ...p, kondisi: k }))}
                        type="button"
                      >
                        <Icon size={14} />
                        {translatedLabel}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <Button
                title={t('tools.actions.cancel')}
                onClick={() => { setShowAddModal(false); setEditingTool(null); }}
                variant="outline"
              />
              <Button
                title={editingTool ? t('tools.actions.saveChanges') : t('tools.actions.add')}
                onClick={handleSave}
                loading={submitting}
                variant="primary"
                disabled={!formData.nama.trim()}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
