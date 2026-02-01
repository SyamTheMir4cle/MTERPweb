import React, { useState, useEffect } from 'react';
import { Search, Wrench } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { getToolDashboard } from '../api/api';
import { Card, Input, Badge, EmptyState, LoadingOverlay } from '../components/shared';
import { Tool } from '../types';
import './Tools.css';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

export default function Tools() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await getToolDashboard(search);
      setTools(data.tools || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error('Failed to fetch tools', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  const pieData = stats ? [
    { name: 'Available', value: stats.available || 0 },
    { name: 'In Use', value: stats.inUse || 0 },
    { name: 'Maintenance', value: stats.maintenance || 0 },
    { name: 'Other', value: stats.other || 0 },
  ] : [];

  const getConditionBadge = (kondisi?: string) => {
    switch (kondisi?.toLowerCase()) {
      case 'baik':
        return <Badge label="BAIK" variant="success" />;
      case 'rusak':
        return <Badge label="RUSAK" variant="danger" />;
      case 'maintenance':
        return <Badge label="SERVICE" variant="warning" />;
      default:
        return <Badge label="N/A" variant="neutral" />;
    }
  };

  return (
    <div className="tools-container">
      <LoadingOverlay visible={loading} />

      {/* Header */}
      <div className="tools-header">
        <h1 className="tools-title">Tool Inventory</h1>
      </div>

      {/* Search */}
      <Input
        placeholder="Search tools..."
        value={search}
        onChangeText={setSearch}
        icon={Search}
        style={{ marginBottom: 20 }}
      />

      {/* Stats Chart */}
      {stats && (
        <Card className="tools-stats">
          <h3 className="stats-title">Inventory Overview</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="stats-summary">
            <div className="stat-item">
              <span className="stat-value">{stats.total || 0}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-item">
              <span className="stat-value" style={{ color: 'var(--success)' }}>{stats.available || 0}</span>
              <span className="stat-label">Available</span>
            </div>
            <div className="stat-item">
              <span className="stat-value" style={{ color: 'var(--warning)' }}>{stats.inUse || 0}</span>
              <span className="stat-label">In Use</span>
            </div>
          </div>
        </Card>
      )}

      {/* Tool List */}
      {tools.length === 0 && !loading ? (
        <EmptyState
          icon={Wrench}
          title="No Tools Found"
          description="Tools will appear here once added to inventory."
        />
      ) : (
        <div className="tools-list">
          {tools.map((tool) => (
            <Card key={tool._id} className="tool-card">
              <div className="tool-header">
                <h3 className="tool-name">{tool.nama}</h3>
                {getConditionBadge(tool.kondisi)}
              </div>
              <div className="tool-details">
                <span className="tool-detail">
                  <strong>Stock:</strong> {tool.stok} {tool.satuan}
                </span>
                {tool.lokasi && (
                  <span className="tool-detail">
                    <strong>Location:</strong> {tool.lokasi}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
