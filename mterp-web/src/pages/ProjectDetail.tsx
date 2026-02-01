import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, DollarSign, FileText, Wrench, ArrowLeft } from 'lucide-react';
import api from '../api/api';
import { Card, ProgressBar, Button, LoadingOverlay } from '../components/shared';
import { ProjectData } from '../types';
import './ProjectDetail.css';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const response = await api.get(`/projects/${id}`);
      setProject(response.data);
    } catch (err) {
      console.error('Failed to fetch project', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingOverlay visible={true} />;
  }

  if (!project) {
    return (
      <div className="project-detail-container">
        <p>Project not found</p>
      </div>
    );
  }

  const budget = project.totalBudget || project.budget || 0;
  const progress = project.progress || 0;

  return (
    <div className="project-detail-container">
      {/* Header */}
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="detail-title">{project.nama || project.name}</h1>
          <p className="detail-location">{project.lokasi || project.location}</p>
        </div>
      </div>

      {/* Progress Card */}
      <Card className="progress-card gradient-primary">
        <div className="progress-header">
          <span className="progress-label">Overall Progress</span>
          <span className="progress-value">{progress}%</span>
        </div>
        <div className="progress-bar-white">
          <div className="progress-fill-white" style={{ width: `${progress}%` }} />
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="stats-grid">
        <Card className="stat-card">
          <Calendar size={24} color="var(--primary)" />
          <div className="stat-content">
            <span className="stat-label">Timeline</span>
            <span className="stat-value">
              {project.startDate || project.globalDates?.planned?.start || 'TBD'}
            </span>
          </div>
        </Card>

        <Card className="stat-card">
          <DollarSign size={24} color="var(--success)" />
          <div className="stat-content">
            <span className="stat-label">Budget</span>
            <span className="stat-value">
              Rp {(budget / 1000000).toFixed(0)}M
            </span>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="actions-card">
        <h3 className="actions-title">Quick Actions</h3>
        <div className="actions-grid">
          <Button
            title="Daily Report"
            icon={FileText}
            onClick={() => navigate(`/daily-report?projectId=${id}`)}
            variant="outline"
            fullWidth
          />
          <Button
            title="Tool Inventory"
            icon={Wrench}
            onClick={() => navigate(`/project-tools/${id}`)}
            variant="outline"
            fullWidth
          />
        </div>
      </Card>

      {/* Description */}
      {project.description && (
        <Card className="description-card">
          <h3 className="section-title">Description</h3>
          <p className="description-text">{project.description}</p>
        </Card>
      )}
    </div>
  );
}
