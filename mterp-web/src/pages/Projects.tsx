import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ChevronRight, Briefcase } from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, Badge, ProgressBar, Button, Input, EmptyState, LoadingOverlay } from '../components/shared';
import { ProjectData } from '../types';
import './Projects.css';

export default function Projects() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = user?.role?.toLowerCase() || 'worker';

  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [progressInput, setProgressInput] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (err) {
      console.error('Failed to fetch projects', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus project ini?')) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      console.error('Failed to delete project', err);
    }
  };

  const handleUpdateProgress = async () => {
    if (!selectedProject) return;
    setUpdating(true);
    try {
      await api.put(`/projects/${selectedProject._id}/progress`, {
        progress: Number(progressInput),
      });
      fetchProjects();
      setModalOpen(false);
      setProgressInput('');
      setSelectedProject(null);
    } catch (err) {
      console.error('Failed to update progress', err);
    } finally {
      setUpdating(false);
    }
  };

  const openUpdateModal = (project: ProjectData) => {
    setSelectedProject(project);
    setProgressInput(String(project.progress || 0));
    setModalOpen(true);
  };

  const getStatusBadge = (progress: number) => {
    if (progress >= 100) return <Badge label="Completed" variant="success" />;
    if (progress > 0) return <Badge label="In Progress" variant="primary" />;
    return <Badge label="Pending" variant="neutral" />;
  };

  return (
    <div className="projects-container">
      <LoadingOverlay visible={loading} />

      {/* Header */}
      <div className="projects-header">
        <h1 className="projects-title">Projects</h1>
        {userRole === 'owner' && (
          <Button
            title="Add"
            onClick={() => navigate('/add-project')}
            variant="primary"
            size="small"
            icon={Plus}
          />
        )}
      </div>

      {/* Summary Card for Director/Owner */}
      {['director', 'owner'].includes(userRole) && projects.length > 0 && (
        <Card className="projects-summary">
          <div className="summary-row">
            <span className="summary-label">Total Projects</span>
            <span className="summary-value">{projects.length}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Avg Progress</span>
            <span className="summary-value">
              {Math.round(projects.reduce((a, p) => a + (p.progress || 0), 0) / projects.length)}%
            </span>
          </div>
        </Card>
      )}

      {/* Project List */}
      {projects.length === 0 && !loading ? (
        <EmptyState
          icon={Briefcase}
          title="No Projects"
          description="Projects will appear here once added."
        />
      ) : (
        <div className="projects-list">
          {projects.map((project) => (
            <Card key={project._id} className="project-card" onClick={() => navigate(`/project/${project._id}`)}>
              <div className="project-header">
                <div>
                  <h3 className="project-name">{project.nama || project.name}</h3>
                  <p className="project-location">{project.lokasi || project.location}</p>
                </div>
                <div className="project-actions">
                  {getStatusBadge(project.progress || 0)}
                </div>
              </div>

              <ProgressBar
                progress={project.progress || 0}
                showLabel={false}
                style={{ marginTop: 12 }}
              />
              <span className="project-progress-label">{project.progress || 0}% Complete</span>

              <div className="project-footer">
                {userRole === 'supervisor' && (
                  <Button
                    title="Update"
                    onClick={(e: any) => {
                      e.stopPropagation();
                      openUpdateModal(project);
                    }}
                    variant="outline"
                    size="small"
                  />
                )}
                {userRole === 'owner' && (
                  <Button
                    title=""
                    icon={Trash2}
                    onClick={(e: any) => {
                      e.stopPropagation();
                      handleDelete(project._id!);
                    }}
                    variant="danger"
                    size="small"
                  />
                )}
                <ChevronRight size={20} color="var(--text-muted)" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Update Progress Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Update Progress</h3>
            <p>{selectedProject?.nama || selectedProject?.name}</p>
            <Input
              type="number"
              placeholder="Progress %"
              value={progressInput}
              onChangeText={setProgressInput}
            />
            <div className="modal-actions">
              <Button
                title="Cancel"
                onClick={() => setModalOpen(false)}
                variant="outline"
              />
              <Button
                title="Save"
                onClick={handleUpdateProgress}
                loading={updating}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
