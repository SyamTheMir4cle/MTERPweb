import { useState, useEffect } from 'react';
import { Check, X, Inbox, AlertCircle, DollarSign, Shield, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, Badge, Button, EmptyState } from '../components/shared';
import { ApprovalItem, KasbonItem } from '../types';
import './Approvals.css';

export default function Approvals() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [kasbons, setKasbons] = useState<KasbonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  // Passphrase confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    type: 'request' | 'kasbon';
    id: string;
  }>({ open: false, type: 'request', id: '' });
  const [passphrase, setPassphrase] = useState('');
  const [passphraseError, setPassphraseError] = useState('');
  const [confirming, setConfirming] = useState(false);

  const isDirectorOrOwner = user?.role === 'director' || user?.role === 'owner';

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      setError(null);
      const [requestsRes, ...kasbonRes] = await Promise.all([
        api.get('/requests?status=Pending'),
        ...(isDirectorOrOwner ? [api.get('/kasbon?status=Pending')] : []),
      ]);

      // Map material requests
      const mapped = requestsRes.data.map((r: any) => ({
        id: r._id,
        requester: r.requestedBy?.fullName || r.requestedBy || 'Unknown',
        role: r.requestedBy?.role || 'Staff',
        item: r.item,
        qty: r.qty,
        urgency: r.urgency || 'Normal',
        date: r.dateNeeded || '-',
        project: r.projectId?.nama || 'General',
      }));
      setApprovals(mapped);

      // Map kasbon requests (director/owner only)
      if (isDirectorOrOwner && kasbonRes[0]) {
        const kasbonMapped = kasbonRes[0].data.map((k: any) => ({
          id: k._id,
          requester: k.userId?.fullName || 'Unknown',
          role: k.userId?.role || 'Staff',
          amount: k.amount,
          reason: k.reason || '-',
          date: new Date(k.createdAt).toLocaleDateString('id-ID'),
        }));
        setKasbons(kasbonMapped);
      }
    } catch (err: any) {
      console.error('Failed to fetch approvals', err);
      setError(err.response?.data?.msg || t('approvals.messages.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Open confirmation modal for approvals
  const openConfirmApprove = (id: string, type: 'request' | 'kasbon') => {
    setConfirmModal({ open: true, type, id });
    setPassphrase('');
    setPassphraseError('');
  };

  const closeConfirmModal = () => {
    setConfirmModal({ open: false, type: 'request', id: '' });
    setPassphrase('');
    setPassphraseError('');
  };

  // Confirm approval with passphrase
  const handleConfirmApprove = async () => {
    if (passphrase.length < 4) return;
    setConfirming(true);
    setPassphraseError('');
    try {
      const { type, id } = confirmModal;
      if (type === 'request') {
        await api.put(`/requests/${id}`, {
          status: 'Approved',
          passphrase,
        });
        setApprovals((prev) => prev.filter((a) => a.id !== id));
      } else {
        await api.put(`/kasbon/${id}`, {
          status: 'Approved',
          passphrase,
        });
        setKasbons((prev) => prev.filter((k) => k.id !== id));
      }
      closeConfirmModal();
    } catch (err: any) {
      const msg = err?.response?.data?.msg || t('approvals.messages.approveFailed');
      setPassphraseError(msg);
    } finally {
      setConfirming(false);
    }
  };

  // Reject without passphrase
  const handleReject = async (id: string, type: 'request' | 'kasbon') => {
    setProcessing(id);
    try {
      if (type === 'request') {
        await api.put(`/requests/${id}`, { status: 'Rejected' });
        setApprovals((prev) => prev.filter((a) => a.id !== id));
      } else {
        await api.put(`/kasbon/${id}`, { status: 'Rejected' });
        setKasbons((prev) => prev.filter((k) => k.id !== id));
      }
    } catch (err) {
      console.error('Failed to reject', err);
    } finally {
      setProcessing(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'High':
        return <Badge label={t('approvals.materialRequests.urgency.urgent')} variant="danger" />;
      case 'Low':
        return <Badge label={t('approvals.materialRequests.urgency.low')} variant="neutral" />;
      default:
        return <Badge label={t('approvals.materialRequests.urgency.normal')} variant="primary" />;
    }
  };

  const totalItems = approvals.length + kasbons.length;

  return (
    <div className="approvals-container">
      {/* Header - always shown */}
      <div className="approvals-header">
        <h1 className="approvals-title">{t('approvals.title')}</h1>
        <Badge label={t('approvals.itemsCount', { count: totalItems })} variant="warning" size="medium" />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="approvals-loading">
          <div className="spinner"></div>
          <span>{t('approvals.loading')}</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <EmptyState
          icon={AlertCircle}
          title={t('approvals.errorLoading')}
          description={error}
        />
      )}

      {/* Empty State */}
      {!loading && !error && totalItems === 0 && (
        <EmptyState
          icon={Inbox}
          title={t('approvals.empty.title')}
          description={t('approvals.empty.desc')}
        />
      )}

      {/* Material Request Approvals */}
      {!loading && !error && approvals.length > 0 && (
        <>
          <h2 className="section-label">{t('approvals.materialRequests.title')}</h2>
          <div className="approvals-list">
            {approvals.map((item) => (
              <Card key={item.id} className="approval-card">
                <div className="approval-header">
                  <div>
                    <h3 className="approval-requester">{item.requester}</h3>
                    <span className="approval-role">{item.role}</span>
                  </div>
                  {getUrgencyBadge(item.urgency)}
                </div>

                <div className="approval-body">
                  <div className="approval-row">
                    <span className="approval-label">{t('approvals.materialRequests.item')}</span>
                    <span className="approval-value">{item.item}</span>
                  </div>
                  <div className="approval-row">
                    <span className="approval-label">{t('approvals.materialRequests.qty')}</span>
                    <span className="approval-value">{item.qty}</span>
                  </div>
                  <div className="approval-row">
                    <span className="approval-label">{t('approvals.materialRequests.dateNeeded')}</span>
                    <span className="approval-value">{item.date}</span>
                  </div>
                  <div className="approval-row">
                    <span className="approval-label">{t('approvals.materialRequests.project')}</span>
                    <span className="approval-value">{item.project}</span>
                  </div>
                </div>

                <div className="approval-actions">
                  <Button
                    title={t('approvals.actions.reject')}
                    icon={X}
                    onClick={() => handleReject(item.id, 'request')}
                    variant="danger"
                    size="small"
                    loading={processing === item.id}
                  />
                  <Button
                    title={t('approvals.actions.approve')}
                    icon={Check}
                    onClick={() => openConfirmApprove(item.id, 'request')}
                    variant="success"
                    size="small"
                    loading={processing === item.id}
                  />
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Kasbon Approvals - Director/Owner Only */}
      {!loading && !error && isDirectorOrOwner && (
        <>
          <h2 className="section-label kasbon-section-label">
            <DollarSign size={20} />
            {t('approvals.kasbon.title')}
            {kasbons.length > 0 && (
              <Badge label={`${kasbons.length}`} variant="warning" size="small" />
            )}
          </h2>

          {kasbons.length === 0 ? (
            <Card className="approval-card kasbon-empty">
              <p className="kasbon-empty-text">{t('approvals.kasbon.empty')}</p>
            </Card>
          ) : (
            <div className="approvals-list">
              {kasbons.map((item) => (
                <Card key={item.id} className="approval-card kasbon-card">
                  <div className="approval-header">
                    <div>
                      <h3 className="approval-requester">{item.requester}</h3>
                      <span className="approval-role">{item.role}</span>
                    </div>
                    <Badge label={t('approvals.kasbon.badge')} variant="warning" />
                  </div>

                  <div className="approval-body">
                    <div className="approval-row">
                      <span className="approval-label">{t('approvals.kasbon.amount')}</span>
                      <span className="approval-value kasbon-amount">{formatCurrency(item.amount)}</span>
                    </div>
                    <div className="approval-row">
                      <span className="approval-label">{t('approvals.kasbon.reason')}</span>
                      <span className="approval-value">{item.reason}</span>
                    </div>
                    <div className="approval-row">
                      <span className="approval-label">{t('approvals.kasbon.requested')}</span>
                      <span className="approval-value">{item.date}</span>
                    </div>
                  </div>

                  <div className="approval-actions">
                    <Button
                      title={t('approvals.actions.reject')}
                      icon={X}
                      onClick={() => handleReject(item.id, 'kasbon')}
                      variant="danger"
                      size="small"
                      loading={processing === item.id}
                    />
                    <Button
                      title={t('approvals.actions.approve')}
                      icon={Check}
                      onClick={() => openConfirmApprove(item.id, 'kasbon')}
                      variant="success"
                      size="small"
                      loading={processing === item.id}
                    />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Passphrase Confirmation Modal */}
      {confirmModal.open && (
        <div className="approval-modal-overlay" onClick={closeConfirmModal}>
          <div className="approval-modal" onClick={(e) => e.stopPropagation()}>
            <div className="approval-modal-body">
              <div className="approval-modal-icon">
                <Lock size={28} />
              </div>
              <h3 className="approval-modal-title">{t('approvals.confirmModal.title')}</h3>
              <p className="approval-modal-desc">{t('approvals.confirmModal.desc')}</p>

              <div className="approval-modal-input-wrap">
                <Shield size={16} className="approval-modal-input-icon" />
                <input
                  type="password"
                  className={`approval-modal-input ${passphraseError ? 'approval-modal-input-error' : ''}`}
                  value={passphrase}
                  onChange={(e) => { setPassphrase(e.target.value); setPassphraseError(''); }}
                  placeholder={t('approvals.confirmModal.placeholder')}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter' && passphrase.length >= 4) handleConfirmApprove(); }}
                />
              </div>
              {passphraseError && <p className="approval-modal-error">{passphraseError}</p>}

              <div className="approval-modal-actions">
                <button className="approval-modal-btn-cancel" onClick={closeConfirmModal}>
                  {t('approvals.confirmModal.btnCancel')}
                </button>
                <button
                  className="approval-modal-btn-approve"
                  onClick={handleConfirmApprove}
                  disabled={passphrase.length < 4 || confirming}
                >
                  {confirming ? (
                    <><div className="spinner-small"></div> {t('approvals.confirmModal.btnApproving')}</>
                  ) : (
                    <><Check size={16} /> {t('approvals.confirmModal.btnApprove')}</>
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
