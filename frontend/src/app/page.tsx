import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="auth-hero">
      <header className="site-header">
        <div className="container wrap">
          <Link href="/" className="brand">LintLoop</Link>
          <div className="caption">Practice Coding</div>
        </div>
      </header>

      <section className="container center" style={{ padding: '56px 24px' }}>
        <div className="auth-card">
          <h1>LintLoop — Get instant feedback on your code</h1>
          <p className="lead">Learn as you code with real problems, automated tests, and helpful hints — iterate fast and ship better solutions.</p>

          <div className="stack-16 mt-24">
            <Link href="/signin" className="btn">Sign in</Link>
            <Link href="/signup" className="btn secondary">Create account</Link>
          </div>

          <div className="divider" style={{ marginTop: 20 }}>What you can do</div>

          <div className="stack-12 mt-12">
            <div>
              <h3 style={{ margin: 0, color: 'var(--text)', fontSize: 16, fontWeight: 700 }}>Instant feedback</h3>
              <p className="caption">Run tests on your code and get detailed results with helpful error messages.</p>
            </div>
            <div>
              <h3 style={{ margin: 0, color: 'var(--text)', fontSize: 16, fontWeight: 700 }}>Learn as you code</h3>
              <p className="caption">Progressive hints and examples help you learn without spoiling the solution.</p>
            </div>
            <div>
              <h3 style={{ margin: 0, color: 'var(--text)', fontSize: 16, fontWeight: 700 }}>Track progress</h3>
              <p className="caption">View submission history, success rate, and execution metrics to measure improvement.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container" style={{ padding: '28px 24px' }}>
          <div className="mb-2 caption">Questions? Contact support@lintloop.dev</div>
          <ul className="grid">
            <li><a href="#" className="link">FAQ</a></li>
            <li><a href="#" className="link">Help Center</a></li>
            <li><a href="#" className="link">Terms of Use</a></li>
            <li><a href="#" className="link">Privacy</a></li>
          </ul>
        </div>
      </footer>
    </main>
  );
}