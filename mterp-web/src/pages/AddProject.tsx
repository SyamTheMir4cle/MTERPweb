import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Upload, 
  Plus, 
  Trash2,
  FileText,
  Calendar,
  DollarSign
} from 'lucide-react';
import api from '../api/api';
import { Card, Button, Input, Alert, Badge } from '../components/shared';
import { ProjectData, WorkItem, ProjectSupply } from '../types';
import './AddProject.css';

const STEPS = ['Basic Info', 'Documents', 'Supply Plan', 'Work Items'];

export default function AddProject() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [alertData, setAlertData] = useState<{ visible: boolean; type: 'success' | 'error'; title: string; message: string }>({
    visible: false,
    type: 'success',
    title: '',
    message: '',
  });

  const [projectData, setProjectData] = useState({
    name: '',
    location: '',
    description: '',
    totalBudget: '',
    startDate: '',
    endDate: '',
  });

  const [documents, setDocuments] = useState<Record<string, File | null>>({
    shopDrawing: null,
    hse: null,
    manPowerList: null,
    materialList: null,
  });

  const [supplies, setSupplies] = useState<Partial<ProjectSupply>[]>([]);
  const [workItems, setWorkItems] = useState<Partial<WorkItem>[]>([]);

  const handleNext = () => {
    if (currentStep === 0 && (!projectData.name || !projectData.location)) {
      setAlertData({ visible: true, type: 'error', title: 'Error', message: 'Please fill project name and location.' });
      return;
    }
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('nama', projectData.name);
      formData.append('lokasi', projectData.location);
      formData.append('description', projectData.description);
      formData.append('totalBudget', projectData.totalBudget);
      formData.append('startDate', projectData.startDate);
      formData.append('endDate', projectData.endDate);
      formData.append('supplies', JSON.stringify(supplies));
      formData.append('workItems', JSON.stringify(workItems));

      Object.entries(documents).forEach(([key, file]) => {
        if (file) formData.append(key, file);
      });

      await api.post('/projects', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setAlertData({ visible: true, type: 'success', title: 'Success', message: 'Project created successfully!' });
      setTimeout(() => navigate('/projects'), 1500);
    } catch (err) {
      console.error('Failed to create project', err);
      setAlertData({ visible: true, type: 'error', title: 'Error', message: 'Failed to create project.' });
    } finally {
      setLoading(false);
    }
  };

  const addSupply = () => {
    setSupplies([...supplies, { id: Date.now().toString(), item: '', cost: 0, status: 'Pending' }]);
  };

  const addWorkItem = () => {
    setWorkItems([...workItems, { id: Date.now(), name: '', qty: 0, volume: 'M2', cost: 0 }]);
  };

  return (
    <div className="add-project-container">
      <Alert
        visible={alertData.visible}
        type={alertData.type}
        title={alertData.title}
        message={alertData.message}
        onClose={() => setAlertData({ ...alertData, visible: false })}
      />

      {/* Header */}
      <div className="add-header">
        <h1 className="add-title">Create Project</h1>
      </div>

      {/* Step Indicator */}
      <div className="steps-container">
        {STEPS.map((step, i) => (
          <div key={step} className={`step ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'done' : ''}`}>
            <div className="step-circle">
              {i < currentStep ? <Check size={14} /> : i + 1}
            </div>
            <span className="step-label">{step}</span>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card className="step-content">
        {currentStep === 0 && (
          <div className="form-section">
            <Input
              label="Project Name"
              placeholder="Enter project name"
              value={projectData.name}
              onChangeText={(t) => setProjectData({ ...projectData, name: t })}
            />
            <Input
              label="Location"
              placeholder="Project location"
              value={projectData.location}
              onChangeText={(t) => setProjectData({ ...projectData, location: t })}
            />
            <Input
              label="Description"
              placeholder="Brief project description"
              value={projectData.description}
              onChangeText={(t) => setProjectData({ ...projectData, description: t })}
              multiline
            />
            <Input
              label="Total Budget (Rp)"
              type="number"
              placeholder="e.g. 500000000"
              value={projectData.totalBudget}
              onChangeText={(t) => setProjectData({ ...projectData, totalBudget: t })}
              icon={DollarSign}
            />
            <div className="date-row">
              <Input
                label="Start Date"
                placeholder="YYYY-MM-DD"
                value={projectData.startDate}
                onChangeText={(t) => setProjectData({ ...projectData, startDate: t })}
                icon={Calendar}
              />
              <Input
                label="End Date"
                placeholder="YYYY-MM-DD"
                value={projectData.endDate}
                onChangeText={(t) => setProjectData({ ...projectData, endDate: t })}
                icon={Calendar}
              />
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="form-section">
            <h3>Upload Documents</h3>
            {['shopDrawing', 'hse', 'manPowerList', 'materialList'].map((docKey) => (
              <div key={docKey} className="doc-upload">
                <label className="doc-label">{docKey.replace(/([A-Z])/g, ' $1').toUpperCase()}</label>
                <label className="doc-input">
                  <Upload size={18} />
                  <span>{documents[docKey]?.name || 'Choose file'}</span>
                  <input
                    type="file"
                    onChange={(e) => setDocuments({ ...documents, [docKey]: e.target.files?.[0] || null })}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            ))}
          </div>
        )}

        {currentStep === 2 && (
          <div className="form-section">
            <div className="section-header">
              <h3>Supply Plan</h3>
              <Button title="Add" icon={Plus} onClick={addSupply} variant="outline" size="small" />
            </div>
            {supplies.map((s, i) => (
              <div key={s.id} className="supply-item">
                <Input
                  placeholder="Item name"
                  value={s.item || ''}
                  onChangeText={(t) => {
                    const updated = [...supplies];
                    updated[i].item = t;
                    setSupplies(updated);
                  }}
                />
                <Button
                  title=""
                  icon={Trash2}
                  onClick={() => setSupplies(supplies.filter((_, idx) => idx !== i))}
                  variant="danger"
                  size="small"
                />
              </div>
            ))}
            {supplies.length === 0 && <p className="empty-text">No supplies added yet.</p>}
          </div>
        )}

        {currentStep === 3 && (
          <div className="form-section">
            <div className="section-header">
              <h3>Work Items</h3>
              <Button title="Add" icon={Plus} onClick={addWorkItem} variant="outline" size="small" />
            </div>
            {workItems.map((w, i) => (
              <div key={w.id} className="work-item">
                <Input
                  placeholder="Work item name"
                  value={w.name || ''}
                  onChangeText={(t) => {
                    const updated = [...workItems];
                    updated[i].name = t;
                    setWorkItems(updated);
                  }}
                />
                <Button
                  title=""
                  icon={Trash2}
                  onClick={() => setWorkItems(workItems.filter((_, idx) => idx !== i))}
                  variant="danger"
                  size="small"
                />
              </div>
            ))}
            {workItems.length === 0 && <p className="empty-text">No work items added yet.</p>}
          </div>
        )}
      </Card>

      {/* Navigation Buttons */}
      <div className="nav-buttons">
        {currentStep > 0 && (
          <Button
            title="Back"
            icon={ChevronLeft}
            onClick={handleBack}
            variant="outline"
          />
        )}
        {currentStep < STEPS.length - 1 ? (
          <Button
            title="Next"
            icon={ChevronRight}
            iconPosition="right"
            onClick={handleNext}
            variant="primary"
          />
        ) : (
          <Button
            title="Create Project"
            icon={Check}
            onClick={handleSubmit}
            loading={loading}
            variant="success"
          />
        )}
      </div>
    </div>
  );
}
