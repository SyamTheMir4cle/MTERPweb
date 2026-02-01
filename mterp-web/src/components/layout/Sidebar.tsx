import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Briefcase,
  Wrench,
  Clock,
  ClipboardList,
  CheckSquare,
  Truck,
  FileText,
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
    id: 'approvals',
    label: 'Approvals',
    icon: CheckSquare,
    route: '/approvals',
    roles: ['owner', 'director', 'supervisor', 'admin_project'],
  },
];

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const userRole = user?.role?.toLowerCase() || 'worker';

  const filteredItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(userRole)
  );

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
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
