import { useState, useEffect } from 'react';
import { Check, X, Inbox, AlertCircle } from 'lucide-react';
import api from '../api/api';
import { Card, Badge, Button, EmptyState } from '../components/shared';
import { ApprovalItem } from '../types';
import './Approvals.css';

export default function Approvals() {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      setError(null);
      const response = await api.get('/requests?status=Pending');
      // Map to ApprovalItem structure
      const mapped = response.data.map((r: any) => ({
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

  return (
    <div className="approvals-container">
      {/* Header - always shown */}
      <div className="approvals-header">
        <h1 className="approvals-title">Pending Approvals</h1>
        <Badge label={`${approvals.length} ITEMS`} variant="warning" size="medium" />
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
      {!loading && !error && approvals.length === 0 && (
        <EmptyState
          icon={Inbox}
          title="All Caught Up!"
          description="No pending approvals at this time."
        />
      )}

      {/* Approval List */}
      {!loading && !error && approvals.length > 0 && (
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
      )}
    </div>
  );
}
