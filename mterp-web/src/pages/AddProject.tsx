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
  DollarSign,
  Package,
  Hash,
  Percent,
} from 'lucide-react';
import api from '../api/api';
import { Card, Button, Input, Alert, Badge, CostInput } from '../components/shared';
import { ProjectData, WorkItem, ProjectSupply } from '../types';
import './AddProject.css';

const STEPS = ['Basic Info', 'Documents', 'Supply Plan', 'Work Items'];

const UNIT_OPTIONS = ['pcs', 'kg', 'sak', 'btg', 'lbr', 'unit', 'set', 'roll', 'ltr', 'M2', 'M3', 'M1'];

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

  const totalBudget = Number(projectData.totalBudget) || 0;

  // Calculate total costs
  const totalSupplyCost = supplies.reduce((sum, s) => sum + (Number(s.cost) || 0), 0);
  const totalWorkItemCost = workItems.reduce((sum, w) => sum + (Number(w.cost) || 0), 0);

  const getWeight = (cost: number) => {
    if (totalBudget <= 0) return 0;
    return Number(((cost / totalBudget) * 100).toFixed(1));
  };

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
    setSupplies([...supplies, { id: Date.now().toString(), item: '', qty: 0, unit: 'pcs', cost: 0, status: 'Pending', deadline: '', actualPurchaseDate: '' }]);
  };

  const updateSupply = (index: number, field: string, value: any) => {
    const updated = [...supplies];
    (updated[index] as any)[field] = value;
    setSupplies(updated);
  };

  const addWorkItem = () => {
    setWorkItems([...workItems, { id: Date.now(), name: '', qty: 0, volume: 'M2', unit: 'M2', cost: 0, dates: { plannedStart: '', plannedEnd: '' } } as any]);
  };

  const updateWorkItem = (index: number, field: string, value: any) => {
    const updated = [...workItems];
    (updated[index] as any)[field] = value;
    setWorkItems(updated);
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
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
        {/* Step 0: Basic Info */}
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
            <CostInput
              label="Total Budget (Rp)"
              placeholder="e.g. 500000000"
              value={Number(projectData.totalBudget) || 0}
              onChange={(v) => setProjectData({ ...projectData, totalBudget: v.toString() })}
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

        {/* Step 1: Documents */}
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

        {/* Step 2: Supply Plan */}
        {currentStep === 2 && (
          <div className="form-section">
            <div className="section-header">
              <h3>Supply Plan</h3>
              <Button title="Add" icon={Plus} onClick={addSupply} variant="outline" size="small" />
            </div>

            {/* Summary */}
            {supplies.length > 0 && (
              <div className="cost-summary">
                <span>Total Supply Cost</span>
                <span className="cost-summary-value">Rp {formatRupiah(totalSupplyCost)}</span>
                {totalBudget > 0 && (
                  <Badge label={`${((totalSupplyCost / totalBudget) * 100).toFixed(1)}% of budget`} variant="primary" size="small" />
                )}
              </div>
            )}

            {supplies.map((s, i) => (
              <div key={s.id} className="item-card">
                <div className="item-card-header">
                  <span className="item-card-number">#{i + 1}</span>
                  {totalBudget > 0 && (Number(s.cost) || 0) > 0 && (
                    <Badge
                      label={`${getWeight(Number(s.cost) || 0)}%`}
                      variant="primary"
                      size="small"
                    />
                  )}
                  <button
                    className="item-delete-btn"
                    onClick={() => setSupplies(supplies.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="item-card-body">
                  <div className="item-field item-field-full">
                    <Input
                      label="Item Name"
                      placeholder="e.g. Semen Tiga Roda"
                      value={s.item || ''}
                      onChangeText={(t) => updateSupply(i, 'item', t)}
                    />
                  </div>
                  <div className="item-field-row">
                    <div className="item-field">
                      <Input
                        label="Qty"
                        type="number"
                        placeholder="0"
                        value={String(s.qty || '')}
                        onChangeText={(t) => updateSupply(i, 'qty', Number(t) || 0)}
                      />
                    </div>
                    <div className="item-field">
                      <label className="form-label-sm">Unit</label>
                      <select
                        className="form-select-sm"
                        value={s.unit || 'pcs'}
                        onChange={(e) => updateSupply(i, 'unit', e.target.value)}
                      >
                        {UNIT_OPTIONS.map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                    <div className="item-field">
                      <CostInput
                        label="Cost (Rp)"
                        placeholder="0"
                        value={Number(s.cost) || 0}
                        onChange={(v) => updateSupply(i, 'cost', v)}
                      />
                    </div>
                  </div>
                  <div className="item-field-row">
                    <div className="item-field">
                      <Input
                        label="Start Date"
                        type="date"
                        placeholder="YYYY-MM-DD"
                        value={(s as any).startDate || ''}
                        onChangeText={(t) => updateSupply(i, 'startDate', t)}
                        icon={Calendar}
                      />
                    </div>
                    <div className="item-field">
                      <Input
                        label="End Date"
                        type="date"
                        placeholder="YYYY-MM-DD"
                        value={(s as any).endDate || ''}
                        onChangeText={(t) => updateSupply(i, 'endDate', t)}
                        icon={Calendar}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {supplies.length === 0 && <p className="empty-text">No supplies added yet.</p>}
          </div>
        )}

        {/* Step 3: Work Items */}
        {currentStep === 3 && (
          <div className="form-section">
            <div className="section-header">
              <h3>Work Items</h3>
              <Button title="Add" icon={Plus} onClick={addWorkItem} variant="outline" size="small" />
            </div>

            {/* Summary */}
            {workItems.length > 0 && (
              <div className="cost-summary">
                <span>Total Work Item Cost</span>
                <span className="cost-summary-value">Rp {formatRupiah(totalWorkItemCost)}</span>
                {totalBudget > 0 && (
                  <Badge label={`${((totalWorkItemCost / totalBudget) * 100).toFixed(1)}% of budget`} variant="primary" size="small" />
                )}
              </div>
            )}

            {workItems.map((w, i) => (
              <div key={w.id} className="item-card">
                <div className="item-card-header">
                  <span className="item-card-number">#{i + 1}</span>
                  {totalBudget > 0 && (Number(w.cost) || 0) > 0 && (
                    <Badge
                      label={`${getWeight(Number(w.cost) || 0)}%`}
                      variant="warning"
                      size="small"
                    />
                  )}
                  <button
                    className="item-delete-btn"
                    onClick={() => setWorkItems(workItems.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="item-card-body">
                  <div className="item-field item-field-full">
                    <Input
                      label="Work Item Name"
                      placeholder="e.g. Pekerjaan Pondasi"
                      value={w.name || ''}
                      onChangeText={(t) => updateWorkItem(i, 'name', t)}
                    />
                  </div>
                  <div className="item-field-row">
                    <div className="item-field">
                      <Input
                        label="Qty"
                        type="number"
                        placeholder="0"
                        value={String(w.qty || '')}
                        onChangeText={(t) => updateWorkItem(i, 'qty', Number(t) || 0)}
                      />
                    </div>
                    <div className="item-field">
                      <label className="form-label-sm">Unit</label>
                      <select
                        className="form-select-sm"
                        value={w.unit || w.volume || 'M2'}
                        onChange={(e) => {
                          updateWorkItem(i, 'unit', e.target.value);
                          updateWorkItem(i, 'volume', e.target.value);
                        }}
                      >
                        {UNIT_OPTIONS.map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                    <div className="item-field">
                      <CostInput
                        label="Cost (Rp)"
                        placeholder="0"
                        value={Number(w.cost) || 0}
                        onChange={(v) => updateWorkItem(i, 'cost', v)}
                      />
                    </div>
                  </div>
                  <div className="item-field-row">
                    <div className="item-field">
                      <Input
                        label="Start Date"
                        type="date"
                        placeholder="YYYY-MM-DD"
                        value={(w as any).startDate || (w as any).dates?.plannedStart || ''}
                        onChangeText={(t) => updateWorkItem(i, 'startDate', t)}
                        icon={Calendar}
                      />
                    </div>
                    <div className="item-field">
                      <Input
                        label="End Date"
                        type="date"
                        placeholder="YYYY-MM-DD"
                        value={(w as any).endDate || (w as any).dates?.plannedEnd || ''}
                        onChangeText={(t) => updateWorkItem(i, 'endDate', t)}
                        icon={Calendar}
                      />
                    </div>
                  </div>
                </div>
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
