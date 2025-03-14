import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { useLoginMutation } from '@/redux/api/authApi';
import { login } from '@/redux/slices/authSlice';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import './styles.css';

const Login: React.FC = () => {
  const dispatch = useDispatch();
  const [loginUser, { isLoading }] = useLoginMutation();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });
  
  const [backgroundImage, setBackgroundImage] = useState(0);
  const backgrounds = [
    'url("/src/assets/images/bg-finance-1.jpg")',
    'url("/src/assets/images/bg-finance-2.jpg")',
    'url("/src/assets/images/bg-finance-3.jpg")',
  ];

  // Cycle through background images
  useEffect(() => {
    const interval = setInterval(() => {
      setBackgroundImage((prev) => (prev + 1) % backgrounds.length);
    }, 8000);
    
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {
      email: '',
      password: '',
    };
    
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
    
    setErrors(newErrors);
    return !newErrors.email && !newErrors.password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    try {
      const result = await loginUser(formData).unwrap();
      dispatch(login({ user: result.user, token: result.token }));
    } catch (error) {
      console.error('Login failed:', error);
      // Show generic error
      setErrors({
        email: '',
        password: 'Invalid email or password'
      });
    }
  };

  return (
    <div className="login-page">
      <div 
        className="login-background" 
        style={{ 
          backgroundImage: backgrounds[backgroundImage],
          opacity: 1,
        }}
      ></div>
      <div className="login-overlay"></div>
      
      <div className="login">
        <div className="login__container">
          <div className="login__logo-container">
            <h1 className="login__logo">Finance<span className="text-gradient">Simplified</span></h1>
            <p className="login__tagline">Secure. Efficient. Decentralized.</p>
          </div>
          
          <div className="login__card glass-card">
            <div className="login__header">
              <h2 className="login__title">Welcome Back</h2>
              <p className="login__subtitle">Sign in to your account</p>
            </div>
            
            <form className="login__form" onSubmit={handleSubmit}>
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
                {errors.email && <div className="input-error">{errors.email}</div>}
              </div>
              
              <div className="form-group">
                <div className="label-row">
                  <label htmlFor="password" className="input-label">Password</label>
                  <a href="#" className="forgot-password">Forgot password?</a>
                </div>
                <input
                  id="password"
                  type="password"
                  name="password"
                  className="input-modern"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••"
                  autoComplete="current-password"
                />
                {errors.password && <div className="input-error">{errors.password}</div>}
              </div>
              
              <div className="remember-me">
                <label className="checkbox-container">
                  <input type="checkbox" />
                  <span className="checkmark"></span>
                  <span className="checkbox-label">Remember me</span>
                </label>
              </div>
              
              <button
                type="submit"
                className="btn-gradient login-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="loading-spinner"></span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
            
            <div className="login__footer">
              <p className="signup-prompt">
                Don't have an account? <Link to="/signup" className="signup-link">Sign up</Link>
              </p>
            </div>
          </div>
          
          <div className="login__features">
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

export default Login;
