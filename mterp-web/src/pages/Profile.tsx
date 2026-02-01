import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  User,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
  LogOut,
  Shield,
  Bell,
  HelpCircle,
  Info,
  Trash2,
} from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import { Alert } from '../components/shared';
import './Profile.css';

interface SettingsItem {
  id: string;
  icon: React.ElementType;
  label: string;
  value?: string;
  onClick?: () => void;
  danger?: boolean;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });
  const [saving, setSaving] = useState(false);
  const [alertData, setAlertData] = useState<{ visible: boolean; type: 'success' | 'error'; title: string; message: string }>({
    visible: false,
    type: 'success',
    title: '',
    message: '',
  });

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await api.put('/auth/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      updateUser({ profilePhoto: response.data.profilePhoto });
      setAlertData({
        visible: true,
        type: 'success',
        title: 'Photo Updated',
        message: 'Your profile photo has been updated successfully.',
      });
    } catch (err) {
      console.error('Photo upload failed', err);
      setAlertData({
        visible: true,
        type: 'error',
        title: 'Upload Failed',
        message: 'Failed to update profile photo. Please try again.',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!user?.profilePhoto) return;
    
    try {
      await api.delete('/auth/profile/photo');
      updateUser({ profilePhoto: undefined });
      setAlertData({
        visible: true,
        type: 'success',
        title: 'Photo Removed',
        message: 'Your profile photo has been removed.',
      });
    } catch (err) {
      console.error('Photo removal failed', err);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await api.put('/auth/profile', formData);
      updateUser(response.data);
      setEditing(false);
      setAlertData({
        visible: true,
        type: 'success',
        title: 'Profile Saved',
        message: 'Your profile has been updated successfully.',
      });
    } catch (err) {
      console.error('Profile update failed', err);
      setAlertData({
        visible: true,
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update profile. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getPhotoUrl = () => {
    if (user?.profilePhoto) {
      // Handle both relative and absolute URLs
      if (user.profilePhoto.startsWith('http')) {
        return user.profilePhoto;
      }
      return `${import.meta.env.VITE_API_URL?.replace('/api', '')}/${user.profilePhoto}`;
    }
    return null;
  };

  const getInitials = () => {
    if (!user?.fullName) return 'U';
    return user.fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const settingsItems: SettingsItem[] = [
    { id: 'notifications', icon: Bell, label: 'Notifications', onClick: () => {} },
    { id: 'privacy', icon: Shield, label: 'Privacy & Security', onClick: () => {} },
    { id: 'help', icon: HelpCircle, label: 'Help & Support', onClick: () => {} },
    { id: 'about', icon: Info, label: 'About', value: 'v1.0.0' },
  ];

  return (
    <div className="profile-container">
      <Alert
        visible={alertData.visible}
        type={alertData.type}
        title={alertData.title}
        message={alertData.message}
        onClose={() => setAlertData({ ...alertData, visible: false })}
      />

      {/* Header */}
      <div className="profile-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="profile-title">Profile</h1>
        <button 
          className="edit-btn" 
          onClick={() => editing ? handleSaveProfile() : setEditing(true)}
          disabled={saving}
        >
          {saving ? 'Saving...' : editing ? 'Save' : 'Edit'}
        </button>
      </div>

      {/* Profile Photo Section */}
      <div className="photo-section">
        <div className="photo-container" onClick={handlePhotoClick}>
          {getPhotoUrl() ? (
            <img src={getPhotoUrl()!} alt="Profile" className="profile-photo" />
          ) : (
            <div className="photo-placeholder">
              <span className="photo-initials">{getInitials()}</span>
            </div>
          )}
          <div className="photo-overlay">
            <Camera size={24} />
          </div>
          {uploading && (
            <div className="photo-loading">
              <div className="spinner-small"></div>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          style={{ display: 'none' }}
        />
        <button className="change-photo-btn" onClick={handlePhotoClick}>
          Change Photo
        </button>
        {user?.profilePhoto && (
          <button className="remove-photo-btn" onClick={handleRemovePhoto}>
            Remove Photo
          </button>
        )}
      </div>

      {/* User Info Section */}
      <div className="settings-section">
        <h2 className="section-title">PERSONAL INFORMATION</h2>
        <div className="settings-group">
          <div className="settings-item">
            <div className="settings-item-icon">
              <User size={20} color="var(--primary)" />
            </div>
            <div className="settings-item-content">
              <span className="settings-item-label">Full Name</span>
              {editing ? (
                <input
                  type="text"
                  className="settings-input"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Enter your name"
                />
              ) : (
                <span className="settings-item-value">{user?.fullName || 'Not set'}</span>
              )}
            </div>
          </div>

          <div className="settings-item">
            <div className="settings-item-icon">
              <Mail size={20} color="var(--success)" />
            </div>
            <div className="settings-item-content">
              <span className="settings-item-label">Email</span>
              {editing ? (
                <input
                  type="email"
                  className="settings-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your email"
                />
              ) : (
                <span className="settings-item-value">{user?.email || 'Not set'}</span>
              )}
            </div>
          </div>

          <div className="settings-item">
            <div className="settings-item-icon">
              <Phone size={20} color="var(--warning)" />
            </div>
            <div className="settings-item-content">
              <span className="settings-item-label">Phone</span>
              {editing ? (
                <input
                  type="tel"
                  className="settings-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter your phone"
                />
              ) : (
                <span className="settings-item-value">{user?.phone || 'Not set'}</span>
              )}
            </div>
          </div>

          <div className="settings-item">
            <div className="settings-item-icon">
              <MapPin size={20} color="var(--danger)" />
            </div>
            <div className="settings-item-content">
              <span className="settings-item-label">Address</span>
              {editing ? (
                <input
                  type="text"
                  className="settings-input"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter your address"
                />
              ) : (
                <span className="settings-item-value">{user?.address || 'Not set'}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Role Badge */}
      <div className="settings-section">
        <h2 className="section-title">ACCOUNT</h2>
        <div className="settings-group">
          <div className="settings-item">
            <div className="settings-item-icon">
              <Shield size={20} color="var(--primary)" />
            </div>
            <div className="settings-item-content">
              <span className="settings-item-label">Role</span>
              <span className="settings-item-value role-badge">
                {user?.role?.toUpperCase() || 'WORKER'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Section */}
      <div className="settings-section">
        <h2 className="section-title">SETTINGS</h2>
        <div className="settings-group">
          {settingsItems.map((item) => (
            <button
              key={item.id}
              className="settings-item"
              onClick={item.onClick}
            >
              <div className="settings-item-icon">
                <item.icon size={20} color="var(--text-secondary)" />
              </div>
              <div className="settings-item-content">
                <span className="settings-item-label">{item.label}</span>
                {item.value && (
                  <span className="settings-item-value">{item.value}</span>
                )}
              </div>
              <ChevronRight size={20} color="var(--text-muted)" />
            </button>
          ))}
        </div>
      </div>

      {/* Logout Section */}
      <div className="settings-section">
        <div className="settings-group">
          <button className="settings-item danger" onClick={handleLogout}>
            <div className="settings-item-icon">
              <LogOut size={20} color="var(--danger)" />
            </div>
            <div className="settings-item-content">
              <span className="settings-item-label danger">Sign Out</span>
            </div>
          </button>
        </div>
      </div>

      {/* App Version */}
      <div className="app-version">
        <span>mterp. v1.0.0</span>
        <span>© 2026 MTE Construction</span>
      </div>
    </div>
  );
}
