import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthModalStore, useWalletStore } from '../store';
import { AuthService } from '../services/auth';
import type { UserWallet } from '../lib/supabase';

export const AuthModal: React.FC = () => {
  const { isLoginOpen, isSignupOpen, closeModals, openLogin, openSignup } = useAuthModalStore();
  const { setUser, setWallet, setLoading } = useWalletStore();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
    setError('');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    closeModals();
    resetForm();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (error) setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError('');
    setIsSubmitting(true);
    setLoading(true);

    try {
      const { user, wallet } = await AuthService.signIn(formData.email, formData.password);
      setUser(user);
      setWallet(wallet as UserWallet | null);
      handleClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    setError('');
    setIsSubmitting(true);
    setLoading(true);

    try {
      const { user, wallet } = await AuthService.signUp(formData.email, formData.password, formData.name.trim());
      setUser(user);
      setWallet(wallet as UserWallet | null);
      handleClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create account';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.8, y: 20 }
  };

  const isOpen = isLoginOpen || isSignupOpen;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="modal-content"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={handleClose}>
              ×
            </button>

            <div className="modal-header">
              <h2 className="modal-title">
                {isLoginOpen ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="modal-subtitle">
                {isLoginOpen 
                  ? 'Sign in to access your opBNB wallet' 
                  : 'Get started with your new opBNB wallet'
                }
              </p>
            </div>

            <form onSubmit={isLoginOpen ? handleLogin : handleSignup}>
              {isSignupOpen && (
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    className="form-input"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  name="password"
                  className="form-input"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {isSignupOpen && (
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    className="form-input"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              )}

              {error && (
                <motion.div
                  className="form-error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ marginBottom: 'var(--spacing-md)' }}
                >
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
                style={{ 
                  width: '100%', 
                  marginBottom: 'var(--spacing-md)' 
                }}
              >
                {isSubmitting ? (
                  <span className="animate-pulse">
                    {isLoginOpen ? 'Signing In...' : 'Creating Account...'}
                  </span>
                ) : (
                  isLoginOpen ? 'Sign In' : 'Create Account'
                )}
              </button>

              <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                {isLoginOpen ? (
                  <>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={openSignup}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#667eea',
                        textDecoration: 'underline',
                        cursor: 'pointer'
                      }}
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={openLogin}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#667eea',
                        textDecoration: 'underline',
                        cursor: 'pointer'
                      }}
                    >
                      Sign in
                    </button>
                  </>
                )}
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
