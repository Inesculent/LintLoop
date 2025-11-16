export default function HomePage() {
  return (
    <div className="container center" style={{minHeight: '100vh'}}>
      <div className="auth-card">
        <h1>Welcome to LintLoop</h1>
        <p className="lead">Practice coding with real-time feedback and automated grading.</p>
        <div className="stack-16 mt-24">
          <a href="/signin" className="btn">Sign In</a>
          <a href="/signup" className="btn secondary">Create Account</a>
        </div>
      </div>
    </div>
  );
}