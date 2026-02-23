import { useState, useEffect } from 'react';
import {
  Package, Plus, Search, CheckCircle2,
  Clock, XCircle, Trash2, Calendar, DollarSign,
  User, Folder, AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createMaterialRequest, updateMaterialRequestStatus, deleteMaterialRequest } from '../api/api';
import api from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, Input, EmptyState, LoadingOverlay } from '../components/shared';
import { MaterialRequest, ProjectData } from '../types';
import './Materials.css';

const EMPTY_FORM = {
  item: '',
  qty: '',
  dateNeeded: '',
  purpose: '',
  costEstimate: '',
  urgency: 'Normal' as const,
  projectId: '',
};

type FilterType = 'All' | 'Pending' | 'Approved' | 'Rejected';

export default function Materials() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [currentFilter, setCurrentFilter] = useState<FilterType>('All');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Approval/Rejection Modals
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const isAdmin = user?.role && ['owner', 'director', 'asset_admin'].includes(user.role.toLowerCase());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reqRes, projRes] = await Promise.all([
        api.get('/requests'),
        api.get('/projects'),
      ]);
      setRequests(reqRes.data);
      setProjects(projRes.data);
    } catch (err: any) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!formData.item.trim() || !formData.qty.trim() || !formData.dateNeeded) {
      alert(t('materials.messages.fillRequired'));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        costEstimate: Number(formData.costEstimate) || 0,
        projectId: formData.projectId || undefined,
      };

      await createMaterialRequest(payload);
      setShowAddModal(false);
      setFormData(EMPTY_FORM);
      await fetchData();
    } catch (err: any) {
      console.error('Failed to create request', err);
      alert(err.response?.data?.msg || t('materials.messages.submitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string, reason?: string) => {
    try {
      if (newStatus === 'Rejected' && !reason && rejectingId !== id) {
        // Open rejection modal instead
        setRejectingId(id);
        setRejectionReason('');
        return;
      }

      await updateMaterialRequestStatus(id, {
        status: newStatus,
        rejectionReason: reason
      });

      setRejectingId(null);
      await fetchData();
    } catch (err) {
      console.error('Failed to update status', err);
      alert(t('materials.messages.updateStatusFailed'));
    }
  };

  const handleDeleteRequest = async (id: string, itemName: string) => {
    if (!confirm(t('materials.messages.deleteConfirm', { name: itemName }))) return;
    try {
      await deleteMaterialRequest(id);
      await fetchData();
    } catch (err) {
      console.error('Failed to delete request', err);
      alert(t('materials.messages.deleteFailed'));
    }
  };

  const getPopulatedName = (field: any, defaultKey: string) => {
    if (!field) return '-';
    if (typeof field === 'string') return '-';
    return field[defaultKey] || '-';
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  // Stats calculation
  const stats = {
    Total: requests.length,
    Pending: requests.filter((r: MaterialRequest) => r.status === 'Pending').length,
    Approved: requests.filter((r: MaterialRequest) => r.status === 'Approved').length,
    Rejected: requests.filter((r: MaterialRequest) => r.status === 'Rejected').length,
  };

  // Filtered lists
  const filteredRequests = requests.filter((r: MaterialRequest) => {
    const matchesFilter = currentFilter === 'All' || r.status === currentFilter;
    const searchString = `${r.item} ${getPopulatedName(r.projectId, 'nama')} ${getPopulatedName(r.requestedBy, 'fullName')} ${r.purpose || ''}`.toLowerCase();
    const matchesSearch = searchString.includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const StatusIcon = {
    'Pending': Clock,
    'Approved': CheckCircle2,
    'Rejected': XCircle
  };

  if (loading) {
    return (
      <div className="mr-container">
        <LoadingOverlay visible={true} />
      </div>
    );
  }

  return (
    <div className="mr-container">
      {/* Premium Header */}
      <div className="mr-header">
        <div className="mr-header-left">
          <div className="mr-header-icon">
            <Package size={28} />
          </div>
          <div className="mr-header-text">
            <h1 className="mr-title">{t('materials.title')}</h1>
            <p className="mr-subtitle">{t('materials.subtitle')}</p>
          </div>
        </div>
        <div className="mr-header-right">
          <Button
            title={t('materials.actions.newRequest')}
            icon={Plus}
            onClick={() => setShowAddModal(true)}
            variant="primary"
          />
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="mr-stats-grid">
        <div className="mr-kpi mr-kpi-total">
          <div className="mr-kpi-info">
            <span className="mr-kpi-value">{stats.Total}</span>
            <span className="mr-kpi-label">{t('materials.stats.total')}</span>
          </div>
          <div className="mr-kpi-icon"><Package size={24} /></div>
        </div>
        <div className="mr-kpi mr-kpi-pending">
          <div className="mr-kpi-info">
            <span className="mr-kpi-value">{stats.Pending}</span>
            <span className="mr-kpi-label">{t('materials.stats.pending')}</span>
          </div>
          <div className="mr-kpi-icon"><Clock size={24} /></div>
        </div>
        <div className="mr-kpi mr-kpi-approved">
          <div className="mr-kpi-info">
            <span className="mr-kpi-value">{stats.Approved}</span>
            <span className="mr-kpi-label">{t('materials.stats.approved')}</span>
          </div>
          <div className="mr-kpi-icon"><CheckCircle2 size={24} /></div>
        </div>
        <div className="mr-kpi mr-kpi-rejected">
          <div className="mr-kpi-info">
            <span className="mr-kpi-value">{stats.Rejected}</span>
            <span className="mr-kpi-label">{t('materials.stats.rejected')}</span>
          </div>
          <div className="mr-kpi-icon"><XCircle size={24} /></div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mr-toolbar">
        <div className="mr-search">
          <Input
            placeholder={t('materials.searchPlaceholder')}
            value={search}
            onChangeText={setSearch}
            icon={Search}
          />
        </div>
        <div className="mr-filters">
          {(['All', 'Pending', 'Approved', 'Rejected'] as FilterType[]).map(f => {
            const labelMapping: Record<string, string> = {
              'All': t('tools.filter.all'), // Reusing tools 'All'
              'Pending': t('materials.stats.pending'),
              'Approved': t('materials.stats.approved'),
              'Rejected': t('materials.stats.rejected')
            };

            return (
              <button
                key={f}
                className={`mr-filter-btn ${currentFilter === f ? 'active' : ''}`}
                onClick={() => setCurrentFilter(f)}
              >
                {labelMapping[f]}
                <span className={`mr-filter-count mr-count-${f.toLowerCase()}`}>
                  {f === 'All' ? stats.Total : stats[f]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="mr-list">
        {filteredRequests.length === 0 ? (
          <EmptyState
            icon={Package}
            title={t('materials.empty.title')}
            description={search ? t('materials.empty.filtered', { search }) : t('materials.empty.default')}
          />
        ) : (
          filteredRequests.map((req: MaterialRequest, index: number) => {
            const IconComponent = StatusIcon[req.status as keyof typeof StatusIcon] || Package;
            const isRequester = typeof req.requestedBy === 'object' && req.requestedBy._id === (user as any)?._id;

            return (
              <Card
                key={req._id}
                className="mr-card"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className={`mr-card-border mr-border-${req.status.toLowerCase()}`} />
                <div className="mr-card-content">
                  
                  {/* Top Row */}
                  <div className="mr-card-top">
                    <div className="mr-item-info">
                      <div className="mr-item-title-row">
                        <h3 className="mr-item-name">{req.item}</h3>
                        {req.urgency === 'High' && (
                          <span className="mr-badge mr-badge-high"><AlertCircle size={12} /> {t('materials.card.highPriority')}</span>
                        )}
                      </div>
                      <div className="mr-meta-list">
                        <span className="mr-meta" title={t('materials.card.project')}>
                          <Folder size={14} />
                          {getPopulatedName(req.projectId, 'nama')}
                        </span>
                        <span className="mr-meta" title={t('materials.card.requester')}>
                          <User size={14} />
                          {getPopulatedName(req.requestedBy, 'fullName')}
                        </span>
                        <span className="mr-meta" title={t('materials.card.quantity')}>
                          <Package size={14} />
                          {req.qty}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mr-status-section">
                      <div className={`mr-status-pill mr-status-${req.status.toLowerCase()}`}>
                        <IconComponent size={14} />
                        {t(`materials.stats.${req.status.toLowerCase()}`)}
                      </div>
                    </div>
                  </div>

                  {/* Middle Row Details */}
                  <div className="mr-card-middle">
                    <div className="mr-detail-grid">
                      <div className="mr-detail-col">
                        <span className="mr-detail-label">{t('materials.card.dateNeeded')}</span>
                        <span className="mr-detail-value"><Calendar size={14}/> {req.dateNeeded}</span>
                      </div>
                      <div className="mr-detail-col">
                        <span className="mr-detail-label">{t('materials.card.costEstimate')}</span>
                        <span className="mr-detail-value"><DollarSign size={14}/> {req.costEstimate && typeof req.costEstimate === 'number' && req.costEstimate > 0 ? formatRupiah(req.costEstimate) : '-'}</span>
                      </div>
                      {req.status !== 'Pending' && req.approvedBy && (
                        <div className="mr-detail-col">
                          <span className="mr-detail-label">{t('materials.card.reviewedBy')}</span>
                          <span className="mr-detail-value"><User size={14}/> {getPopulatedName(req.approvedBy, 'fullName')}</span>
                        </div>
                      )}
                    </div>

                    {req.purpose && (
                      <div className="mr-purpose-box">
                        <span className="mr-detail-label">{t('materials.card.purpose')}</span>
                        <p>{req.purpose}</p>
                      </div>
                    )}

                    {req.status === 'Rejected' && req.rejectionReason && (
                      <div className="mr-rejection-box">
                        <AlertCircle size={16} />
                        <div>
                          <strong>{t('materials.card.rejectionReason')}</strong>
                          <p>{req.rejectionReason}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Admin / Requester Actions */}
                  {(isAdmin || isRequester) && (
                    <div className="mr-card-actions">
                      {isAdmin && req.status === 'Pending' && (
                        <div className="mr-admin-actions">
                          <Button 
                            title={t('materials.actions.approve')} 
                            size="small" 
                            variant="primary" 
                            icon={CheckCircle2} 
                            onClick={() => handleUpdateStatus(req._id!, 'Approved')}
                          />
                          <Button 
                            title={t('materials.actions.reject')} 
                            size="small" 
                            variant="danger" 
                            icon={XCircle} 
                            onClick={() => handleUpdateStatus(req._id!, 'Rejected')}
                          />
                        </div>
                      )}
                      
                      {isRequester && (req.status === 'Pending' || req.status === 'Rejected') && (
                        <Button 
                          title={t('materials.actions.delete')} 
                          size="small" 
                          variant="outline" 
                          icon={Trash2} 
                          onClick={() => handleDeleteRequest(req._id!, req.item)}
                        />
                      )}
                    </div>
                  )}

                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Add Request Modal Form */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('materials.modal.addTitle')}</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <XCircle size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">{t('materials.modal.itemName')} <span style={{color: 'red'}}>*</span></label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={t('materials.modal.itemNamePlaceholder')}
                  value={formData.item}
                  onChange={e => setFormData({ ...formData, item: e.target.value })}
                />
              </div>

              <div className="form-row" style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">{t('materials.modal.quantity')} <span style={{color: 'red'}}>*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={t('materials.modal.quantityPlaceholder')}
                    value={formData.qty}
                    onChange={e => setFormData({ ...formData, qty: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">{t('materials.modal.dateNeeded')} <span style={{color: 'red'}}>*</span></label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.dateNeeded}
                    onChange={e => setFormData({ ...formData, dateNeeded: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row" style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">{t('materials.modal.costEstimate')}</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder={t('materials.modal.costEstimatePlaceholder')}
                    value={formData.costEstimate}
                    onChange={e => setFormData({ ...formData, costEstimate: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">{t('materials.modal.urgency')}</label>
                  <select
                    className="form-input"
                    value={formData.urgency}
                    onChange={e => setFormData({ ...formData, urgency: e.target.value as any })}
                  >
                    <option value="Low">{t('materials.modal.urgencyOptions.low')}</option>
                    <option value="Normal">{t('materials.modal.urgencyOptions.normal')}</option>
                    <option value="High">{t('materials.modal.urgencyOptions.high')}</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">{t('materials.modal.assignProject')}</label>
                <select
                    className="form-input"
                    value={formData.projectId}
                    onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                  >
                    <option value="">{t('materials.modal.noProject')}</option>
                    {projects.map((p: ProjectData) => (
                      <option key={p._id} value={p._id}>{p.nama || p.name}</option>
                    ))}
                  </select>
              </div>

              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">{t('materials.modal.purpose')}</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  placeholder={t('materials.modal.purposePlaceholder')}
                  value={formData.purpose}
                  onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-footer">
              <Button title={t('materials.actions.cancel')} variant="outline" onClick={() => setShowAddModal(false)} />
              <Button title={t('materials.actions.submit')} variant="primary" onClick={handleCreateRequest} loading={submitting} />
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingId && (
        <div className="modal-overlay" onClick={() => setRejectingId(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('materials.modal.rejectTitle')}</h2>
              <button className="modal-close" onClick={() => setRejectingId(null)}>
                <XCircle size={24} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">{t('materials.modal.rejectionReason')} <span style={{color: 'red'}}>*</span></label>
                <textarea
                  className="form-input"
                  style={{ minHeight: '100px' }}
                  placeholder={t('materials.modal.rejectionPlaceholder')}
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <Button title={t('materials.actions.cancel')} variant="outline" onClick={() => setRejectingId(null)} />
              <Button 
                title={t('materials.actions.confirmRejection')} 
                variant="danger" 
                onClick={() => {
                  if (!rejectionReason.trim()) {
                    alert(t('materials.messages.reasonRequired'));
                    return;
                  }
                  handleUpdateStatus(rejectingId, 'Rejected', rejectionReason);
                }} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
