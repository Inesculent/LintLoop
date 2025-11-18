"use client";

export const dynamic = 'force-static';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';
      const res = await fetch(`${apiBase}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || 'Signup failed');
        setLoading(false);
        return;
      }
      
      // Show success message and redirect to a "check your email" page or signin
      alert(data.message || 'Account created! Please check your email to verify your account.');
      router.push('/signin');
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
          <h1>Create an account</h1>
          <p className="lead">Start practicing coding with real-time feedback. Enter your details to sign up.</p>

          <form className="stack-16" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="name" className="label">Full name</label>
              <input id="name" name="name" type="text" required placeholder="Jane Doe" className="input" value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="field">
              <label htmlFor="email" className="label">Email</label>
              <input id="email" name="email" type="email" required placeholder="name@example.com" className="input" value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            <div className="field">
              <label htmlFor="password" className="label">Password</label>
              <input id="password" name="password" type="password" required placeholder="At least 8 characters" className="input" value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            <div className="field">
              <label htmlFor="confirm" className="label">Confirm password</label>
              <input id="confirm" name="confirm" type="password" required placeholder="Repeat password" className="input" value={confirm} onChange={e => setConfirm(e.target.value)} />
            </div>

            <button type="submit" className="btn" disabled={loading}>{loading ? 'Creating…' : 'Create account'}</button>
            {error && <div style={{color: 'salmon', marginTop: 8}}>{error}</div>}

            {/* Removed Google sign-up placeholder (no backend OAuth implemented) */}
          </form>

          <p className="mt-24 caption">
            Already have an account?{" "}
            <Link className="link" href="/signin">Sign in</Link>
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