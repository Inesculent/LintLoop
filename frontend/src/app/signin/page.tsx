"use client";

export const dynamic = 'force-static';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [userIdFor2FA, setUserIdFor2FA] = useState<string | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [storedDeviceToken, setStoredDeviceToken] = useState<string | null>(null);

  useEffect(() => {
    try {
      const tok = localStorage.getItem('deviceToken');
      if (tok) setStoredDeviceToken(tok);
    } catch (e) {
      // ignore
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';
      const res = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberDevice: rememberMe, deviceToken: storedDeviceToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || 'Login failed');
        setLoading(false);
        return;
      }
      // If backend indicates 2FA is required, show the code entry UI
      if (data.requiresTwoFactor) {
        setUserIdFor2FA(data.userId ?? null);
        setRequiresTwoFactor(true);
        setLoading(false);
        return;
      }
      // Save token and redirect
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      if (data.deviceToken) {
        try {
          localStorage.setItem('deviceToken', data.deviceToken);
          setStoredDeviceToken(data.deviceToken);
        } catch (e) {
          // ignore storage errors
        }
      }
      router.push('/dashboard');
    } catch (err) {
      setError((err as Error).message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setVerifyError(null);
    if (!userIdFor2FA) {
      setVerifyError('Missing user ID for verification');
      return;
    }
    setVerifyLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';
      const res = await fetch(`${apiBase}/api/auth/verify-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userIdFor2FA, code: twoFactorCode, rememberDevice: rememberMe }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVerifyError(data?.message || 'Verification failed');
        setVerifyLoading(false);
        return;
      }
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      if (data.deviceToken) {
        try {
          localStorage.setItem('deviceToken', data.deviceToken);
          setStoredDeviceToken(data.deviceToken);
        } catch (e) {
          // ignore
        }
      }
      router.push('/dashboard');
    } catch (err) {
      setVerifyError((err as Error).message || 'Network error');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!userIdFor2FA) return;
    try {
      setVerifyError(null);
      setVerifyLoading(true);
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';
      const res = await fetch(`${apiBase}/api/auth/resend-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userIdFor2FA })
      });
      const data = await res.json();
      if (!res.ok) {
        setVerifyError(data?.message || 'Failed to resend code');
      } else {
        // show success message briefly
        setVerifyError('Verification code resent — check your email (spam folder).');
      }
    } catch (err) {
      setVerifyError((err as Error).message || 'Network error');
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <main className="auth-hero">
      {/* Header with brand */}
      <header className="site-header">
        <div className="container wrap">
          <Link href="/" className="brand">LintLoop</Link>
          <div className="caption">Practice Coding</div>
        </div>
      </header>

      {/* Content */}
      <section className="container center" style={{ padding: "56px 24px" }}>
        <div className="auth-card">
          <h1>Sign in</h1>
          <p className="lead">Welcome back. Enter your email and password to continue.</p>

          <form className="stack-16" onSubmit={requiresTwoFactor ? handleVerify : handleSubmit}>
            {!requiresTwoFactor && (
              <>
                <div className="field">
                  <label htmlFor="email" className="label">Email</label>
                  <input id="email" name="email" type="email" required placeholder="name@example.com" className="input" value={email} onChange={e => setEmail(e.target.value)} />
                </div>

                <div className="field">
                  <label htmlFor="password" className="label">Password</label>
                  <input id="password" name="password" type="password" required placeholder="••••••••" className="input" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
              </>
            )}

            {requiresTwoFactor && (
              <>
                <div className="field">
                  <label htmlFor="twofactor" className="label">Authentication code</label>
                  <input id="twofactor" name="twofactor" type="text" inputMode="numeric" maxLength={6} required placeholder="123456" className="input" value={twoFactorCode} onChange={e => setTwoFactorCode(e.target.value)} />
                </div>
                <div className="row">
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button type="button" className="link" onClick={() => { setRequiresTwoFactor(false); setUserIdFor2FA(null); setTwoFactorCode(''); }}>Back</button>
                    <button type="button" className="link" onClick={handleResendCode} disabled={verifyLoading}>Resend code</button>
                  </div>
                </div>
              </>
            )}

            {!requiresTwoFactor && (
              <div className="row">
                <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" className="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} /> <span className="caption">Remember me</span>
                </label>
                <Link href="#" className="link">Forgot password?</Link>
              </div>
            )}

            <button type="submit" className="btn" disabled={requiresTwoFactor ? verifyLoading : loading}>{(requiresTwoFactor ? (verifyLoading ? 'Verifying…' : 'Verify code') : (loading ? 'Signing in…' : 'Sign in'))}</button>
            {(error || verifyError) && <div style={{ color: 'salmon', marginTop: 8 }}>{verifyError ?? error}</div>}

            {/* Removed Google sign-in placeholder (no backend OAuth implemented) */}
          </form>

          <p className="mt-24 caption">
            New to LintLoop?{" "}
            <Link className="link" href="/signup">Create an account</Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <div className="container" style={{ padding: "28px 24px" }}>
          <div className="mb-2 caption">Questions? Contact support@lintloop.dev</div>
          <ul className="grid">
            <li><Link href="#" className="link">FAQ</Link></li>
            <li><Link href="#" className="link">Help Center</Link></li>
            <li><Link href="#" className="link">Terms of Use</Link></li>
            <li><Link href="#" className="link">Privacy</Link></li>
            <li><Link href="#" className="link">Cookie Preferences</Link></li>
            <li><Link href="#" className="link">Corporate Information</Link></li>
          </ul>
        </div>
      </footer>
    </main>
  );
}