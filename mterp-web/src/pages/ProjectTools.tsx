import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Wrench, User, Warehouse, Plus,
  ChevronDown, X, AlertCircle, Package, Search,
  CheckCircle2, Settings, AlertTriangle, Calendar, MapPin
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, Badge, Button, EmptyState, Input } from '../components/shared';
import './ProjectTools.css';

interface ToolData {
  _id: string;
  nama: string;
  kategori: string;
  stok: number;
  satuan: string;
  kondisi: string;
  lokasi: string;
  lastChecked?: string;
  assignedTo?: { _id: string; fullName: string; role: string };
  projectId?: { _id: string; nama: string };
}

interface UserOption {
  _id: string;
  fullName: string;
  role: string;
}

interface ProjectData {
  _id: string;
  nama: string;
  lokasi: string;
}

const CONDITION_CONFIG: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  'Baik': { color: '#059669', bg: '#D1FAE5', icon: CheckCircle2, label: 'Good' },
  'Maintenance': { color: '#D97706', bg: '#FEF3C7', icon: Settings, label: 'Service' },
  'Rusak': { color: '#DC2626', bg: '#FEE2E2', icon: AlertTriangle, label: 'Damaged' },
};

export default function ProjectTools() {
  const { t } = useTranslation();
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState<ProjectData | null>(null);
  const [tools, setTools] = useState<ToolData[]>([]);
  const [availableTools, setAvailableTools] = useState<ToolData[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ToolData | null>(null);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedToolToAdd, setSelectedToolToAdd] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canManageTools = user?.role && ['owner', 'director', 'supervisor', 'asset_admin'].includes(user.role);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      setError(null);

      const projectRes = await api.get(`/projects/${projectId}`);
      setProject(projectRes.data);

      const toolsRes = await api.get(`/tools/project/${projectId}`);
      setTools(toolsRes.data);

      if (canManageTools) {
        const availableRes = await api.get('/tools/available');
        setAvailableTools(availableRes.data);

        const usersRes = await api.get('/tasks/users/list');
        setUsers(usersRes.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch data', err);
      setError(err.response?.data?.msg || t('projectTools.messages.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddTool = async () => {
    if (!selectedToolToAdd) return;

    setSubmitting(true);
    try {
      await api.put(`/tools/${selectedToolToAdd}/assign`, {
        projectId: projectId,
      });
      await fetchData();
      setShowAddModal(false);
      setSelectedToolToAdd('');
    } catch (err: any) {
      console.error('Failed to add tool', err);
      alert(err.response?.data?.msg || t('projectTools.messages.addFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignUser = async () => {
    if (!selectedTool) return;

    setSubmitting(true);
    try {
      await api.put(`/tools/${selectedTool._id}/assign`, {
        projectId: projectId,
        assignedTo: selectedUser || null,
      });
      await fetchData();
      setShowAssignModal(false);
      setSelectedTool(null);
      setSelectedUser('');
    } catch (err: any) {
      console.error('Failed to assign user', err);
      alert(err.response?.data?.msg || t('projectTools.messages.assignFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturnToWarehouse = async (tool: ToolData) => {
    if (!confirm(t('projectTools.messages.returnConfirm', { name: tool.nama }))) return;

    try {
      await api.put(`/tools/${tool._id}/return`);
      await fetchData();
    } catch (err: any) {
      console.error('Failed to return tool', err);
      alert(err.response?.data?.msg || t('projectTools.messages.returnFailed'));
    }
  };

  const openAssignModal = (tool: ToolData) => {
    setSelectedTool(tool);
    setSelectedUser(tool.assignedTo?._id || '');
    setShowAssignModal(true);
  };

  const getConditionStyle = (kondisi: string) => {
    const config = CONDITION_CONFIG[kondisi];
    if (!config) return { color: '#94A3B8', bg: '#F1F5F9', icon: Package, label: t('tools.condition.na') };
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
      day: 'numeric', month: 'short'
    });
  };

  // Filtered tools
  const filteredTools = tools.filter(t =>
    !search || t.nama.toLowerCase().includes(search.toLowerCase()) ||
    t.kategori?.toLowerCase().includes(search.toLowerCase())
  );

  // Mini stats
  const statsGood = tools.filter(t => t.kondisi === 'Baik').length;
  const statsMaint = tools.filter(t => t.kondisi === 'Maintenance' || t.kondisi === 'Rusak').length;
  const statsAssigned = tools.filter(t => !!t.assignedTo).length;

  if (loading) {
    return (
      <div className="project-tools-container">
        <div className="loading-state">
          <div className="spinner" />
          <span>{t('projectTools.loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="project-tools-container">
      {/* Header */}
      <div className="pt-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <div className="pt-header-info">
          <h1 className="pt-title">{t('projectTools.title')}</h1>
          <p className="pt-subtitle">{project?.nama || t('projectTools.fallbackProject')}</p>
        </div>
        {canManageTools && (
          <Button
            title={t('projectTools.actions.addTool')}
            icon={Plus}
            onClick={() => setShowAddModal(true)}
            variant="primary"
            size="small"
          />
        )}
      </div>

      {/* Mini Stats */}
      {tools.length > 0 && (
        <div className="pt-stats-row">
          <div className="pt-stat">
            <Package size={16} color="var(--primary)" />
            <span className="pt-stat-value">{tools.length}</span>
            <span className="pt-stat-label">{t('projectTools.stats.total')}</span>
          </div>
          <div className="pt-stat-divider" />
          <div className="pt-stat">
            <CheckCircle2 size={16} color="#059669" />
            <span className="pt-stat-value" style={{ color: '#059669' }}>{statsGood}</span>
            <span className="pt-stat-label">{t('projectTools.stats.good')}</span>
          </div>
          <div className="pt-stat-divider" />
          <div className="pt-stat">
            <AlertTriangle size={16} color="#D97706" />
            <span className="pt-stat-value" style={{ color: '#D97706' }}>{statsMaint}</span>
            <span className="pt-stat-label">{t('projectTools.stats.attention')}</span>
          </div>
          <div className="pt-stat-divider" />
          <div className="pt-stat">
            <User size={16} color="#2563EB" />
            <span className="pt-stat-value" style={{ color: '#2563EB' }}>{statsAssigned}</span>
            <span className="pt-stat-label">{t('projectTools.stats.assigned')}</span>
          </div>
        </div>
      )}

      {/* Search */}
      {tools.length > 0 && (
        <Input
          placeholder={t('projectTools.searchPlaceholder')}
          value={search}
          onChangeText={setSearch}
          icon={Search}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Error */}
      {error && (
        <EmptyState
          icon={AlertCircle}
          title={t('projectTools.empty.error')}
          description={error}
        />
      )}

      {/* Empty State */}
      {!error && tools.length === 0 && (
        <EmptyState
          icon={Wrench}
          title={t('projectTools.empty.noAssignedTools')}
          description={canManageTools ? t('projectTools.empty.addFromWarehouse') : t('projectTools.empty.noAssignedWait')}
        />
      )}

      {/* Tools List */}
      {filteredTools.length > 0 && (
        <div className="pt-tools-list">
          {filteredTools.map((tool, index) => {
            const condStyle = getConditionStyle(tool.kondisi);
            const CondIcon = condStyle.icon;
            return (
              <Card
                key={tool._id}
                className="pt-tool-card"
                style={{
                  borderLeft: `4px solid ${condStyle.color}`,
                  animationDelay: `${index * 0.04}s`,
                }}
              >
                <div className="pt-tool-body">
                  <div className="pt-tool-icon" style={{ backgroundColor: condStyle.bg }}>
                    <Wrench size={22} color={condStyle.color} />
                  </div>
                  <div className="pt-tool-content">
                    <div className="pt-tool-top">
                      <h3 className="pt-tool-name">{tool.nama}</h3>
                      <span
                        className="pt-condition-badge"
                        style={{ backgroundColor: condStyle.bg, color: condStyle.color }}
                      >
                        <CondIcon size={12} />
                        {condStyle.label}
                      </span>
                    </div>
                    <div className="pt-tool-meta">
                      {tool.kategori && (
                        <span className="pt-meta-item">
                          <Package size={13} />
                          {tool.kategori}
                        </span>
                      )}
                      <span className="pt-meta-item">
                        <MapPin size={13} />
                        {tool.stok} {tool.satuan}
                      </span>
                      {tool.assignedTo && (
                        <span className="pt-meta-item pt-meta-user">
                          <User size={13} />
                          {tool.assignedTo.fullName}
                        </span>
                      )}
                      {tool.lastChecked && (
                        <span className="pt-meta-item">
                          <Calendar size={13} />
                          {formatDate(tool.lastChecked)}
                        </span>
                      )}
                    </div>
                  </div>
                  {canManageTools && (
                    <div className="pt-tool-actions">
                      <Button
                        title={tool.assignedTo ? t('projectTools.actions.reassign') : t('projectTools.actions.assign')}
                        icon={User}
                        onClick={() => openAssignModal(tool)}
                        variant="outline"
                        size="small"
                      />
                      <Button
                        title={t('projectTools.actions.return')}
                        icon={Warehouse}
                        onClick={() => handleReturnToWarehouse(tool)}
                        variant="danger"
                        size="small"
                      />
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* No search results */}
      {search && filteredTools.length === 0 && tools.length > 0 && (
        <EmptyState
          icon={Search}
          title={t('projectTools.empty.noResults')}
          description={t('projectTools.empty.noMatch', { search })}
        />
      )}

      {/* Add Tool Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('projectTools.modal.addTitle')}</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              {availableTools.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title={t('projectTools.empty.noToolsAvailable')}
                  description={t('projectTools.empty.allAssigned')}
                />
              ) : (
                <div className="form-group">
                  <label className="form-label">{t('projectTools.modal.selectTool')}</label>
                  <div className="select-wrapper">
                    <select
                      value={selectedToolToAdd}
                      onChange={(e) => setSelectedToolToAdd(e.target.value)}
                      className="form-select"
                    >
                      <option value="">{t('projectTools.modal.chooseTool')}</option>
                      {availableTools.map(t => (
                        <option key={t._id} value={t._id}>
                          {t.nama} ({t.kategori}) - {t.stok} {t.satuan}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="select-icon" />
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <Button
                title={t('projectTools.actions.cancel')}
                onClick={() => setShowAddModal(false)}
                variant="outline"
              />
              <Button
                title={t('projectTools.actions.addToProject')}
                onClick={handleAddTool}
                loading={submitting}
                variant="primary"
                disabled={!selectedToolToAdd}
              />
            </div>
          </div>
        </div>
      )}

      {/* Assign User Modal */}
      {showAssignModal && selectedTool && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('projectTools.modal.assignTitle')}</h2>
              <button className="modal-close" onClick={() => setShowAssignModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="selected-tool-info">
                <Wrench size={20} color="var(--primary)" />
                <span>{selectedTool.nama}</span>
              </div>

              <div className="form-group">
                <label className="form-label">{t('projectTools.modal.assignTo')}</label>
                <div className="select-wrapper">
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="form-select"
                  >
                    <option value="">{t('projectTools.modal.unassigned')}</option>
                    {users.map(u => (
                      <option key={u._id} value={u._id}>
                        {u.fullName} ({u.role})
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="select-icon" />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <Button
                title={t('projectTools.actions.cancel')}
                onClick={() => setShowAssignModal(false)}
                variant="outline"
              />
              <Button
                title={t('projectTools.actions.saveAssignment')}
                onClick={handleAssignUser}
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
