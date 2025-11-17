export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <main className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <section>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900">LintLoop — Get instant feedback on your code</h1>
            <p className="mt-4 text-lg text-gray-700">Learn as you code with real problems, automated tests, and helpful hints — iterate fast and ship better solutions.</p>

            <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-4 sm:space-y-0">
              <a href="/signin" className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">Sign in</a>
              <a href="/signup" className="inline-flex items-center justify-center px-6 py-3 rounded-md border border-blue-600 text-blue-600 text-sm font-medium hover:bg-blue-50">Create account</a>
            </div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3" />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Instant feedback</h3>
                  <p className="text-sm text-gray-600">Run tests on your code and get immediate results with helpful error messages.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Learn as you code</h3>
                  <p className="text-sm text-gray-600">Hints, examples, and test-driven feedback help you master problems while solving them.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v4a1 1 0 001 1h3m10 0h3a1 1 0 001-1V7M7 21h10" />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Real problems</h3>
                  <p className="text-sm text-gray-600">Work on curated problems that cover algorithms, data structures, and real-world tasks.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c1.657 0 3-1.343 3-3S13.657 2 12 2 9 3.343 9 5s1.343 3 3 3zM6 20a6 6 0 0112 0" />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Track progress</h3>
                  <p className="text-sm text-gray-600">See your submission history and improvement over time.</p>
                </div>
              </div>
            </div>
          </section>

          <aside className="hidden md:block">
            <div className="rounded-xl bg-gradient-to-br from-gray-900 to-indigo-700 p-6 text-white shadow-lg">
              <pre className="bg-transparent font-mono text-sm overflow-auto">{`// Example
function sum(a, b) {
  return a + b;
}

console.log(sum(2,3)); // 5`}</pre>
            </div>
          </aside>
        </div>

        <section className="mt-14">
          <h2 className="text-2xl font-semibold text-gray-900">What you can do</h2>
          <p className="mt-2 text-gray-600">Practice, submit, and iterate — LintLoop gives you tools to learn faster.</p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-lg shadow">
              <h3 className="font-semibold text-gray-900">Submit code</h3>
              <p className="mt-2 text-sm text-gray-600">Write and submit solutions in multiple languages and run them against test suites.</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow">
              <h3 className="font-semibold text-gray-900">View results</h3>
              <p className="mt-2 text-sm text-gray-600">See detailed test results, execution time, and guidance for failures.</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow">
              <h3 className="font-semibold text-gray-900">Get hints</h3>
              <p className="mt-2 text-sm text-gray-600">Use progressive hints to learn techniques without spoiling solutions.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}