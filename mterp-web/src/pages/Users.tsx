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
import { Card, Badge, Alert } from '../components/shared';

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
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-bg flex items-center justify-center shadow-sm">
            <UsersIcon size={24} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-1 m-0">User Management</h1>
            <p className="text-sm text-text-secondary m-0">Manage system access, roles, and verification status.</p>
          </div>
        </div>
        <button className="flex items-center justify-center gap-2 bg-primary text-white border-none py-2.5 px-5 rounded-lg font-semibold cursor-pointer transition-all duration-200 shadow-sm hover:bg-primary/90 hover:-translate-y-0.5 w-full md:w-auto" onClick={() => setIsAddModalOpen(true)}>
          <UserPlus size={18} />
          <span>Add New User</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-4 bg-bg-primary p-4 rounded-xl mb-6 shadow-sm">
        <div className="flex-1 min-w-[250px] flex items-center bg-bg-secondary border border-border rounded-lg px-3 h-[42px] transition-all focus-within:border-primary focus-within:shadow-[0_0_0_2px_rgba(49,46,89,0.1)]">
          <Search size={18} className="text-text-muted mr-2" />
          <input 
            type="text" 
            placeholder="Search by name, email, or username..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 border-none bg-transparent outline-none text-sm text-text-primary"
          />
        </div>
        <div className="min-w-[200px] flex items-center bg-bg-secondary border border-border rounded-lg px-3 h-[42px] transition-all focus-within:border-primary focus-within:shadow-[0_0_0_2px_rgba(49,46,89,0.1)]">
          <Filter size={18} className="text-text-muted mr-2" />
          <select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
            className="flex-1 border-none bg-transparent outline-none text-sm text-text-primary cursor-pointer w-full"
          >
            <option value="">All Roles</option>
            {ROLE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-bg-primary rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left p-4 text-text-secondary font-semibold text-[13px] uppercase tracking-[0.5px] border-b border-border bg-bg-secondary">User</th>
              <th className="text-left p-4 text-text-secondary font-semibold text-[13px] uppercase tracking-[0.5px] border-b border-border bg-bg-secondary">Role</th>
              <th className="text-left p-4 text-text-secondary font-semibold text-[13px] uppercase tracking-[0.5px] border-b border-border bg-bg-secondary">Status</th>
              <th className="text-left p-4 text-text-secondary font-semibold text-[13px] uppercase tracking-[0.5px] border-b border-border bg-bg-secondary">Contact</th>
              <th className="text-right p-4 text-text-secondary font-semibold text-[13px] uppercase tracking-[0.5px] border-b border-border bg-bg-secondary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center p-12 text-text-secondary italic">
                  No users found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user._id} className="transition-colors duration-200 hover:bg-bg-secondary/50">
                  <td className="p-4 border-b border-border align-middle">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-bg text-primary flex items-center justify-center font-semibold text-base overflow-hidden">
                        {user.profilePhoto ? (
                          <img src={user.profilePhoto} alt={user.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <span>{user.fullName.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-text-primary">{user.fullName}</span>
                        <span className="text-[13px] text-text-secondary">@{user.username}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 border-b border-border align-middle">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                      ['owner', 'president_director', 'operational_director', 'director'].includes(user.role) ? 'bg-danger-bg text-danger' :
                      ['asset_admin', 'admin_project'].includes(user.role) ? 'bg-warning-bg text-warning' :
                      ['site_manager', 'supervisor', 'foreman'].includes(user.role) ? 'bg-info-bg text-info' :
                      'bg-bg-secondary text-text-secondary'
                    }`}>
                      {ROLE_OPTIONS.find(r => r.value === user.role)?.label || user.role}
                    </span>
                  </td>
                  <td className="p-4 border-b border-border align-middle">
                    {user.isVerified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-success-bg text-success">
                        <CheckCircle size={14} /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-warning-bg text-warning">
                        <ShieldAlert size={14} /> Pending
                      </span>
                    )}
                  </td>
                  <td className="p-4 border-b border-border align-middle">
                    <div className="flex flex-col gap-0.5">
                      {user.email && <span className="text-[13px] text-text-primary">{user.email}</span>}
                      {user.phone && <span className="text-[13px] text-text-secondary">{user.phone}</span>}
                    </div>
                  </td>
                  <td className="p-4 border-b border-border align-middle">
                    <div className="flex justify-end gap-2">
                      {!user.isVerified && (
                        <button 
                          className="w-8 h-8 rounded-lg border-none flex items-center justify-center cursor-pointer bg-bg-secondary text-text-secondary transition-all duration-200 hover:bg-success-bg hover:text-success" 
                          title="Manually Verify"
                          onClick={() => handleVerifyUser(user._id!)}
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      <button 
                        className="w-8 h-8 rounded-lg border-none flex items-center justify-center cursor-pointer bg-bg-secondary text-text-secondary transition-all duration-200 hover:bg-info-bg hover:text-info" 
                        title="Edit Role"
                        onClick={() => handleOpenEditRole(user)}
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="w-8 h-8 rounded-lg border-none flex items-center justify-center cursor-pointer bg-bg-secondary text-text-secondary transition-all duration-200 hover:bg-danger-bg hover:text-danger" 
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] flex justify-center items-center p-4 overflow-y-auto animate-fade-in" onClick={() => setIsAddModalOpen(false)}>
          <div className="bg-bg-primary rounded-xl w-full max-w-[600px] shadow-2xl overflow-hidden flex flex-col border border-border animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-border bg-bg-secondary flex justify-between items-center">
              <h2 className="text-xl font-bold text-text-primary m-0">Add New User</h2>
              <button className="bg-transparent border-none text-text-secondary cursor-pointer flex items-center justify-center p-1 hover:text-text-primary transition-colors" onClick={() => setIsAddModalOpen(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="block text-[13px] font-semibold text-text-secondary mb-1.5">Full Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={newUser.fullName}
                    onChange={(e) => setNewUser({...newUser, fullName: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm text-text-primary transition-colors outline-none bg-bg-primary focus:border-primary focus:shadow-[0_0_0_3px_rgba(49,46,89,0.1)]"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="block text-[13px] font-semibold text-text-secondary mb-1.5">Username *</label>
                  <input 
                    type="text" 
                    required 
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm text-text-primary transition-colors outline-none bg-bg-primary focus:border-primary focus:shadow-[0_0_0_3px_rgba(49,46,89,0.1)]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="block text-[13px] font-semibold text-text-secondary mb-1.5">Email *</label>
                  <input 
                    type="email" 
                    required 
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm text-text-primary transition-colors outline-none bg-bg-primary focus:border-primary focus:shadow-[0_0_0_3px_rgba(49,46,89,0.1)]"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="block text-[13px] font-semibold text-text-secondary mb-1.5">Initial Password *</label>
                  <input 
                    type="password" 
                    required 
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm text-text-primary transition-colors outline-none bg-bg-primary focus:border-primary focus:shadow-[0_0_0_3px_rgba(49,46,89,0.1)]"
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <label className="block text-[13px] font-semibold text-text-secondary mb-1.5">Role *</label>
                <select 
                  required
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm text-text-primary transition-colors outline-none bg-bg-primary cursor-pointer focus:border-primary focus:shadow-[0_0_0_3px_rgba(49,46,89,0.1)]"
                >
                  {ROLE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <small className="block text-xs text-text-muted mt-1.5">Users created by owner are instantly verified.</small>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" className="px-5 py-2.5 bg-bg-primary border border-border rounded-lg font-semibold text-text-secondary cursor-pointer transition-colors hover:bg-bg-secondary hover:text-text-primary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-primary border-none rounded-lg font-semibold text-white cursor-pointer transition-all shadow-sm hover:bg-primary/90 hover:-translate-y-0.5">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {isEditRoleModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] flex justify-center items-center p-4 overflow-y-auto animate-fade-in" onClick={() => setIsEditRoleModalOpen(false)}>
          <div className="bg-bg-primary rounded-xl w-full max-w-[400px] shadow-2xl overflow-hidden flex flex-col border border-border animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-border bg-bg-secondary flex justify-between items-center">
              <h2 className="text-xl font-bold text-text-primary m-0">Change User Role</h2>
              <button className="bg-transparent border-none text-text-secondary cursor-pointer flex items-center justify-center p-1 hover:text-text-primary transition-colors" onClick={() => setIsEditRoleModalOpen(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-text-secondary m-0 mb-5">Change role for <strong className="text-text-primary font-bold">{selectedUser.fullName}</strong> (@{selectedUser.username})</p>
              <div className="flex flex-col">
                <label className="block text-[13px] font-semibold text-text-secondary mb-1.5">New Role</label>
                <select 
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm text-text-primary transition-colors outline-none bg-bg-primary cursor-pointer focus:border-primary focus:shadow-[0_0_0_3px_rgba(49,46,89,0.1)]"
                >
                  {ROLE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 bg-bg-secondary border-t border-border flex justify-end gap-3 rounded-b-xl">
              <button type="button" className="px-5 py-2.5 bg-bg-primary border border-border rounded-lg font-semibold text-text-secondary cursor-pointer transition-colors hover:bg-bg-secondary hover:text-text-primary" onClick={() => setIsEditRoleModalOpen(false)}>Cancel</button>
              <button type="button" className="px-5 py-2.5 bg-primary border-none rounded-lg font-semibold text-white cursor-pointer transition-all shadow-sm hover:bg-primary/90 hover:-translate-y-0.5" onClick={handleSaveRole}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
