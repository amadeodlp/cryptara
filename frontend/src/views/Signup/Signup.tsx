import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerThunk } from '@/redux/slices/authSlice';
import { AppDispatch, RootState } from '@/redux/store';
import './styles.css';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [formErrors, setFormErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [backgroundImage, setBackgroundImage] = useState(0);
  const backgrounds = [
    'url("/src/assets/images/bg-finance-1.jpg")',
    'url("/src/assets/images/bg-finance-2.jpg")',
    'url("/src/assets/images/bg-finance-3.jpg")',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setBackgroundImage((prev) => (prev + 1) % backgrounds.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = { name: '', email: '', password: '', confirmPassword: '' };
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setFormErrors(newErrors);
    return !newErrors.name && !newErrors.email && !newErrors.password && !newErrors.confirmPassword;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const result = await dispatch(registerThunk({
      name: formData.name,
      email: formData.email,
      password: formData.password,
    }));

    if (registerThunk.fulfilled.match(result)) {
      navigate('/login', { state: { fromSignup: true } });
    }
  };

  return (
    <div className="signup-page">
      <div
        className="signup-background"
        style={{ backgroundImage: backgrounds[backgroundImage], opacity: 1 }}
      ></div>
      <div className="signup-overlay"></div>

      <div className="signup">
        <div className="signup__container">
          <div className="signup__logo-container">
            <h1 className="signup__logo"><span className="text-gradient">Cryptara</span></h1>
            <p className="signup__tagline">Secure. Efficient. Decentralized.</p>
          </div>

          <div className="signup__card glass-card">
            <div className="signup__header">
              <h2 className="signup__title">Create Your Account</h2>
              <p className="signup__subtitle">Join us for a modern crypto trading experience</p>
            </div>

            <form className="signup__form" onSubmit={handleSubmit}>
              {error && <div className="general-error">{error}</div>}

              <div className="form-group">
                <label htmlFor="name" className="input-label">Full Name</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  className="input-modern"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  autoComplete="name"
                />
                {formErrors.name && <div className="input-error">{formErrors.name}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="email" className="input-label">Email</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  className="input-modern"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  autoComplete="email"
                />
                {formErrors.email && <div className="input-error">{formErrors.email}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="password" className="input-label">Password</label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  className="input-modern"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••"
                  autoComplete="new-password"
                />
                {formErrors.password && <div className="input-error">{formErrors.password}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="input-label">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  className="input-modern"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••"
                  autoComplete="new-password"
                />
                {formErrors.confirmPassword && <div className="input-error">{formErrors.confirmPassword}</div>}
              </div>

              <div className="terms-privacy">
                <label className="checkbox-container">
                  <input type="checkbox" required />
                  <span className="checkmark"></span>
                  <span className="checkbox-label">
                    I agree to the <a href="#" className="link">Terms of Service</a> and <a href="#" className="link">Privacy Policy</a>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="btn-gradient signup-btn"
                disabled={isLoading}
              >
                {isLoading ? <span className="loading-spinner"></span> : 'Create Account'}
              </button>
            </form>

            <div className="signup__footer">
              <p className="login-prompt">
                Already have an account? <a href="/login" className="login-link">Sign in</a>
              </p>
            </div>
          </div>

          <div className="signup__features">
            <div className="feature-item">
              <div className="feature-icon">🔒</div>
              <div className="feature-text">End-to-end encryption</div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">⚡</div>
              <div className="feature-text">Lightning fast transactions</div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">💼</div>
              <div className="feature-text">Smart portfolio management</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
