import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { validateEmail } from '@/utils/validators';
import { Footer } from '@/components/common/Footer';

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
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col justify-between py-6 sm:px-6 lg:px-8">
      <div className="flex-1 flex flex-col justify-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600 text-white shadow-elevation mb-3">
          <FileText className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-charcoal-900">
          Reset password
        </h2>
        <p className="mt-1 text-sm text-charcoal-500">
          We will send recovery instructions to your email
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-elevation border border-neutral-200/80 rounded-2xl sm:px-10">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-semibold text-charcoal-900">Check your inbox</h3>
              <p className="text-sm text-charcoal-600 leading-relaxed">
                If an account exists for <span className="font-semibold text-charcoal-900">{email}</span>, we&apos;ve sent instructions to reset your password.
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
                <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
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
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline"
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
