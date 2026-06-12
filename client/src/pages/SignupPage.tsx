import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { SEOHead } from '../components/common/SEOHead';
import { Video, Mail, Lock, User as UserIcon, RefreshCw, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

export const SignupPage: React.FC = () => {
  const { signup } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Custom interactive avatar selector
  const [avatarSeed, setAvatarSeed] = useState(() => Math.random().toString(36).substring(7));
  const currentAvatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${avatarSeed}`;

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRandomizeAvatar = () => {
    setAvatarSeed(Math.random().toString(36).substring(7));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await signup(username, email, password, currentAvatarUrl);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#06070a] text-gray-100 flex items-center justify-center font-sans gradient-bg-mesh p-6">
        <SEOHead title="Verify Email" />
        <div className="w-full max-w-md glass-panel rounded-3xl p-8 border border-white/10 shadow-2xl space-y-6 text-center animate-scale-in">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-lg">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white">Verify Your Email</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              We have sent a verification link to <span className="text-violet-400 font-semibold">{email}</span>.
            </p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5 text-xs text-gray-400 leading-relaxed">
            <p className="font-semibold text-white mb-1">Local Testing Notice:</p>
            If you do not have SMTP configured, the verification URL has been logged directly inside the **backend terminal console**. Copy it from there to activate your account!
          </div>
          <Link
            to="/login"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-semibold hover:opacity-95 transition-all shadow-xl block cursor-pointer"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06070a] text-gray-100 flex items-center justify-center font-sans gradient-bg-mesh p-6 relative">
      <SEOHead title="Sign Up" />

      {/* Decorative Spheres */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-violet-600/5 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-pink-600/5 blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md glass-panel rounded-3xl p-8 border border-white/10 shadow-2xl relative z-10 space-y-6">
        {/* Brand */}
        <div className="flex flex-col items-center text-center">
          <Link to="/" className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Video className="w-7 h-7 text-white" />
          </Link>
          <h3 className="text-2xl font-bold tracking-tight gradient-text mt-5">Create Account</h3>
          <p className="text-xs text-gray-500 mt-1.5">Get started with IntellMeet and collaborate with your teams.</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-start space-x-2 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="flex-1">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Selector */}
          <div className="flex items-center space-x-4 p-3 bg-white/5 rounded-2xl border border-white/5">
            <div className="relative">
              <img
                src={currentAvatarUrl}
                alt="Selected avatar"
                className="w-16 h-16 rounded-2xl bg-gray-900 border border-white/10 p-1.5 shadow-inner"
              />
              <button
                type="button"
                onClick={handleRandomizeAvatar}
                className="absolute -bottom-1 -right-1 p-1 bg-violet-600 hover:bg-violet-700 text-white rounded-lg shadow-md cursor-pointer transition-colors"
                title="Randomize Avatar"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 text-left">
              <span className="text-xs font-semibold text-gray-400 block mb-1">Your Avatar</span>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                Click the randomizer to cycle robotic illustrations, or enter a username to link a unique seed key.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600">Username</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                required
                value={username}
                onChange={e => {
                  setUsername(e.target.value);
                  if (e.target.value.trim()) setAvatarSeed(e.target.value.trim());
                }}
                placeholder="sarah_jones"
                className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm border focus:border-violet-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm border focus:border-violet-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm border focus:border-violet-500"
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
              <span>Create Account</span>
            )}
          </button>
        </form>

        <p className="text-xs text-center text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-violet-500 hover:text-violet-600 font-semibold underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
