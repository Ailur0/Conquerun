import React, { useEffect, useState } from 'react';
import { authService } from '../../services/authService';
import { User } from '../../types';
import { isValidPassword, isValidUsername, USERNAME_HINT } from '../../utils/validation';
import { PasswordChecklist } from './PasswordChecklist';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuth: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
  });
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const resetFormState = () => {
    setFormData({ email: '', password: '', confirmPassword: '', username: '' });
    setError('');
    setValidationError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationError('');

    if (!isLogin) {
      if (!isValidUsername(formData.username)) {
        setValidationError(`Username must be ${USERNAME_HINT.toLowerCase()}.`);
        return;
      }
      if (!isValidPassword(formData.password)) {
        setValidationError('Your password doesn\'t meet all the requirements yet.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setValidationError('Passwords do not match.');
        return;
      }
    }

    setIsLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await authService.login(formData.email, formData.password);
      } else {
        result = await authService.register(formData.email, formData.password, formData.username);
      }

      if (result.success && result.user) {
        onAuth(result.user);
        onClose();
        resetFormState();
      } else {
        setError(result.error || 'Authentication failed');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (!isOpen) return null;

  const passwordsMismatch = !isLogin && formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 fade-in overflow-y-auto">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md my-auto bounce-in"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all duration-200"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl text-white shadow-lg">
              🗺️
            </div>
            <h2 id="auth-modal-title" className="text-3xl font-bold text-gray-900 mb-2">
              {isLogin ? 'Welcome Back!' : 'Join Conquerun'}
            </h2>
            <p className="text-gray-600">
              {isLogin ? 'Sign in to keep conquering.' : 'Create an account to start claiming territory.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {!isLogin && (
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  autoFocus
                  autoComplete="username"
                  aria-describedby="username-hint"
                  className="input-field"
                  placeholder="Choose a username"
                />
                <p id="username-hint" className="mt-1.5 text-xs text-gray-500">{USERNAME_HINT}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                autoFocus={isLogin}
                autoComplete="email"
                inputMode="email"
                className="input-field"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                className="input-field"
                placeholder={isLogin ? 'Enter your password' : 'Create a password'}
              />
              {!isLogin && <PasswordChecklist password={formData.password} className="mt-2" />}
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  autoComplete="new-password"
                  aria-invalid={passwordsMismatch}
                  className={`input-field ${passwordsMismatch ? 'border-red-400' : ''}`}
                  placeholder="Re-enter your password"
                />
                {passwordsMismatch && (
                  <p className="mt-1.5 text-xs text-red-600">Passwords don't match yet.</p>
                )}
              </div>
            )}

            {(validationError || error) && (
              <div role="alert" className="bg-red-50 border border-red-200 rounded-xl p-3 slide-up">
                <p className="text-red-700 text-sm font-medium">{validationError || error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
                </div>
              ) : (
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
            </span>{' '}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                resetFormState();
              }}
              className="text-blue-600 hover:text-blue-700 font-semibold transition-colors underline decoration-2 underline-offset-2 hover:decoration-blue-700"
            >
              {isLogin ? 'Create one' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
