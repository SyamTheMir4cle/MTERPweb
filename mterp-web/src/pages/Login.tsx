import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HardHat, ArrowRight, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input } from '../components/shared';
import './Login.css';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  
  const [showLoading, setShowLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Loading screen animation
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      setError(t('auth.login.usernameRequired'));
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/auth/login', { username, password });
      login(response.data, response.data.token);
      navigate('/home');
    } catch (err: any) {
      setError(err.response?.data?.msg || t('auth.login.networkError'));
    } finally {
      setLoading(false);
    }
  };

  // Show loading screen
  if (showLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">
          <HardHat size={60} color="white" />
        </div>
        <div className="loading-text">
          <span className="loading-letter" style={{ animationDelay: '0ms' }}>m</span>
          <span className="loading-letter" style={{ animationDelay: '50ms' }}>t</span>
          <span className="loading-letter" style={{ animationDelay: '100ms' }}>e</span>
          <span className="loading-letter" style={{ animationDelay: '150ms' }}>r</span>
          <span className="loading-letter" style={{ animationDelay: '200ms' }}>p</span>
          <span className="loading-dot" style={{ animationDelay: '250ms' }}>.</span>
        </div>
        <p className="loading-subtitle">{t('auth.login.subtitle')}</p>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-bg-decor"></div>
      
      <div className="login-content">
        <div className="login-header">
          <div className="login-logo-box">
            <HardHat color="white" size={40} />
          </div>
          <h1 className="login-title">mterp<span className="login-dot">.</span></h1>
          <p className="login-subtitle">{t('auth.login.subtitle')}</p>
        </div>

        <div className="login-form">
          {error && <div className="login-error">{error}</div>}
          
          <Input
            label={t('auth.login.usernameLabel')}
            placeholder={t('auth.login.usernamePlaceholder')}
            value={username}
            onChangeText={setUsername}
            type="text"
            icon={User}
          />

          <Input
            label={t('auth.login.passwordLabel')}
            placeholder={t('auth.login.passwordPlaceholder')}
            value={password}
            onChangeText={setPassword}
            type="password"
          />

          <Button
            title={t('auth.login.signIn')}
            onClick={handleLogin}
            variant="primary"
            size="large"
            loading={loading}
            icon={ArrowRight}
            iconPosition="right"
            fullWidth
            style={{ marginTop: 10 }}
          />

          <Button
            title={t('auth.login.noAccount')}
            onClick={() => navigate('/register')}
            variant="outline"
            size="medium"
            fullWidth
            style={{ marginTop: 16, border: 'none', background: 'transparent' }}
          />
        </div>
      </div>
      
      <p className="login-version">v1.0.0 Web Build</p>
    </div>
  );
}
