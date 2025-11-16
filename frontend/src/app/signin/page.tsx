"use client";

export const dynamic = 'force-static';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';
      const res = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || 'Login failed');
        setLoading(false);
        return;
      }
      // Save token and redirect
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      router.push('/dashboard');
    } catch (err) {
      setError((err as Error).message || 'Network error');
    } finally {
      setLoading(false);
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
      <section className="container center" style={{padding: "56px 24px"}}>
        <div className="auth-card">
          <h1>Sign in</h1>
          <p className="lead">Welcome back. Enter your email and password to continue.</p>

          <form className="stack-16" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email" className="label">Email</label>
              <input id="email" name="email" type="email" required placeholder="name@example.com" className="input" value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            <div className="field">
              <label htmlFor="password" className="label">Password</label>
              <input id="password" name="password" type="password" required placeholder="••••••••" className="input" value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            <div className="row">
              <label style={{display: "inline-flex", alignItems: "center", gap: 8}}>
                <input type="checkbox" className="checkbox" /> <span className="caption">Remember me</span>
              </label>
              <Link href="#" className="link">Forgot password?</Link>
            </div>

            <button type="submit" className="btn" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
            {error && <div style={{color: 'salmon', marginTop: 8}}>{error}</div>}

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
        <div className="container" style={{padding: "28px 24px"}}>
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