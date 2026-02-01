import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import api from '../api/api';
import { Input, Button, Chip } from '../components/shared';
import './Register.css';

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    role: 'worker',
  });
  const [otp, setOtp] = useState('');

  const handleRegister = async () => {
    if (!formData.username || !formData.email || !formData.password) {
      setError('Mohon lengkapi semua data');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/auth/register', formData);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Terjadi kesalahan server');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/verify', { email: formData.email, otp });
      alert('Akun Anda aktif! Silakan Login.');
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.msg || 'OTP Salah');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: OTP Verification
  if (step === 2) {
    return (
      <div className="register-container">
        <div className="register-content">
          <CheckCircle2 size={60} color="var(--primary)" className="register-icon" />
          <h1 className="register-title">Verifikasi Email</h1>
          <p className="register-subtitle">
            Masukkan 6 digit kode yang dikirim ke {formData.email}
          </p>

          {error && <div className="register-error">{error}</div>}

          <Input
            placeholder="000000"
            type="text"
            value={otp}
            onChangeText={setOtp}
            maxLength={6}
            style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8 }}
          />

          <Button
            title="Verifikasi & Aktifkan"
            onClick={handleVerify}
            loading={loading}
            variant="primary"
            size="large"
            fullWidth
          />
        </div>
      </div>
    );
  }

  // Step 1: Registration Form
  return (
    <div className="register-container">
      <div className="register-content">
        <h1 className="register-title">Buat Akun Baru</h1>
        <p className="register-subtitle">Daftar untuk akses sistem ERP</p>

        {error && <div className="register-error">{error}</div>}

        <div className="register-form">
          <Input
            placeholder="Nama Lengkap"
            value={formData.fullName}
            onChangeText={(t) => setFormData({ ...formData, fullName: t })}
          />

          <div className="role-section">
            <label className="role-label">DAFTAR SEBAGAI:</label>
            <div className="role-chips">
              {['supervisor', 'asset_admin', 'director'].map((r) => (
                <Chip
                  key={r}
                  label={r === 'asset_admin' ? 'Admin Aset' : r.toUpperCase()}
                  onPress={() => setFormData({ ...formData, role: r })}
                  selected={formData.role === r}
                  variant="outline"
                  size="medium"
                />
              ))}
            </div>
          </div>

          <Input
            placeholder="Email Perusahaan"
            type="email"
            value={formData.email}
            onChangeText={(t) => setFormData({ ...formData, email: t })}
          />

          <Input
            placeholder="Username Login"
            value={formData.username}
            onChangeText={(t) => setFormData({ ...formData, username: t })}
          />

          <Input
            placeholder="Password"
            type="password"
            value={formData.password}
            onChangeText={(t) => setFormData({ ...formData, password: t })}
          />

          <Button
            title="Mulai Verifikasi E-mail"
            onClick={handleRegister}
            loading={loading}
            variant="primary"
            size="large"
            fullWidth
          />

          <Button
            title="Sudah punya akun? Login"
            onClick={() => navigate('/')}
            variant="outline"
            size="medium"
            fullWidth
            style={{ marginTop: 16, border: 'none', background: 'transparent' }}
          />
        </div>
      </div>
    </div>
  );
}
