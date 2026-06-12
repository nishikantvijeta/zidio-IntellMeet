import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { SEOHead } from '../components/common/SEOHead';
import { Video, Lock, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const { resetPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Missing recovery token.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      setError('');
      setMessage('');
      setLoading(true);
      await resetPassword(token, password);
      setMessage('Password reset successful! You can now log in with your new password.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Password reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06070a] text-gray-100 flex items-center justify-center font-sans gradient-bg-mesh p-6">
      <SEOHead title="Set New Password" />
      <div className="w-full max-w-md glass-panel rounded-3xl p-8 border border-white/10 shadow-2xl space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <Link to="/" className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center shadow-lg">
            <Video className="w-6 h-6 text-white" />
          </Link>
          <h3 className="text-2xl font-bold tracking-tight text-white mt-2">New Password</h3>
          <p className="text-xs text-gray-400">Enter a secure new password for your account.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-start space-x-2 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="flex-1">{error}</p>
          </div>
        )}

        {message ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm text-gray-300 px-4">{message}</p>
            <Link
              to="/login"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-semibold hover:opacity-95 transition-all shadow-xl block cursor-pointer"
            >
              Go to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-gray-400">New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-12 pr-4 py-3 rounded-xl glass-input text-sm border focus:border-violet-500"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-gray-400">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full pl-12 pr-4 py-3 rounded-xl glass-input text-sm border focus:border-violet-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-semibold hover:opacity-95 transition-all shadow-xl shadow-violet-500/10 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span>Reset Password</span>
              )}
            </button>

            <Link
              to="/login"
              className="flex items-center justify-center space-x-2 text-xs text-gray-400 hover:text-white pt-2 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Login</span>
            </Link>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
