import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  BarChart3,
  Briefcase,
  Wrench,
  Clock,
  ClipboardList,
  CheckSquare,
  Truck,
  FileText,
  DollarSign,
  User,
  LogOut,
  ChevronRight,
  Receipt,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.css';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  route: string;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    route: '/home',
    roles: ['owner', 'director', 'supervisor', 'admin_project', 'worker', 'mandor', 'tukang', 'logistik'],
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: BarChart3,
    route: '/dashboard',
    roles: ['owner', 'director', 'supervisor'],
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: Briefcase,
    route: '/projects',
    roles: ['owner', 'director', 'supervisor', 'admin_project'],
  },
  {
    id: 'daily-report',
    label: 'Daily Report',
    icon: FileText,
    route: '/daily-report',
    roles: ['supervisor', 'admin_project', 'mandor'],
  },
  {
    id: 'tools',
    label: 'Tools',
    icon: Wrench,
    route: '/tools',
    roles: ['owner', 'director', 'supervisor', 'admin_project', 'logistik'],
  },
  {
    id: 'materials',
    label: 'Materials',
    icon: Truck,
    route: '/materials',
    roles: ['owner', 'director', 'supervisor', 'admin_project', 'logistik'],
  },
  {
    id: 'attendance',
    label: 'Attendance',
    icon: Clock,
    route: '/attendance',
    roles: ['owner', 'director', 'supervisor', 'admin_project', 'worker', 'mandor', 'tukang'],
  },
  {
    id: 'tasks',
    label: 'Tasks',
    icon: ClipboardList,
    route: '/tasks',
    roles: ['worker', 'tukang', 'mandor', 'supervisor', 'admin_project'],
  },
  {
    id: 'my-payments',
    label: 'My Payments',
    icon: DollarSign,
    route: '/my-payments',
    roles: ['worker', 'tukang', 'mandor'],
  },
  {
    id: 'approvals',
    label: 'Approvals',
    icon: CheckSquare,
    route: '/approvals',
    roles: ['owner', 'director', 'supervisor', 'admin_project'],
  },
  {
    id: 'slip-gaji',
    label: 'Slip Gaji',
    icon: Receipt,
    route: '/slip-gaji',
    roles: ['owner', 'director', 'supervisor'],
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const userRole = user?.role?.toLowerCase() || 'worker';

  const filteredItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(userRole)
  );

  const isProfileActive = location.pathname === '/profile';

  const handleLogout = () => {
    logout();
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Wrench size={28} color="white" />
        </div>
        <div className="sidebar-brand">
          <span className="sidebar-title">mterp<span className="sidebar-dot">.</span></span>
          <span className="sidebar-subtitle">Construction ERP</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.route ||
            location.pathname.startsWith(item.route + '/');

          return (
            <NavLink
              key={item.id}
              to={item.route}
              className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
              {isActive && <ChevronRight size={16} className="sidebar-link-indicator" />}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer with profile & logout */}
      <div className="sidebar-footer">
        <NavLink
          to="/profile"
          className={`sidebar-profile-btn ${isProfileActive ? 'sidebar-link-active' : ''}`}
        >
          <div className="sidebar-avatar">
            {user?.profilePhoto ? (
              <img src={user.profilePhoto} alt={user?.fullName} className="sidebar-avatar-img" />
            ) : (
              <User size={18} />
            )}
          </div>
          <div className="sidebar-profile-info">
            <span className="sidebar-profile-name">{user?.fullName || 'User'}</span>
            <span className="sidebar-profile-role">{user?.role || 'Worker'}</span>
          </div>
        </NavLink>

        <button className="sidebar-logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
