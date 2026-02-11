import { useState, useEffect } from 'react';
import { Check, X, Inbox, AlertCircle, DollarSign } from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, Badge, Button, EmptyState } from '../components/shared';
import { ApprovalItem, KasbonItem } from '../types';
import './Approvals.css';

export default function Approvals() {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [kasbons, setKasbons] = useState<KasbonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

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
      setError(err.response?.data?.msg || 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setProcessing(id);
    try {
      await api.put(`/requests/${id}`, {
        status: action === 'approve' ? 'Approved' : 'Rejected',
      });
      setApprovals((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error('Failed to process approval', err);
    } finally {
      setProcessing(null);
    }
  };

  const handleKasbonAction = async (id: string, action: 'approve' | 'reject') => {
    setProcessing(id);
    try {
      await api.put(`/kasbon/${id}`, {
        status: action === 'approve' ? 'Approved' : 'Rejected',
      });
      setKasbons((prev) => prev.filter((k) => k.id !== id));
    } catch (err) {
      console.error('Failed to process kasbon', err);
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
        return <Badge label="URGENT" variant="danger" />;
      case 'Low':
        return <Badge label="LOW" variant="neutral" />;
      default:
        return <Badge label="NORMAL" variant="primary" />;
    }
  };

  const totalItems = approvals.length + kasbons.length;

  return (
    <div className="approvals-container">
      {/* Header - always shown */}
      <div className="approvals-header">
        <h1 className="approvals-title">Pending Approvals</h1>
        <Badge label={`${totalItems} ITEMS`} variant="warning" size="medium" />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="approvals-loading">
          <div className="spinner"></div>
          <span>Loading approvals...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <EmptyState
          icon={AlertCircle}
          title="Error Loading"
          description={error}
        />
      )}

      {/* Empty State */}
      {!loading && !error && totalItems === 0 && (
        <EmptyState
          icon={Inbox}
          title="All Caught Up!"
          description="No pending approvals at this time."
        />
      )}

      {/* Material Request Approvals */}
      {!loading && !error && approvals.length > 0 && (
        <>
          <h2 className="section-label">Material Requests</h2>
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
                    <span className="approval-label">Item</span>
                    <span className="approval-value">{item.item}</span>
                  </div>
                  <div className="approval-row">
                    <span className="approval-label">Quantity</span>
                    <span className="approval-value">{item.qty}</span>
                  </div>
                  <div className="approval-row">
                    <span className="approval-label">Date Needed</span>
                    <span className="approval-value">{item.date}</span>
                  </div>
                  <div className="approval-row">
                    <span className="approval-label">Project</span>
                    <span className="approval-value">{item.project}</span>
                  </div>
                </div>

                <div className="approval-actions">
                  <Button
                    title="Reject"
                    icon={X}
                    onClick={() => handleAction(item.id, 'reject')}
                    variant="danger"
                    size="small"
                    loading={processing === item.id}
                  />
                  <Button
                    title="Approve"
                    icon={Check}
                    onClick={() => handleAction(item.id, 'approve')}
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
            Kasbon (Cash Advance)
            {kasbons.length > 0 && (
              <Badge label={`${kasbons.length}`} variant="warning" size="small" />
            )}
          </h2>

          {kasbons.length === 0 ? (
            <Card className="approval-card kasbon-empty">
              <p className="kasbon-empty-text">No pending kasbon requests.</p>
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
                    <Badge label="KASBON" variant="warning" />
                  </div>

                  <div className="approval-body">
                    <div className="approval-row">
                      <span className="approval-label">Amount</span>
                      <span className="approval-value kasbon-amount">{formatCurrency(item.amount)}</span>
                    </div>
                    <div className="approval-row">
                      <span className="approval-label">Reason</span>
                      <span className="approval-value">{item.reason}</span>
                    </div>
                    <div className="approval-row">
                      <span className="approval-label">Requested</span>
                      <span className="approval-value">{item.date}</span>
                    </div>
                  </div>

                  <div className="approval-actions">
                    <Button
                      title="Reject"
                      icon={X}
                      onClick={() => handleKasbonAction(item.id, 'reject')}
                      variant="danger"
                      size="small"
                      loading={processing === item.id}
                    />
                    <Button
                      title="Approve"
                      icon={Check}
                      onClick={() => handleKasbonAction(item.id, 'approve')}
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
    </div>
  );
}
