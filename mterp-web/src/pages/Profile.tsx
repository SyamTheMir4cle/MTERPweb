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
  Wallet,
  CreditCard,
} from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import { Alert } from '../components/shared';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
    paymentInfo: {
      bankPlatform: (user as any)?.paymentInfo?.bankPlatform || '',
      bankAccount: (user as any)?.paymentInfo?.bankAccount || '',
      accountName: (user as any)?.paymentInfo?.accountName || '',
    },
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
        title: t('profile.messages.photoSuccess'),
        message: t('profile.messages.photoSuccessDesc'),
      });
    } catch (err) {
      console.error('Photo upload failed', err);
      setAlertData({
        visible: true,
        type: 'error',
        title: t('profile.messages.photoError'),
        message: t('profile.messages.photoErrorDesc'),
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
        title: t('profile.messages.photoRemoved'),
        message: t('profile.messages.photoRemovedDesc'),
      });
    } catch (err) {
      console.error('Photo removal failed', err);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await api.put('/auth/profile', {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        paymentInfo: formData.paymentInfo,
      });
      updateUser(response.data);
      setEditing(false);
      setAlertData({
        visible: true,
        type: 'success',
        title: t('profile.messages.saveSuccess'),
        message: t('profile.messages.saveSuccessDesc'),
      });
    } catch (err) {
      console.error('Profile update failed', err);
      setAlertData({
        visible: true,
        type: 'error',
        title: t('profile.messages.saveError'),
        message: t('profile.messages.saveErrorDesc'),
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
    { id: 'notifications', icon: Bell, label: t('profile.settings.notifications'), onClick: () => { } },
    { id: 'privacy', icon: Shield, label: t('profile.settings.privacy'), onClick: () => { } },
    { id: 'help', icon: HelpCircle, label: t('profile.settings.help'), onClick: () => { } },
    { id: 'about', icon: Info, label: t('profile.settings.about'), value: 'v1.0.0' },
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
        <h1 className="profile-title">{t('profile.title')}</h1>
        <button
          className="edit-btn"
          onClick={() => editing ? handleSaveProfile() : setEditing(true)}
          disabled={saving}
        >
          {saving ? t('profile.btnSaving') : editing ? t('profile.btnSave') : t('profile.btnEdit')}
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
          {t('profile.btnChangePhoto')}
        </button>
        {user?.profilePhoto && (
          <button className="remove-photo-btn" onClick={handleRemovePhoto}>
            {t('profile.btnRemovePhoto')}
          </button>
        )}
      </div>

      {/* User Info Section */}
      <div className="settings-section">
        <h2 className="section-title">{t('profile.sections.personalInfo')}</h2>
        <div className="settings-group">
          <div className="settings-item">
            <div className="settings-item-icon">
              <User size={20} color="var(--primary)" />
            </div>
            <div className="settings-item-content">
              <span className="settings-item-label">{t('profile.fields.fullName')}</span>
              {editing ? (
                <input
                  type="text"
                  className="settings-input"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder={t('profile.fields.fullNamePlaceholder')}
                />
              ) : (
                <span className="settings-item-value">{user?.fullName || t('profile.fields.notSet')}</span>
              )}
            </div>
          </div>

          <div className="settings-item">
            <div className="settings-item-icon">
              <Mail size={20} color="var(--success)" />
            </div>
            <div className="settings-item-content">
              <span className="settings-item-label">{t('profile.fields.email')}</span>
              {editing ? (
                <input
                  type="email"
                  className="settings-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t('profile.fields.emailPlaceholder')}
                />
              ) : (
                <span className="settings-item-value">{user?.email || t('profile.fields.notSet')}</span>
              )}
            </div>
          </div>

          <div className="settings-item">
            <div className="settings-item-icon">
              <Phone size={20} color="var(--warning)" />
            </div>
            <div className="settings-item-content">
              <span className="settings-item-label">{t('profile.fields.phone')}</span>
              {editing ? (
                <input
                  type="tel"
                  className="settings-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={t('profile.fields.phonePlaceholder')}
                />
              ) : (
                <span className="settings-item-value">{user?.phone || t('profile.fields.notSet')}</span>
              )}
            </div>
          </div>

          <div className="settings-item">
            <div className="settings-item-icon">
              <MapPin size={20} color="var(--danger)" />
            </div>
            <div className="settings-item-content">
              <span className="settings-item-label">{t('profile.fields.address')}</span>
              {editing ? (
                <input
                  type="text"
                  className="settings-input"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder={t('profile.fields.addressPlaceholder')}
                />
              ) : (
                <span className="settings-item-value">{user?.address || t('profile.fields.notSet')}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="settings-section">
        <h2 className="section-title">{t('profile.sections.paymentInfo')}</h2>
        <div className="settings-group">
          <div className="settings-item">
            <div className="settings-item-icon">
              <Wallet size={20} color="#F59E0B" />
            </div>
            <div className="settings-item-content">
              <span className="settings-item-label">{t('profile.fields.paymentPlatform')}</span>
              {editing ? (
                <input
                  type="text"
                  className="settings-input"
                  value={formData.paymentInfo.bankPlatform}
                  onChange={(e) => setFormData({ ...formData, paymentInfo: { ...formData.paymentInfo, bankPlatform: e.target.value } })}
                  placeholder={t('profile.fields.paymentPlatformPlaceholder')}
                />
              ) : (
                <span className="settings-item-value">{(user as any)?.paymentInfo?.bankPlatform || t('profile.fields.notSet')}</span>
              )}
            </div>
          </div>

          <div className="settings-item">
            <div className="settings-item-icon">
              <CreditCard size={20} color="#6366F1" />
            </div>
            <div className="settings-item-content">
              <span className="settings-item-label">{t('profile.fields.accountNumber')}</span>
              {editing ? (
                <input
                  type="text"
                  className="settings-input"
                  value={formData.paymentInfo.bankAccount}
                  onChange={(e) => setFormData({ ...formData, paymentInfo: { ...formData.paymentInfo, bankAccount: e.target.value } })}
                  placeholder={t('profile.fields.accountNumberPlaceholder')}
                />
              ) : (
                <span className="settings-item-value">{(user as any)?.paymentInfo?.bankAccount || t('profile.fields.notSet')}</span>
              )}
            </div>
          </div>

          <div className="settings-item">
            <div className="settings-item-icon">
              <User size={20} color="#10B981" />
            </div>
            <div className="settings-item-content">
              <span className="settings-item-label">{t('profile.fields.accountName')}</span>
              {editing ? (
                <input
                  type="text"
                  className="settings-input"
                  value={formData.paymentInfo.accountName}
                  onChange={(e) => setFormData({ ...formData, paymentInfo: { ...formData.paymentInfo, accountName: e.target.value } })}
                  placeholder={t('profile.fields.accountNamePlaceholder')}
                />
              ) : (
                <span className="settings-item-value">{(user as any)?.paymentInfo?.accountName || t('profile.fields.notSet')}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Role Badge */}
      <div className="settings-section">
        <h2 className="section-title">{t('profile.sections.account')}</h2>
        <div className="settings-group">
          <div className="settings-item">
            <div className="settings-item-icon">
              <Shield size={20} color="var(--primary)" />
            </div>
            <div className="settings-item-content">
              <span className="settings-item-label">{t('profile.fields.role')}</span>
              <span className="settings-item-value role-badge">
                {user?.role?.toUpperCase() || 'WORKER'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Section */}
      <div className="settings-section">
        <h2 className="section-title">{t('profile.sections.settings')}</h2>
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
              <span className="settings-item-label danger">{t('profile.settings.signOut')}</span>
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
