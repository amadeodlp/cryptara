import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
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
    <div className="login">
      <div className="login__container">
        <div className="login__card">
          <div className="login__header">
            <h1 className="login__title">Finance Simplified</h1>
            <p className="login__subtitle">Sign in to your account</p>
          </div>
          
          <form className="login__form" onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              fullWidth
              placeholder="your@email.com"
              autoComplete="email"
            />
            
            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              fullWidth
              placeholder="••••••"
              autoComplete="current-password"
            />
            
            <Button
              type="submit"
              fullWidth
              loading={isLoading}
              className="login__submit-btn"
            >
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
