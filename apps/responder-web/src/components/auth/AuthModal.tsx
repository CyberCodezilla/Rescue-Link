'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Shield, Lock, Mail, Key, ArrowRight, UserCheck, AlertCircle } from 'lucide-react';

type Mode = 'signin' | 'signup' | 'confirm';

export function AuthModal() {
  const { isAuthenticated, isLoading, signIn, signUp, confirmSignUp, userEmail } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (isLoading) return null;
  if (isAuthenticated) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      if (mode === 'signin') {
        const result = await signIn({ username: email, password });
        if (result.nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
          setMode('confirm');
          setSuccessMsg('Verification code sent to your email.');
        }
      } else if (mode === 'signup') {
        const result = await signUp({
          username: email,
          password,
          options: { userAttributes: { email } },
        });
        if (result.nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
          setMode('confirm');
          setSuccessMsg('Account created! Enter the confirmation code sent to your email.');
        }
      } else if (mode === 'confirm') {
        await confirmSignUp({ username: email, confirmationCode });
        setSuccessMsg('Email verified! You can now log in.');
        setMode('signin');
      }
    } catch (err: any) {
      console.error('[AuthModal] Auth error:', err);
      setError(err?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-2xl border border-line-2 bg-[#0d1424] p-6 shadow-2xl">
        {/* Tactical Header */}
        <div className="mb-6 flex items-center gap-3 border-b border-line-2 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-mono text-lg font-bold text-ink-900 tracking-wide uppercase">
              RescueLink Responder Auth
            </h2>
            <p className="font-mono text-xs text-ink-500">
              {mode === 'signin'
                ? 'Sign in to access assigned responder data'
                : mode === 'signup'
                ? 'Register new responder credentials'
                : 'Enter verification code from email'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-emerald-500/40 bg-emerald-950/40 p-3 text-xs text-emerald-300">
            <UserCheck className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode !== 'confirm' && (
            <>
              <div>
                <label className="mb-1 block font-mono text-xs text-ink-500">Rescuer Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-ink-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rescuer@organization.gov"
                    className="w-full rounded-lg border border-line-2 bg-surface-2 py-2 pl-9 pr-3 text-sm text-ink-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-mono text-xs text-ink-500">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-ink-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-line-2 bg-surface-2 py-2 pl-9 pr-3 text-sm text-ink-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                {mode === 'signup' && (
                  <p className="mt-1 font-mono text-[10px] text-ink-500">
                    Must be 8+ chars, with uppercase, lowercase & numbers.
                  </p>
                )}
              </div>
            </>
          )}

          {mode === 'confirm' && (
            <div>
              <label className="mb-1 block font-mono text-xs text-ink-500">Verification Code</label>
              <div className="relative">
                <Key className="absolute left-3 top-2.5 h-4 w-4 text-ink-500" />
                <input
                  type="text"
                  required
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  placeholder="123456"
                  className="w-full rounded-lg border border-line-2 bg-surface-2 py-2 pl-9 pr-3 font-mono text-sm tracking-widest text-ink-900 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-500/50 bg-blue-600/80 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all hover:bg-blue-500 active:scale-[0.99] disabled:opacity-50"
          >
            {submitting ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>
                  {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Rescuer Account' : 'Verify & Complete'}
                </span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Mode Switcher */}
        <div className="mt-6 border-t border-line-2 pt-4 text-center font-mono text-xs text-ink-500">
          {mode === 'signin' ? (
            <p>
              Need a rescuer account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                }}
                className="text-blue-400 hover:underline"
              >
                Register Here
              </button>
            </p>
          ) : (
            <p>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                }}
                className="text-blue-400 hover:underline"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
