import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, FileText, Brain } from 'lucide-react';
import { validateEmail } from '@/utils/validators';
import { Footer } from '@/components/common/Footer';
import { ThemeToggle } from '@/components/common/ThemeToggle';

export const ResetPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateEmail(email)) {
      setError('Please provide a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090D16] text-slate-900 dark:text-slate-100 flex flex-col justify-between py-6 sm:px-6 lg:px-8 transition-colors duration-200 relative">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 mb-4">
            <Brain className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Reset password
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            We will send recovery instructions to your email
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
          <div className="bg-white/90 dark:bg-[#111827]/90 py-8 px-6 shadow-xl border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:px-10 backdrop-blur-sm">
            {submitted ? (
              <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Check your inbox</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  If an account exists for <span className="font-semibold text-slate-900 dark:text-white">{email}</span>, we&apos;ve sent instructions to reset your password.
                </p>
                <div className="pt-4">
                  <Link to="/login">
                    <Button variant="outline" className="w-full">
                      Return to Login
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                {error && (
                  <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <Input
                  label="Registered email address"
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4" />}
                  helperText="Enter the email associated with your account"
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-2.5"
                  loading={loading}
                >
                  Send Reset Link
                </Button>

                <div className="text-center pt-2">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Sign in
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <Footer className="border-t-0 bg-transparent py-4" />
    </div>
  );
};

export default ResetPasswordPage;
