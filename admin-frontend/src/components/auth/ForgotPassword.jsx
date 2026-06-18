import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Alert from '../common/Alert';
import Button from '../common/Button';
import { APP_NAME } from '../../utils/constants';
import { validateEmail } from '../../utils/helpers';

const ForgotPassword = ({ onBack }) => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    const result = resetPassword(email);
    if (result.success) {
      setSuccess(result.message);
      setTimeout(() => onBack(), 2000);
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>{APP_NAME}</h1>
          <p>Reset Your Password</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Alert type="error" message={error} onClose={() => setError('')} />
          <Alert type="success" message={success} onClose={() => setSuccess('')} />

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@trimax.com"
              autoComplete="email"
            />
          </div>

          <Button type="submit" variant="primary" fullWidth>
            Send Reset Link
          </Button>

          <Button type="button" variant="text" fullWidth onClick={onBack}>
            Back to Login
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;