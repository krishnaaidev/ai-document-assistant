import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Brain, Eye, EyeOff, Mail, Lock, Sparkles, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { Footer } from '../../components/common/Footer';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import { AuthShowcase } from '../../components/auth/AuthShowcase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const { signIn, currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) navigate('/dashboard', { replace: true });
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const msg = err?.code === 'auth/invalid-credential'
        ? 'Invalid email or password.'
        : err?.message || 'Failed to sign in. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090D16] text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200 relative selection:bg-indigo-500/20">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Product Showcase & Description (Desktop) */}
          <div className="hidden lg:block lg:col-span-7 bg-white/40 dark:bg-slate-900/40 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md shadow-xl overflow-hidden">
            <AuthShowcase />
          </div>

          {/* Right Column: Sign In Form */}
          <div className="w-full max-w-md mx-auto lg:col-span-5">
            {/* Mobile Tool Summary Header */}
            <div className="lg:hidden text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 rounded-2xl mb-3 shadow-lg shadow-indigo-500/25">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                AI Document Assistant
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                Next-Gen Multimodal RAG & Knowledge Workspace
              </p>

              {/* Mobile "What is it?" Accordion Toggle */}
              <button
                type="button"
                onClick={() => setShowMobileDetails(!showMobileDetails)}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>{showMobileDetails ? 'Hide Tool Details' : 'What is this tool?'}</span>
                {showMobileDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showMobileDetails && (
                <div className="mt-4 p-4 rounded-2xl bg-white dark:bg-slate-900 text-left text-xs border border-slate-200 dark:border-slate-800 shadow-md space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    <strong>AI Document Assistant</strong> is a Retrieval-Augmented Generation (RAG) system that indexes your PDFs, Word documents (.docx), and files so you can query them with natural language.
                  </p>
                  <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      Page-accurate citations with source verification
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      Executive summaries from 100+ page documents
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      Sub-2 second responses powered by Gemini 3.5
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Desktop Form Card Header */}
            <div className="hidden lg:block mb-6">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Welcome back
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Sign in to your document workspace
              </p>
            </div>

            {/* Form Card */}
            <div className="bg-white/90 dark:bg-[#111827]/90 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl p-6 sm:p-8 backdrop-blur-md">
              {error && (
                <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/60 focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Password
                    </label>
                    <Link
                      to="/reset-password"
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-10 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/60 focus:border-indigo-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {loading ? 'Signing in...' : 'Sign in to workspace'}
                </button>
              </form>

              {/* What is it quick info footer inside the card */}
              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Supports PDF, Word (.docx) & TXT with citation accuracy
                </p>
              </div>
            </div>

            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
              Don't have an account?{' '}
              <Link to="/signup" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                Create free account
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Footer className="border-t-0 bg-transparent py-4" />
    </div>
  );
}

export { LoginPage };
