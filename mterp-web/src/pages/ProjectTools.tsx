import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Wrench, User, Warehouse, Plus, 
  ChevronDown, X, AlertCircle, Package
} from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, Badge, Button, EmptyState } from '../components/shared';
import './ProjectTools.css';

interface ToolData {
  _id: string;
  nama: string;
  kategori: string;
  stok: number;
  satuan: string;
  kondisi: string;
  lokasi: string;
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

export default function ProjectTools() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [project, setProject] = useState<ProjectData | null>(null);
  const [tools, setTools] = useState<ToolData[]>([]);
  const [availableTools, setAvailableTools] = useState<ToolData[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
      
      // Fetch project details
      const projectRes = await api.get(`/projects/${projectId}`);
      setProject(projectRes.data);
      
      // Fetch tools assigned to this project
      const toolsRes = await api.get(`/tools/project/${projectId}`);
      setTools(toolsRes.data);
      
      if (canManageTools) {
        // Fetch available tools
        const availableRes = await api.get('/tools/available');
        setAvailableTools(availableRes.data);
        
        // Fetch users
        const usersRes = await api.get('/tasks/users/list');
        setUsers(usersRes.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch data', err);
      setError(err.response?.data?.msg || 'Failed to load data');
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
      alert(err.response?.data?.msg || 'Failed to add tool');
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
      alert(err.response?.data?.msg || 'Failed to assign user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturnToWarehouse = async (tool: ToolData) => {
    if (!confirm(`Return "${tool.nama}" to warehouse?`)) return;
    
    try {
      await api.put(`/tools/${tool._id}/return`);
      await fetchData();
    } catch (err: any) {
      console.error('Failed to return tool', err);
      alert(err.response?.data?.msg || 'Failed to return tool');
    }
  };

  const openAssignModal = (tool: ToolData) => {
    setSelectedTool(tool);
    setSelectedUser(tool.assignedTo?._id || '');
    setShowAssignModal(true);
  };

  const getConditionBadge = (kondisi: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
      'Baik': 'success',
      'Maintenance': 'warning',
      'Rusak': 'danger',
    };
    return <Badge label={kondisi} variant={variants[kondisi] || 'neutral'} size="small" />;
  };

  if (loading) {
    return (
      <div className="project-tools-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="project-tools-container">
      {/* Header */}
      <div className="tools-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="tools-title">Tool Inventory</h1>
          <p className="tools-subtitle">{project?.nama || 'Project'}</p>
        </div>
        {canManageTools && (
          <Button 
            title="Add Tool" 
            icon={Plus} 
            onClick={() => setShowAddModal(true)}
            variant="primary"
            size="small"
          />
        )}
      </div>

      {/* Error */}
      {error && (
        <EmptyState
          icon={AlertCircle}
          title="Error"
          description={error}
        />
      )}

      {/* Empty State */}
      {!error && tools.length === 0 && (
        <EmptyState
          icon={Wrench}
          title="No Tools Assigned"
          description={canManageTools ? "Add tools from warehouse to this project." : "No tools have been assigned to this project yet."}
        />
      )}

      {/* Tools List */}
      {tools.length > 0 && (
        <div className="tools-list">
          {tools.map((tool) => (
            <Card key={tool._id} className="tool-card">
              <div className="tool-icon">
                <Wrench size={24} color="var(--primary)" />
              </div>
              <div className="tool-content">
                <div className="tool-header">
                  <h3 className="tool-name">{tool.nama}</h3>
                  {getConditionBadge(tool.kondisi)}
                </div>
                <div className="tool-meta">
                  <span className="tool-category">{tool.kategori}</span>
                  <span>•</span>
                  <span>{tool.stok} {tool.satuan}</span>
                </div>
                {tool.assignedTo && (
                  <div className="tool-assigned">
                    <User size={14} />
                    <span>{tool.assignedTo.fullName}</span>
                  </div>
                )}
              </div>
              {canManageTools && (
                <div className="tool-actions">
                  <Button
                    title={tool.assignedTo ? 'Reassign' : 'Assign User'}
                    icon={User}
                    onClick={() => openAssignModal(tool)}
                    variant="outline"
                    size="small"
                  />
                  <Button
                    title="Return"
                    icon={Warehouse}
                    onClick={() => handleReturnToWarehouse(tool)}
                    variant="danger"
                    size="small"
                  />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Add Tool Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Tool from Warehouse</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              {availableTools.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="No Tools Available"
                  description="All tools are currently assigned to projects."
                />
              ) : (
                <div className="form-group">
                  <label className="form-label">Select Tool</label>
                  <div className="select-wrapper">
                    <select
                      value={selectedToolToAdd}
                      onChange={(e) => setSelectedToolToAdd(e.target.value)}
                      className="form-select"
                    >
                      <option value="">Choose a tool...</option>
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
                title="Cancel"
                onClick={() => setShowAddModal(false)}
                variant="outline"
              />
              <Button
                title="Add to Project"
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
              <h2>Assign User to Tool</h2>
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
                <label className="form-label">Assign To</label>
                <div className="select-wrapper">
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="form-select"
                  >
                    <option value="">Unassigned (Team Use)</option>
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
                title="Cancel"
                onClick={() => setShowAssignModal(false)}
                variant="outline"
              />
              <Button
                title="Save Assignment"
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
