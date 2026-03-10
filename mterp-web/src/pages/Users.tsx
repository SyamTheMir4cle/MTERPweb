import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users as UsersIcon, 
  Search, 
  Filter, 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Edit,
  UserPlus
} from 'lucide-react';
import { 
  getUsers, 
  createUser, 
  updateUserRole, 
  verifyUserManually, 
  deleteUser 
} from '../api/api';
import { User } from '../types';
import './Users.css';

const ROLE_OPTIONS = [
  { value: 'worker', label: 'Worker' },
  { value: 'tukang', label: 'Tukang' },
  { value: 'helper', label: 'Helper' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'site_manager', label: 'Site Manager' },
  { value: 'foreman', label: 'Foreman' },
  { value: 'asset_admin', label: 'Asset Admin' },
  { value: 'admin_project', label: 'Admin Project' },
  { value: 'director', label: 'Director' },
  { value: 'president_director', label: 'President Director' },
  { value: 'operational_director', label: 'Operational Director' },
  { value: 'owner', label: 'Owner' },
];

export default function Users() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // New User Form State
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    role: 'worker',
  });

  // Edit Role State
  const [editRole, setEditRole] = useState('');

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users', error);
      alert('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = roleFilter ? user.role === roleFilter : true;
      
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUser(newUser);
      setIsAddModalOpen(false);
      setNewUser({ username: '', email: '', fullName: '', password: '', role: 'worker' });
      fetchUsers();
    } catch (error: any) {
      alert(error.response?.data?.msg || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await deleteUser(id);
        fetchUsers();
      } catch (error: any) {
        alert(error.response?.data?.msg || 'Failed to delete user');
      }
    }
  };

  const handleVerifyUser = async (id: string) => {
    if (window.confirm('Bypass email verification for this user?')) {
      try {
        await verifyUserManually(id);
        fetchUsers();
      } catch (error: any) {
        alert(error.response?.data?.msg || 'Failed to verify user');
      }
    }
  };

  const handleOpenEditRole = (user: User) => {
    setSelectedUser(user);
    setEditRole(user.role);
    setIsEditRoleModalOpen(true);
  };

  const handleSaveRole = async () => {
    if (!selectedUser?._id) return;
    try {
      await updateUserRole(selectedUser._id, editRole);
      setIsEditRoleModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      alert(error.response?.data?.msg || 'Failed to update role');
    }
  };

  if (isLoading) {
    return (
      <div className="users-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="users-container animate-fade-in">
      <div className="users-header">
        <div className="users-header-title">
          <div className="header-icon-container">
            <UsersIcon size={24} color="#6366F1" />
          </div>
          <div>
            <h1>User Management</h1>
            <p>Manage system access, roles, and verification status.</p>
          </div>
        </div>
        <button className="add-user-btn" onClick={() => setIsAddModalOpen(true)}>
          <UserPlus size={18} />
          <span>Add New User</span>
        </button>
      </div>

      <div className="users-filters-card">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by name, email, or username..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <Filter size={18} className="filter-icon" />
          <select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            {ROLE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Contact</th>
              <th className="action-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-state">
                  No users found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td>
                    <div className="user-info-cell">
                      <div className="user-avatar">
                        {user.profilePhoto ? (
                          <img src={user.profilePhoto} alt={user.fullName} />
                        ) : (
                          <span>{user.fullName.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="user-details">
                        <span className="user-name">{user.fullName}</span>
                        <span className="user-username">@{user.username}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="role-badge" data-role={user.role}>
                      {ROLE_OPTIONS.find(r => r.value === user.role)?.label || user.role}
                    </span>
                  </td>
                  <td>
                    {user.isVerified ? (
                      <span className="status-badge verified">
                        <CheckCircle size={14} /> Verified
                      </span>
                    ) : (
                      <span className="status-badge pending">
                        <ShieldAlert size={14} /> Pending
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="contact-cell">
                      {user.email && <span className="contact-item">{user.email}</span>}
                      {user.phone && <span className="contact-item phone">{user.phone}</span>}
                    </div>
                  </td>
                  <td>
                    <div className="actions-cell">
                      {!user.isVerified && (
                        <button 
                          className="action-btn verify-btn" 
                          title="Manually Verify"
                          onClick={() => handleVerifyUser(user._id!)}
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      <button 
                        className="action-btn edit-btn" 
                        title="Edit Role"
                        onClick={() => handleOpenEditRole(user)}
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="action-btn delete-btn" 
                        title="Delete User"
                        onClick={() => handleDeleteUser(user._id!)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New User</h2>
              <button className="close-btn" onClick={() => setIsAddModalOpen(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="modal-form">
              <div className="form-group row">
                <div className="input-group">
                  <label>Full Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={newUser.fullName}
                    onChange={(e) => setNewUser({...newUser, fullName: e.target.value})}
                  />
                </div>
                <div className="input-group">
                  <label>Username *</label>
                  <input 
                    type="text" 
                    required 
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-group row">
                <div className="input-group">
                  <label>Email *</label>
                  <input 
                    type="email" 
                    required 
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  />
                </div>
                <div className="input-group">
                  <label>Initial Password *</label>
                  <input 
                    type="password" 
                    required 
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Role *</label>
                <select 
                  required
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                >
                  {ROLE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <small className="help-text">Users created by owner are instantly verified.</small>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {isEditRoleModalOpen && selectedUser && (
        <div className="modal-overlay" onClick={() => setIsEditRoleModalOpen(false)}>
          <div className="modal-content small" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Change User Role</h2>
              <button className="close-btn" onClick={() => setIsEditRoleModalOpen(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p>Change role for <strong>{selectedUser.fullName}</strong> (@{selectedUser.username})</p>
              <div className="form-group mt-15">
                <label>New Role</label>
                <select 
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                >
                  {ROLE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-actions mt-20">
              <button type="button" className="btn-secondary" onClick={() => setIsEditRoleModalOpen(false)}>Cancel</button>
              <button type="button" className="btn-primary" onClick={handleSaveRole}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
