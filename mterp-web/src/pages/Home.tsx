import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  ClipboardList,
  Clock,
  Truck,
  CheckSquare,
  ChevronRight,
  HardHat,
  FileText,
  DollarSign,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, Badge } from '../components/shared';
import './Home.css';

interface DashboardCardProps {
  icon: React.ElementType;
  label: string;
  sub: string;
  color: string;
  bg: string;
  onClick: () => void;
}

interface UpdateItem {
  _id: string;
  type: 'project' | 'attendance' | 'report';
  icon: string;
  title: string;
  description: string;
  subtitle: string;
  timestamp: string;
  color: string;
  bg: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  icon: Icon,
  label,
  sub,
  color,
  bg,
  onClick,
}) => (
  <Card className="dashboard-card" onClick={onClick}>
    <div className="dashboard-card-icon" style={{ backgroundColor: bg }}>
      <Icon size={24} color={color} />
    </div>
    <div className="dashboard-card-content">
      <span className="dashboard-card-label">{label}</span>
      <span className="dashboard-card-sub">{sub}</span>
    </div>
  </Card>
);

const getIcon = (iconName: string) => {
  const icons: Record<string, React.ElementType> = {
    HardHat,
    Clock,
    FileText,
    Wrench,
    Truck,
  };
  return icons[iconName] || FileText;
};

export default function Home() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [updates, setUpdates] = useState<UpdateItem[]>([]);
  const [loadingUpdates, setLoadingUpdates] = useState(true);

  useEffect(() => {
    fetchUpdates();
  }, []);

  const fetchUpdates = async () => {
    try {
      const response = await api.get('/updates');
      setUpdates(response.data);
    } catch (err) {
      console.error('Failed to fetch updates', err);
    } finally {
      setLoadingUpdates(false);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}${t('home.time.minsAgo')}`;
    if (diffHours < 24) return `${diffHours}${t('home.time.hoursAgo')}`;
    if (diffDays < 7) return `${diffDays}${t('home.time.daysAgo')}`;
    return date.toLocaleDateString(i18n.language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short' });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.greeting.morning');
    if (hour < 17) return t('home.greeting.afternoon');
    return t('home.greeting.evening');
  };

  return (
    <div className="home-container">
      {/* Header Section */}
      <div className="home-header">
        <div className="home-header-content">
          <div className="home-header-text">
            <span className="home-greeting">{getGreeting()},</span>
            <h1 className="home-username">{user?.fullName || 'User'}</h1>
            <Badge
              label={user?.role?.toUpperCase() || 'STAFF'}
              variant="neutral"
              size="small"
              className="home-role-badge"
            />
          </div>
        </div>
        <div className="home-header-decor1"></div>
        <div className="home-header-decor2"></div>
      </div>

      {/* Main Grid */}
      <div className="home-grid">
        {/* Big Cards */}
        <Card className="big-card" onClick={() => navigate('/projects')}>
          <div className="big-card-content">
            <div className="big-card-icon gradient-gold">
              <HardHat size={32} color="white" />
            </div>
            <div>
              <h3 className="big-card-title">{t('home.cards.projectsTitle')}</h3>
              <p className="big-card-sub">{t('home.cards.projectsSub')}</p>
            </div>
          </div>
          <div className="big-card-arrow">
            <ChevronRight size={20} color="var(--primary)" />
          </div>
        </Card>

        <Card className="big-card" onClick={() => navigate('/tools')}>
          <div className="big-card-content">
            <div className="big-card-icon gradient-primary">
              <Wrench size={32} color="white" />
            </div>
            <div>
              <h3 className="big-card-title">{t('home.cards.toolsTitle')}</h3>
              <p className="big-card-sub">{t('home.cards.toolsSub')}</p>
            </div>
          </div>
          <div className="big-card-arrow">
            <ChevronRight size={20} color="var(--primary)" />
          </div>
        </Card>

        {/* Small Cards Row - Role Based */}
        <div className="small-cards-row">
          <DashboardCard
            icon={Clock}
            label={t('home.cards.attendanceTitle')}
            sub={t('home.cards.attendanceSub')}
            color="#10B981"
            bg="#D1FAE5"
            onClick={() => navigate('/attendance')}
          />
          <DashboardCard
            icon={ClipboardList}
            label={t('home.cards.tasksTitle')}
            sub={t('home.cards.tasksSub')}
            color="#F59E0B"
            bg="#FEF3C7"
            onClick={() => navigate('/tasks')}
          />
        </div>

        {/* My Payments - for worker roles */}
        {user?.role && ['worker', 'tukang', 'mandor'].includes(user.role) && (
          <div className="small-cards-row">
            <DashboardCard
              icon={DollarSign}
              label={t('home.cards.paymentsTitle')}
              sub={t('home.cards.paymentsSub')}
              color="#059669"
              bg="#D1FAE5"
              onClick={() => navigate('/my-payments')}
            />
          </div>
        )}

        {/* Materials - for supervisor, asset_admin, director, owner */}
        {user?.role && ['supervisor', 'asset_admin', 'director', 'owner'].includes(user.role) && (
          <div className="small-cards-row">
            <DashboardCard
              icon={Truck}
              label={t('home.cards.materialsTitle')}
              sub={t('home.cards.materialsSub')}
              color="#8B5CF6"
              bg="#EDE9FE"
              onClick={() => navigate('/materials')}
            />
            {/* Approvals - for director, owner only */}
            {['director', 'owner'].includes(user.role) ? (
              <DashboardCard
                icon={CheckSquare}
                label={t('home.cards.approvalsTitle')}
                sub={t('home.cards.approvalsSub')}
                color="#3B82F6"
                bg="#DBEAFE"
                onClick={() => navigate('/approvals')}
              />
            ) : (
              <DashboardCard
                icon={ClipboardList}
                label={t('home.cards.reportTitle')}
                sub={t('home.cards.reportSub')}
                color="#3B82F6"
                bg="#DBEAFE"
                onClick={() => navigate('/daily-report')}
              />
            )}
          </div>
        )}
      </div>

      {/* Site Updates Section */}
      <div className="home-updates">
        <div className="updates-header">
          <span className="updates-title">{t('home.updates.title')}</span>
          {updates.length > 3 && (
            <button className="updates-link" onClick={() => navigate('/updates')}>{t('home.updates.viewAll')}</button>
          )}
        </div>
        
        {loadingUpdates ? (
          <div className="updates-loading">{t('home.updates.loading')}</div>
        ) : updates.length === 0 ? (
          <div className="updates-empty">
            <p>{t('home.updates.empty')}</p>
          </div>
        ) : (
          <div className="updates-list">
            {updates.slice(0, 5).map((update) => {
              const IconComponent = getIcon(update.icon);
              return (
                <div key={update._id} className="update-item">
                  <div className="update-icon" style={{ backgroundColor: update.bg }}>
                    <IconComponent size={18} color={update.color} />
                  </div>
                  <div className="update-content">
                    <div className="update-header">
                      <span className="update-type">{update.title}</span>
                      <span className="update-time">{formatTimeAgo(update.timestamp)}</span>
                    </div>
                    <p className="update-description">{update.description}</p>
                    <p className="update-subtitle">{update.subtitle}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
