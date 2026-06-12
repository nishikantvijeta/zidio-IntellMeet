import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { SEOHead } from '../components/common/SEOHead';
import Loader from '../components/common/Loader';
import { CheckCircle2, XCircle, Video } from 'lucide-react';

export const VerificationPage: React.FC = () => {
  const { verifyEmail } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const runVerification = async () => {
      if (!token) {
        setLoading(false);
        setMessage('Missing verification token. Check your email link.');
        return;
      }

      try {
        await verifyEmail(token);
        setSuccess(true);
        setMessage('Your email address has been verified successfully!');
      } catch (err: any) {
        setSuccess(false);
        setMessage(err.response?.data?.message || 'Verification failed. The token may be invalid or expired.');
      } finally {
        setLoading(false);
      }
    };

    runVerification();
  }, [token]);

  return (
    <div className="min-h-screen bg-[#06070a] text-gray-100 flex items-center justify-center font-sans gradient-bg-mesh p-6">
      <SEOHead title="Verify Email Account" />
      <div className="w-full max-w-md glass-panel rounded-3xl p-8 border border-white/10 shadow-2xl text-center space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <Link to="/" className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center shadow-lg">
            <Video className="w-6 h-6 text-white" />
          </Link>
          <h3 className="text-xl font-bold tracking-tight text-white mt-2">Email Verification</h3>
        </div>

        {loading ? (
          <div className="py-8">
            <Loader size="md" />
            <p className="text-xs text-gray-400 mt-4 animate-pulse">Verifying credentials, please wait...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-center">
              {success ? (
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-lg">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20 shadow-lg">
                  <XCircle className="w-8 h-8" />
                </div>
              )}
            </div>

            <p className="text-sm text-gray-300 leading-relaxed px-4">{message}</p>

            <Link
              to="/login"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-semibold hover:opacity-95 transition-all shadow-xl block cursor-pointer"
            >
              Go to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificationPage;
