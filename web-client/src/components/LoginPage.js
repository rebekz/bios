import React, { useState } from 'react';
import { useMatrix } from '../App';

const LoginPage = () => {
  const { login, register, isLoading } = useMatrix();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isLoginMode && formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    const success = isLoginMode 
      ? await login(formData.username, formData.password)
      : await register(formData.username, formData.password);

    if (!success) {
      // Error handling is done in the context
      setFormData({ ...formData, password: '', confirmPassword: '' });
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setFormData({
      username: '',
      password: '',
      confirmPassword: ''
    });
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">
            {isLoginMode ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="login-subtitle">
            {isLoginMode 
              ? 'Sign in to your MTA account' 
              : 'Join the MTA BIOS platform'
            }
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              className="form-input"
              placeholder="Enter your username"
              value={formData.username}
              onChange={handleInputChange}
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleInputChange}
              required
              disabled={isLoading}
            />
          </div>

          {!isLoginMode && (
            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className="form-input"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
          )}

          <button
            type="submit"
            className="form-button"
            disabled={isLoading}
          >
            {isLoading 
              ? (isLoginMode ? 'Signing in...' : 'Creating account...') 
              : (isLoginMode ? 'Sign In' : 'Create Account')
            }
          </button>
        </form>

        <div className="form-toggle">
          {isLoginMode ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            className="form-toggle-link"
            onClick={toggleMode}
            disabled={isLoading}
          >
            {isLoginMode ? 'Create one' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;