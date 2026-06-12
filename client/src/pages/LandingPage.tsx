import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { SEOHead } from '../components/common/SEOHead';
import {
  Video,
  Sparkles,
  Bot,
  ArrowRight,
  TrendingUp,
  Activity,
  CheckSquare,
  Users,
  Compass
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-800 flex flex-col font-sans gradient-bg-mesh overflow-hidden relative">
      <SEOHead title="IntellMeet: Next-Gen AI Enterprise Meeting Hub" />

      {/* Decorative Blur Spheres (Soft, light colors) */}
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-5 flex items-center justify-between border-b border-slate-200/60 bg-white/70 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
            <Video className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <span className="font-bold text-sm text-slate-900 tracking-tight block leading-none">IntellMeet</span>
            <span className="text-[8px] font-bold text-purple-600 uppercase tracking-widest">Enterprise AI</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {user ? (
            <Link
              to="/dashboard"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-white text-xs font-semibold shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <span>Go to Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-slate-500 hover:text-slate-900 text-xs font-semibold px-3 py-2 transition-colors">
                Sign In
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-16 md:py-24 flex flex-col items-center justify-center text-center relative z-10">
        <div className="space-y-8 flex flex-col items-center text-center w-full">
          <div className="inline-flex items-center space-x-2 bg-purple-50 border border-purple-100 rounded-full px-3 py-1 text-[10px] font-bold text-purple-600 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Native Workspace Suite</span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 leading-[1.1] font-display max-w-2xl">
            The AI-Native Layer for <span className="text-blue-600">Enterprise</span> Meetings.
          </h2>

          <p className="text-sm md:text-base text-slate-500 max-w-xl leading-relaxed">
            IntellMeet coordinates crystal-clear WebRTC video streams with real-time speech-to-text models, sentiment tracking dashboards, and automated Kanban action checklists.
          </p>

          <div className="flex flex-wrap gap-3 justify-center pt-2">
            <Link
              to={user ? '/dashboard' : '/signup'}
              className="px-6 py-3.5 rounded-xl bg-slate-950 text-white text-xs font-bold hover:bg-slate-900 transition-all shadow-md flex items-center space-x-2 cursor-pointer"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to={user ? '/dashboard' : '/login'}
              className="px-6 py-3.5 rounded-xl bg-white text-slate-800 text-xs font-bold border border-slate-200 hover:bg-slate-50 transition-all shadow-sm flex items-center space-x-2 cursor-pointer"
            >
              <span>Join Meeting Room</span>
            </Link>
          </div>

          {/* AI Productivity Metrics */}
          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-200/80 w-full max-w-md">
            <div>
              <h4 className="text-lg font-black text-slate-900 font-display">98.7%</h4>
              <p className="text-[10px] text-slate-500 font-semibold uppercase">Action Accuracy</p>
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-900 font-display">12+ hrs</h4>
              <p className="text-[10px] text-slate-500 font-semibold uppercase">Weekly Saved</p>
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-900 font-display">99.9%</h4>
              <p className="text-[10px] text-slate-500 font-semibold uppercase">Uptime Score</p>
            </div>
          </div>

          {/* Customer Trust Indicators (Notion/Linear logo bar format) */}
          <div className="pt-8 space-y-2 w-full">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Trusted by builders at</span>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 opacity-50 filter grayscale contrast-200">
              <span className="text-xs font-extrabold tracking-tight text-slate-900 font-display">VERCEL</span>
              <span className="text-xs font-extrabold tracking-tight text-slate-900 font-display">LINEAR</span>
              <span className="text-xs font-extrabold tracking-tight text-slate-900 font-display">CURSOR</span>
              <span className="text-xs font-extrabold tracking-tight text-slate-900 font-display">NOTION</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 text-center text-[10px] text-slate-400 relative z-10 bg-white">
        <p>&copy; {new Date().getFullYear()} IntellMeet Enterprise AI. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
