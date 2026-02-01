import React, { useState, useEffect } from 'react';
import { Plus, Truck } from 'lucide-react';
import api from '../api/api';
import { Card, Badge, Button, Input, EmptyState, LoadingOverlay } from '../components/shared';
import { MaterialRequest, ProjectData } from '../types';
import './Materials.css';

export default function Materials() {
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [formData, setFormData] = useState({
    item: '',
    qty: '',
    dateNeeded: '',
    purpose: '',
    costEstimate: '',
  });
  const [submitting, setSubmitting] = useState(false);

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
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.item || !formData.qty) {
      alert('Please fill required fields');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/requests', {
        ...formData,
        projectId: selectedProject?._id,
      });
      fetchData();
      setModalOpen(false);
      setFormData({ item: '', qty: '', dateNeeded: '', purpose: '', costEstimate: '' });
      setSelectedProject(null);
    } catch (err) {
      console.error('Failed to create request', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return <Badge label="APPROVED" variant="success" />;
      case 'Rejected':
        return <Badge label="REJECTED" variant="danger" />;
      default:
        return <Badge label="PENDING" variant="warning" />;
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'Pending').length;
  const approvedCount = requests.filter((r) => r.status === 'Approved').length;

  return (
    <div className="materials-container">
      <LoadingOverlay visible={loading} />

      {/* Header */}
      <div className="materials-header">
        <h1 className="materials-title">Material Requests</h1>
        <Button
          title="New Request"
          onClick={() => setModalOpen(true)}
          variant="primary"
          size="small"
          icon={Plus}
        />
      </div>

      {/* Stats */}
      <Card className="materials-stats">
        <div className="stat-row">
          <div className="stat-box">
            <span className="stat-value">{pendingCount}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat-box">
            <span className="stat-value" style={{ color: 'var(--success)' }}>{approvedCount}</span>
            <span className="stat-label">Approved</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{requests.length}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>
      </Card>

      {/* Request List */}
      {requests.length === 0 && !loading ? (
        <EmptyState
          icon={Truck}
          title="No Requests Yet"
          description="Create a new material request to get started."
        />
      ) : (
        <div className="materials-list">
          {requests.map((req) => (
            <Card key={req._id} className="request-card">
              <div className="request-header">
                <h3 className="request-item">{req.item}</h3>
                {getStatusBadge(req.status)}
              </div>
              <div className="request-details">
                <span>Qty: {req.qty}</span>
                <span>Needed: {req.dateNeeded}</span>
              </div>
              {req.purpose && <p className="request-purpose">{req.purpose}</p>}
            </Card>
          ))}
        </div>
      )}

      {/* Create Request Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>New Material Request</h3>

            <Input
              label="Item Name"
              placeholder="Material name"
              value={formData.item}
              onChangeText={(t) => setFormData({ ...formData, item: t })}
            />

            <Input
              label="Quantity"
              placeholder="e.g. 100 sak"
              value={formData.qty}
              onChangeText={(t) => setFormData({ ...formData, qty: t })}
            />

            <Input
              label="Date Needed"
              type="text"
              placeholder="YYYY-MM-DD"
              value={formData.dateNeeded}
              onChangeText={(t) => setFormData({ ...formData, dateNeeded: t })}
            />

            <Input
              label="Purpose / Notes"
              placeholder="Optional notes"
              value={formData.purpose}
              onChangeText={(t) => setFormData({ ...formData, purpose: t })}
              multiline
            />

            <div className="form-group">
              <label className="form-label">Link to Project</label>
              <Button
                title={selectedProject ? selectedProject.nama || selectedProject.name || 'Selected' : 'Select Project'}
                onClick={() => setProjectModalOpen(true)}
                variant="outline"
                size="medium"
                fullWidth
              />
            </div>

            <div className="modal-actions">
              <Button title="Cancel" onClick={() => setModalOpen(false)} variant="outline" />
              <Button title="Submit" onClick={handleSubmit} loading={submitting} />
            </div>
          </div>
        </div>
      )}

      {/* Project Selection Modal */}
      {projectModalOpen && (
        <div className="modal-overlay" onClick={() => setProjectModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Select Project</h3>
            <div className="project-list-modal">
              {projects.map((p) => (
                <Card
                  key={p._id}
                  className={`project-option ${selectedProject?._id === p._id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedProject(p);
                    setProjectModalOpen(false);
                  }}
                >
                  <span>{p.nama || p.name}</span>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
