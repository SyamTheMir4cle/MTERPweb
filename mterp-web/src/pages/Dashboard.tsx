import { useState, useEffect } from 'react';
import {
    BarChart3,
    TrendingUp,
    DollarSign,
    ClipboardList,
    Users,
    AlertCircle,
    Package,
    ChevronDown,
    Loader,
    Clock,
    UserCheck,
    Wallet,
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Legend,
} from 'recharts';
import api from '../api/api';
import { Card } from '../components/shared';
import './Dashboard.css';

interface WorkerEntry {
    _id: string;
    name: string;
    role: string;
    status: string;
    checkIn: string | null;
    checkOut: string | null;
    project: string;
    dailyRate: number;
    overtimePay: number;
    wageType: string;
    paymentStatus: string;
}

interface WeeklyTrendEntry {
    date: string;
    dayLabel: string;
    present: number;
    late: number;
    absent: number;
    permit: number;
    total: number;
}

interface WageSummary {
    totalWages: number;
    totalPaid: number;
    totalUnpaid: number;
    totalOvertime: number;
    recordsPaid: number;
    recordsUnpaid: number;
}

interface DashboardData {
    projectList: { _id: string; nama: string }[];
    totalProjects: number;
    statusCounts: Record<string, number>;
    totalBudget: number;
    actualSpend: number;
    avgProgress: number;
    taskStatusCounts: Record<string, number>;
    totalTasks: number;
    attendanceCounts: Record<string, number>;
    totalAttendanceToday: number;
    totalUnpaid: number;
    pendingRequests: number;
    progressTimeline: { date: string; progress: number }[];
    // Enhanced attendance
    todayWorkers: WorkerEntry[];
    weeklyTrend: WeeklyTrendEntry[];
    wageSummary: WageSummary;
    totalWorkers: number;
}

const TASK_COLORS: Record<string, string> = {
    pending: '#F59E0B',
    in_progress: '#3B82F6',
    completed: '#10B981',
    cancelled: '#94A3B8',
};

const TASK_LABELS: Record<string, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
};

const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
    Present: { color: '#059669', bg: '#D1FAE5' },
    Late: { color: '#D97706', bg: '#FEF3C7' },
    Absent: { color: '#DC2626', bg: '#FEE2E2' },
    'Half-day': { color: '#6366F1', bg: '#EEF2FF' },
    Permit: { color: '#8B5CF6', bg: '#EDE9FE' },
};

const formatCurrency = (val: number): string => {
    if (val >= 1_000_000_000) return `Rp ${(val / 1_000_000_000).toFixed(1)}B`;
    if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `Rp ${(val / 1_000).toFixed(0)}K`;
    return `Rp ${val.toLocaleString('id-ID')}`;
};

const formatTime = (dateStr: string | null): string => {
    if (!dateStr) return '--:--';
    return new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

export default function Dashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);

    useEffect(() => {
        fetchDashboard();
    }, [selectedProject]);

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            const params = selectedProject ? `?projectId=${selectedProject}` : '';
            const response = await api.get(`/dashboard${params}`);
            setData(response.data);
        } catch (err) {
            console.error('Failed to fetch dashboard', err);
        } finally {
            setLoading(false);
        }
    };

    const selectedProjectName = selectedProject
        ? data?.projectList.find((p) => p._id === selectedProject)?.nama || 'Project'
        : 'All Projects';

    const taskPieData = data
        ? Object.entries(data.taskStatusCounts)
            .filter(([, v]) => v > 0)
            .map(([key, value]) => ({
                name: TASK_LABELS[key] || key,
                value,
                color: TASK_COLORS[key] || '#94A3B8',
            }))
        : [];

    const budgetPercent = data && data.totalBudget > 0
        ? Math.min(100, Math.round((data.actualSpend / data.totalBudget) * 100))
        : 0;

    const attendanceRate = data && data.totalWorkers > 0
        ? Math.round((data.totalAttendanceToday / data.totalWorkers) * 100)
        : 0;

    if (loading && !data) {
        return (
            <div className="dashboard-loading">
                <Loader className="dashboard-spinner" size={32} />
                <p>Loading dashboard...</p>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="dashboard-header">
                <div className="dashboard-header-left">
                    <div className="dashboard-header-icon">
                        <BarChart3 size={24} color="white" />
                    </div>
                    <div>
                        <h1 className="dashboard-title">Dashboard</h1>
                        <p className="dashboard-subtitle">Project analytics overview</p>
                    </div>
                </div>

                {/* Project Selector */}
                <div className="project-selector-wrapper">
                    <button
                        className="project-selector"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                        <span className="project-selector-label">{selectedProjectName}</span>
                        <ChevronDown
                            size={16}
                            className={`project-selector-chevron ${dropdownOpen ? 'open' : ''}`}
                        />
                    </button>
                    {dropdownOpen && (
                        <div className="project-dropdown">
                            <button
                                className={`project-dropdown-item ${!selectedProject ? 'active' : ''}`}
                                onClick={() => { setSelectedProject(''); setDropdownOpen(false); }}
                            >
                                All Projects
                            </button>
                            {data.projectList.map((p) => (
                                <button
                                    key={p._id}
                                    className={`project-dropdown-item ${selectedProject === p._id ? 'active' : ''}`}
                                    onClick={() => { setSelectedProject(p._id); setDropdownOpen(false); }}
                                >
                                    {p.nama}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="kpi-grid">
                <Card className="kpi-card">
                    <div className="kpi-icon kpi-icon-projects">
                        <BarChart3 size={20} />
                    </div>
                    <div className="kpi-info">
                        <span className="kpi-value">{data.totalProjects}</span>
                        <span className="kpi-label">Total Projects</span>
                    </div>
                    <div className="kpi-tags">
                        {data.statusCounts['In Progress'] > 0 && (
                            <span className="kpi-tag kpi-tag-active">{data.statusCounts['In Progress']} Active</span>
                        )}
                        {data.statusCounts['Completed'] > 0 && (
                            <span className="kpi-tag kpi-tag-done">{data.statusCounts['Completed']} Done</span>
                        )}
                    </div>
                </Card>

                <Card className="kpi-card">
                    <div className="kpi-icon kpi-icon-budget">
                        <DollarSign size={20} />
                    </div>
                    <div className="kpi-info">
                        <span className="kpi-value">{formatCurrency(data.actualSpend)}</span>
                        <span className="kpi-label">Budget Used</span>
                    </div>
                    <div className="kpi-budget-bar">
                        <div className="kpi-budget-track">
                            <div
                                className="kpi-budget-fill"
                                style={{ width: `${budgetPercent}%` }}
                            />
                        </div>
                        <span className="kpi-budget-text">
                            {budgetPercent}% of {formatCurrency(data.totalBudget)}
                        </span>
                    </div>
                </Card>

                <Card className="kpi-card">
                    <div className="kpi-icon kpi-icon-progress">
                        <TrendingUp size={20} />
                    </div>
                    <div className="kpi-info">
                        <span className="kpi-value">{data.avgProgress}%</span>
                        <span className="kpi-label">Avg. Progress</span>
                    </div>
                    <div className="kpi-progress-ring-wrapper">
                        <svg className="kpi-progress-ring" viewBox="0 0 44 44">
                            <circle className="kpi-ring-bg" cx="22" cy="22" r="18" />
                            <circle
                                className="kpi-ring-fill"
                                cx="22" cy="22" r="18"
                                strokeDasharray={`${(data.avgProgress / 100) * 113} 113`}
                            />
                        </svg>
                    </div>
                </Card>

                <Card className="kpi-card">
                    <div className="kpi-icon kpi-icon-tasks">
                        <ClipboardList size={20} />
                    </div>
                    <div className="kpi-info">
                        <span className="kpi-value">{data.totalTasks}</span>
                        <span className="kpi-label">Total Tasks</span>
                    </div>
                    <div className="kpi-tags">
                        {data.taskStatusCounts.in_progress > 0 && (
                            <span className="kpi-tag kpi-tag-active">{data.taskStatusCounts.in_progress} Active</span>
                        )}
                        {data.taskStatusCounts.pending > 0 && (
                            <span className="kpi-tag kpi-tag-pending">{data.taskStatusCounts.pending} Pending</span>
                        )}
                    </div>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="charts-row">
                {/* Progress Timeline */}
                <Card className="chart-card chart-card-wide">
                    <div className="chart-header">
                        <h3 className="chart-title">Progress Timeline</h3>
                        {data.progressTimeline.length === 0 && (
                            <span className="chart-empty-hint">No reports yet</span>
                        )}
                    </div>
                    {data.progressTimeline.length > 0 ? (
                        <div className="chart-body">
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart data={data.progressTimeline}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                                        tickFormatter={(v: string) => {
                                            const d = new Date(v);
                                            return `${d.getDate()}/${d.getMonth() + 1}`;
                                        }}
                                    />
                                    <YAxis
                                        domain={[0, 100]}
                                        tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                                        tickFormatter={(v: number) => `${v}%`}
                                    />
                                    <Tooltip
                                        formatter={(v: number | undefined) => [`${v ?? 0}%`, 'Progress']}
                                        contentStyle={{
                                            background: 'var(--bg-white)',
                                            borderRadius: '12px',
                                            border: '1px solid var(--border)',
                                            boxShadow: 'var(--shadow-md)',
                                            fontSize: '12px',
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="progress"
                                        stroke="var(--primary)"
                                        strokeWidth={2.5}
                                        dot={{ fill: 'var(--primary)', r: 3 }}
                                        activeDot={{ r: 5, fill: 'var(--primary)' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="chart-empty">
                            <TrendingUp size={40} color="var(--text-muted)" />
                            <p>Submit daily reports to see progress trends</p>
                        </div>
                    )}
                </Card>

                {/* Task Breakdown */}
                <Card className="chart-card">
                    <div className="chart-header">
                        <h3 className="chart-title">Task Breakdown</h3>
                    </div>
                    {taskPieData.length > 0 ? (
                        <div className="chart-body chart-body-pie">
                            <ResponsiveContainer width="100%" height={180}>
                                <PieChart>
                                    <Pie
                                        data={taskPieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={45}
                                        outerRadius={70}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {taskPieData.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            background: 'var(--bg-white)',
                                            borderRadius: '12px',
                                            border: '1px solid var(--border)',
                                            boxShadow: 'var(--shadow-md)',
                                            fontSize: '12px',
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="pie-legend">
                                {taskPieData.map((entry, i) => (
                                    <div key={i} className="pie-legend-item">
                                        <span className="pie-legend-dot" style={{ backgroundColor: entry.color }} />
                                        <span className="pie-legend-label">{entry.name}</span>
                                        <span className="pie-legend-value">{entry.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="chart-empty">
                            <ClipboardList size={40} color="var(--text-muted)" />
                            <p>No tasks found</p>
                        </div>
                    )}
                </Card>
            </div>

            {/* ===== ATTENDANCE ANALYTICS SECTION ===== */}
            <div className="section-divider">
                <div className="section-divider-icon">
                    <UserCheck size={18} />
                </div>
                <h2 className="section-divider-title">Attendance Analytics</h2>
                <span className="section-divider-badge">{attendanceRate}% today</span>
            </div>

            {/* Attendance KPI Row */}
            <div className="att-kpi-row">
                <Card className="att-kpi">
                    <div className="att-kpi-header">
                        <Users size={16} color="#10B981" />
                        <span>Today's Workforce</span>
                    </div>
                    <div className="att-kpi-body">
                        <span className="att-kpi-big">{data.totalAttendanceToday}</span>
                        <span className="att-kpi-of">/ {data.totalWorkers} workers</span>
                    </div>
                    <div className="att-kpi-bar-wrapper">
                        <div className="att-kpi-bar-track">
                            <div className="att-kpi-bar-fill att-bar-green" style={{ width: `${attendanceRate}%` }} />
                        </div>
                    </div>
                </Card>

                <Card className="att-kpi">
                    <div className="att-kpi-header">
                        <Clock size={16} color="#3B82F6" />
                        <span>Status Breakdown</span>
                    </div>
                    <div className="att-status-chips">
                        <div className="att-chip att-chip-green">
                            <span className="att-chip-val">{data.attendanceCounts.Present || 0}</span>
                            <span className="att-chip-label">Present</span>
                        </div>
                        <div className="att-chip att-chip-yellow">
                            <span className="att-chip-val">{data.attendanceCounts.Late || 0}</span>
                            <span className="att-chip-label">Late</span>
                        </div>
                        <div className="att-chip att-chip-red">
                            <span className="att-chip-val">{data.attendanceCounts.Absent || 0}</span>
                            <span className="att-chip-label">Absent</span>
                        </div>
                        <div className="att-chip att-chip-purple">
                            <span className="att-chip-val">{data.attendanceCounts.Permit || 0}</span>
                            <span className="att-chip-label">Permit</span>
                        </div>
                    </div>
                </Card>

                <Card className="att-kpi">
                    <div className="att-kpi-header">
                        <Wallet size={16} color="#F59E0B" />
                        <span>This Month's Wages</span>
                    </div>
                    <div className="att-kpi-body">
                        <span className="att-kpi-big">{formatCurrency(data.wageSummary.totalWages)}</span>
                    </div>
                    <div className="att-wage-split">
                        <div className="att-wage-item">
                            <span className="att-wage-dot att-dot-green" />
                            <span>Paid: {formatCurrency(data.wageSummary.totalPaid)}</span>
                        </div>
                        <div className="att-wage-item">
                            <span className="att-wage-dot att-dot-red" />
                            <span>Unpaid: {formatCurrency(data.wageSummary.totalUnpaid)}</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Weekly Trend Chart + Worker Table */}
            <div className="att-charts-row">
                {/* Weekly Attendance Bar Chart */}
                <Card className="chart-card">
                    <div className="chart-header">
                        <h3 className="chart-title">Weekly Attendance</h3>
                        <span className="chart-empty-hint">Last 7 days</span>
                    </div>
                    <div className="chart-body">
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={data.weeklyTrend} barSize={16}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                                <XAxis
                                    dataKey="dayLabel"
                                    tick={{ fontSize: 11, fill: 'var(--text-muted)', fontWeight: 600 }}
                                />
                                <YAxis
                                    tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--bg-white)',
                                        borderRadius: '12px',
                                        border: '1px solid var(--border)',
                                        boxShadow: 'var(--shadow-md)',
                                        fontSize: '12px',
                                    }}
                                />
                                <Legend
                                    iconSize={8}
                                    wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                                />
                                <Bar dataKey="present" name="Present" fill="#10B981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="late" name="Late" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="absent" name="Absent" fill="#EF4444" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="permit" name="Permit" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Today's Workers Table */}
                <Card className="chart-card att-workers-card">
                    <div className="chart-header">
                        <h3 className="chart-title">Today's Workers</h3>
                        <span className="chart-empty-hint">{data.todayWorkers.length} records</span>
                    </div>
                    {data.todayWorkers.length > 0 ? (
                        <div className="att-workers-list">
                            {data.todayWorkers.map((w) => {
                                const style = STATUS_STYLES[w.status] || STATUS_STYLES.Present;
                                return (
                                    <div key={w._id} className="att-worker-row">
                                        <div className="att-worker-info">
                                            <div className="att-worker-avatar" style={{ backgroundColor: style.bg, color: style.color }}>
                                                {w.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="att-worker-details">
                                                <span className="att-worker-name">{w.name}</span>
                                                <span className="att-worker-project">{w.project}</span>
                                            </div>
                                        </div>
                                        <div className="att-worker-times">
                                            <span className="att-worker-time">{formatTime(w.checkIn)}</span>
                                            <span className="att-worker-time-sep">→</span>
                                            <span className="att-worker-time">{formatTime(w.checkOut)}</span>
                                        </div>
                                        <span className="att-worker-status" style={{ backgroundColor: style.bg, color: style.color }}>
                                            {w.status}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="chart-empty">
                            <Users size={40} color="var(--text-muted)" />
                            <p>No attendance records today</p>
                        </div>
                    )}
                </Card>
            </div>

            {/* Quick Stats Row */}
            <div className="quick-stats-row">
                <Card className="quick-stat">
                    <div className="quick-stat-icon" style={{ backgroundColor: '#D1FAE5' }}>
                        <Users size={18} color="#10B981" />
                    </div>
                    <div className="quick-stat-info">
                        <span className="quick-stat-value">{data.totalAttendanceToday}</span>
                        <span className="quick-stat-label">Attendance Today</span>
                    </div>
                    <div className="quick-stat-detail">
                        {data.attendanceCounts.Present > 0 && (
                            <span className="qs-badge qs-badge-green">{data.attendanceCounts.Present} Present</span>
                        )}
                        {data.attendanceCounts.Late > 0 && (
                            <span className="qs-badge qs-badge-yellow">{data.attendanceCounts.Late} Late</span>
                        )}
                        {data.attendanceCounts.Absent > 0 && (
                            <span className="qs-badge qs-badge-red">{data.attendanceCounts.Absent} Absent</span>
                        )}
                    </div>
                </Card>

                <Card className="quick-stat">
                    <div className="quick-stat-icon" style={{ backgroundColor: '#FEF3C7' }}>
                        <AlertCircle size={18} color="#F59E0B" />
                    </div>
                    <div className="quick-stat-info">
                        <span className="quick-stat-value">{data.pendingRequests}</span>
                        <span className="quick-stat-label">Pending Requests</span>
                    </div>
                </Card>

                <Card className="quick-stat">
                    <div className="quick-stat-icon" style={{ backgroundColor: '#FEE2E2' }}>
                        <Package size={18} color="#EF4444" />
                    </div>
                    <div className="quick-stat-info">
                        <span className="quick-stat-value">{formatCurrency(data.totalUnpaid)}</span>
                        <span className="quick-stat-label">Unpaid Wages</span>
                    </div>
                </Card>
            </div>
        </div>
    );
}
