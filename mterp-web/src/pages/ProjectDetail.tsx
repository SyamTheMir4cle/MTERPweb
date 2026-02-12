import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, DollarSign, FileText, Wrench, ArrowLeft, 
  TrendingUp, Package, BarChart3, Layers,
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import gsap from 'gsap';
import api from '../api/api';
import { Card, ProgressBar, Button, LoadingOverlay, Badge } from '../components/shared';
import { ProjectData, WorkItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import './ProjectDetail.css';

interface SCurveDataPoint {
  name: string;
  index: number;
  planned: number;      // Cumulative planned cost %
  actual: number;        // Cumulative actual cost %
  plannedCost: number;   // Absolute planned cost
  actualCost: number;    // Absolute actual cost
  weight: number;        // Individual weight %
  progress: number;      // Item progress %
}

const formatRupiah = (num: number) => {
  if (num >= 1_000_000_000) return `Rp ${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(0)}M`;
  if (num >= 1_000) return `Rp ${(num / 1_000).toFixed(0)}K`;
  return `Rp ${num}`;
};

// Custom tooltip for the S-Curve chart
const SCurveTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0]?.payload as SCurveDataPoint;
  if (!data) return null;

  return (
    <div className="scurve-tooltip">
      <div className="scurve-tooltip-title">{data.name}</div>
      <div className="scurve-tooltip-divider" />
      <div className="scurve-tooltip-row">
        <span className="scurve-tooltip-dot planned" />
        <span>Planned</span>
        <span className="scurve-tooltip-value">{data.planned.toFixed(1)}%</span>
      </div>
      <div className="scurve-tooltip-row">
        <span className="scurve-tooltip-dot actual" />
        <span>Actual</span>
        <span className="scurve-tooltip-value">{data.actual.toFixed(1)}%</span>
      </div>
      <div className="scurve-tooltip-divider" />
      <div className="scurve-tooltip-detail">
        <span>Weight: {data.weight.toFixed(1)}%</span>
        <span>Progress: {data.progress}%</span>
      </div>
      <div className="scurve-tooltip-detail">
        <span>Plan: {formatRupiah(data.plannedCost)}</span>
        <span>Act: {formatRupiah(data.actualCost)}</span>
      </div>
    </div>
  );
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);

  const chartRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const userRole = user?.role?.toLowerCase() || 'worker';
  const canSeeFinancials = ['owner', 'director', 'supervisor'].includes(userRole);

  useEffect(() => {
    fetchProject();
  }, [id]);

  useEffect(() => {
    if (project && !loading) {
      animateEntrance();
    }
  }, [project, loading]);

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

  const animateEntrance = () => {
    try {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // Animate stat cards
      if (statsRef.current) {
        const cards = statsRef.current.querySelectorAll('.card-component');
        if (cards.length > 0) {
          tl.fromTo(cards, 
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, clearProps: 'all' },
            0
          );
        }
      }

      // Animate chart
      if (chartRef.current) {
        tl.fromTo(chartRef.current,
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, clearProps: 'all' },
          0.2
        );

        // Animate the SVG paths (S-curve lines) with draw effect
        setTimeout(() => {
          try {
            const paths = chartRef.current?.querySelectorAll('.recharts-area-curve');
            if (paths) {
              paths.forEach((path: any) => {
                const length = path.getTotalLength?.();
                if (length) {
                  gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
                  gsap.to(path, {
                    strokeDashoffset: 0,
                    duration: 1.5,
                    ease: 'power2.inOut',
                  });
                }
              });
            }
          } catch (e) {
            console.warn('S-curve path animation failed', e);
          }
        }, 300);
      }

      // Animate tables
      if (tableRef.current) {
        const rows = tableRef.current.querySelectorAll('.table-row, .detail-table-card');
        if (rows.length > 0) {
          tl.fromTo(rows,
            { x: -20, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.4, stagger: 0.05, clearProps: 'all' },
            0.4
          );
        }
      }
    } catch (e) {
      console.warn('GSAP animation failed, content displayed without animation', e);
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
  const workItems = project.workItems || [];
  const supplies = project.supplies || [];

  // Calculate S-Curve data
  const totalPlannedCost = workItems.reduce((s, w) => s + (w.cost || 0), 0);
  const totalActualCost = workItems.reduce((s, w) => s + ((w as any).actualCost || 0), 0);

  const scurveData: SCurveDataPoint[] = (() => {
    if (workItems.length === 0) return [];
    
    // Start point
    const points: SCurveDataPoint[] = [{
      name: 'Start',
      index: 0,
      planned: 0,
      actual: 0,
      plannedCost: 0,
      actualCost: 0,
      weight: 0,
      progress: 0,
    }];

    let cumulativePlanned = 0;
    let cumulativeActual = 0;

    workItems.forEach((item, i) => {
      const weight = totalPlannedCost > 0 ? ((item.cost || 0) / totalPlannedCost) * 100 : 0;
      cumulativePlanned += weight;
      
      const actualWeight = totalPlannedCost > 0 
        ? ((item as any).actualCost || 0) / totalPlannedCost * 100 
        : 0;
      cumulativeActual += actualWeight;

      points.push({
        name: item.name || `Item ${i + 1}`,
        index: i + 1,
        planned: Math.min(cumulativePlanned, 100),
        actual: Math.min(cumulativeActual, 100),
        plannedCost: item.cost || 0,
        actualCost: (item as any).actualCost || 0,
        weight,
        progress: (item as any).progress || 0,
      });
    });

    return points;
  })();

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

      <div ref={statsRef}>
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
                {project.startDate || project.globalDates?.planned?.start
                  ? new Date(project.startDate || project.globalDates?.planned?.start || '').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                  : 'TBD'}
              </span>
            </div>
          </Card>

          <Card className="stat-card">
            <DollarSign size={24} color="var(--success)" />
            <div className="stat-content">
              <span className="stat-label">Budget</span>
              <span className="stat-value">{formatRupiah(budget)}</span>
            </div>
          </Card>

          {canSeeFinancials && (
            <>
              <Card className="stat-card">
                <TrendingUp size={24} color="var(--warning)" />
                <div className="stat-content">
                  <span className="stat-label">Planned Cost</span>
                  <span className="stat-value">{formatRupiah(totalPlannedCost)}</span>
                </div>
              </Card>

              <Card className="stat-card">
                <BarChart3 size={24} color="var(--info, #3B82F6)" />
                <div className="stat-content">
                  <span className="stat-label">Actual Cost</span>
                  <span className="stat-value">{formatRupiah(totalActualCost)}</span>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* S-Curve Chart — Only for privileged roles */}
      {canSeeFinancials && scurveData.length > 1 && (
        <div ref={chartRef}>
          <Card className="scurve-card">
            <div className="scurve-header">
              <div>
                <h3 className="scurve-title">S-Curve Progress</h3>
                <p className="scurve-subtitle">Planned vs Actual cumulative cost (%)</p>
              </div>
              <div className="scurve-legend">
                <span className="legend-item">
                  <span className="legend-dot planned" /> Planned
                </span>
                <span className="legend-item">
                  <span className="legend-dot actual" /> Actual
                </span>
              </div>
            </div>
            <div className="scurve-chart-wrapper">
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={scurveData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <defs>
                    <linearGradient id="plannedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--border)' }}
                    interval={0}
                    angle={-30}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--border)' }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip content={<SCurveTooltip />} />
                  <ReferenceLine y={50} stroke="var(--border)" strokeDasharray="5 5" opacity={0.4} />
                  <Area
                    type="monotone"
                    dataKey="planned"
                    stroke="#6366F1"
                    strokeWidth={3}
                    fill="url(#plannedGradient)"
                    dot={{ r: 4, fill: '#6366F1', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: '#6366F1', stroke: '#fff', strokeWidth: 2 }}
                    animationDuration={0}
                  />
                  <Area
                    type="monotone"
                    dataKey="actual"
                    stroke="#10B981"
                    strokeWidth={3}
                    fill="url(#actualGradient)"
                    dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }}
                    animationDuration={0}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* Work Items Table — Financial details only for privileged roles */}
      {workItems.length > 0 && (
        <div ref={tableRef}>
          <Card className="detail-table-card">
            <div className="detail-table-header">
              <Layers size={20} color="var(--primary)" />
              <h3>Work Items</h3>
              <Badge label={`${workItems.length} items`} variant="neutral" size="small" />
            </div>
            <div className="detail-table-scroll">
              <table className="detail-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    {canSeeFinancials && <th>Cost (Rp)</th>}
                    {canSeeFinancials && <th>Weight</th>}
                    <th>Progress</th>
                    {canSeeFinancials && <th>Actual Cost</th>}
                  </tr>
                </thead>
                <tbody>
                  {workItems.map((item, i) => {
                    const weight = totalPlannedCost > 0
                      ? ((item.cost || 0) / totalPlannedCost * 100).toFixed(1)
                      : '0';
                    return (
                      <tr key={(item as any)._id || i} className="table-row">
                        <td className="table-num">{i + 1}</td>
                        <td className="table-name">{item.name}</td>
                        <td>{item.qty || 0}</td>
                        <td>{(item as any).unit || item.volume || '-'}</td>
                        {canSeeFinancials && <td className="table-cost">{formatRupiah(item.cost || 0)}</td>}
                        {canSeeFinancials && (
                          <td>
                            <Badge label={`${weight}%`} variant="primary" size="small" />
                          </td>
                        )}
                        <td>
                          <div className="table-progress">
                            <div className="table-progress-bar">
                              <div 
                                className="table-progress-fill" 
                                style={{ width: `${(item as any).progress || 0}%` }} 
                              />
                            </div>
                            <span className="table-progress-text">{(item as any).progress || 0}%</span>
                          </div>
                        </td>
                        {canSeeFinancials && <td className="table-cost">{formatRupiah((item as any).actualCost || 0)}</td>}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Supply Plan Table */}
          {canSeeFinancials && supplies.length > 0 && (
            <Card className="detail-table-card">
              <div className="detail-table-header">
                <Package size={20} color="var(--warning)" />
                <h3>Supply Plan</h3>
                <Badge label={`${supplies.length} items`} variant="neutral" size="small" />
              </div>
              <div className="detail-table-scroll">
                <table className="detail-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Unit</th>
                      <th>Cost (Rp)</th>
                      <th>Weight</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplies.map((s: any, i: number) => {
                      const supplyWeight = budget > 0
                        ? ((s.cost || 0) / budget * 100).toFixed(1)
                        : '0';
                      return (
                        <tr key={s._id || i} className="table-row">
                          <td className="table-num">{i + 1}</td>
                          <td className="table-name">{s.item}</td>
                          <td>{s.qty || 0}</td>
                          <td>{s.unit || '-'}</td>
                          <td className="table-cost">{formatRupiah(s.cost || 0)}</td>
                          <td>
                            <Badge label={`${supplyWeight}%`} variant="warning" size="small" />
                          </td>
                          <td>
                            <Badge 
                              label={s.status || 'Pending'} 
                              variant={
                                s.status === 'Delivered' ? 'success' 
                                : s.status === 'Ordered' ? 'primary' 
                                : 'neutral'
                              } 
                              size="small" 
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

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
