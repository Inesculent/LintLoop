'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function Navigation() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.replace('/signin');
  };

  return (
    <nav className="bg-gray-900 text-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="brand">
              LintLoop
            </Link>
            <div className="ml-10 flex items-baseline space-x-4">
              <Link href="/dashboard" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800">
                Dashboard
              </Link>
              <Link href="/problems" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800">
                Problems
              </Link>
              <Link href="/submissions" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800">
                Submissions
              </Link>
            </div>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center px-3 py-2 border rounded text-gray-300 border-gray-700 hover:bg-gray-800"
            >
              <span>Account</span>
              <svg className="ml-2 h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>

            {isMenuOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5">
                <div className="py-1">
                  <Link 
                    href="/profile" 
                    className="block px-4 py-2 text-sm hover:bg-gray-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link 
                    href="/settings" 
                    className="block px-4 py-2 text-sm hover:bg-gray-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-700"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}