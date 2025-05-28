//index.js

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';
import BackgroundLottie from '../components/BackgroundLottie';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) router.push('/homescreen');
    };
    checkUser();
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      router.push('/homescreen');
    }

    setLoading(false);
  }

  async function handleSignUp(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Sign up successful! Check your email to confirm your account.');
    }

    setLoading(false);
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-900">
      <BackgroundLottie />
  
      {/* Game Title */}
      <div className="absolute top-4 md:top-8 left-1/2 -translate-x-1/2 z-30 text-center w-full px-4">
  <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold animate-gradient bg-gradient-to-r from-amber-400 via-orange-300 to-amber-500 bg-clip-text text-transparent tracking-tight md:tracking-wide">
    Online Checkers
    <span className="absolute -inset-2 md:-inset-4 bg-gradient-to-r from-amber-400/30 to-amber-600/30 blur-xl md:blur-3xl -z-10" />
  </h1>
  <div className="h-0.5 md:h-1 bg-gradient-to-r from-amber-400/0 via-amber-400 to-amber-400/0 w-full md:w-3/4 lg:w-2/3 mx-auto mt-1 md:mt-2" />
</div>
  
      {/* Auth Card */}
      <div className="absolute inset-0 flex items-center justify-center z-20 p-4 mt-16">
        <div className="relative group">
          {/* Glowing effect */}
          <div className="absolute -inset-2 bg-gradient-to-r from-amber-400 to-orange-500 rounded-3xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity animate-pulse" />
          
          <div className="relative rounded-2xl shadow-2xl bg-gradient-to-br from-amber-100 via-amber-50 to-orange-50 p-[2px] w-full max-w-md overflow-hidden">
            {/* Inner card */}
            <div className="bg-slate-900/95 backdrop-blur-sm rounded-2xl px-8 py-10 w-full h-full">
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-semibold text-amber-100 mb-2">
                  {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-amber-100/70">
                  {isLogin ? 'Continue your checkers journey' : 'Join the royal game'}
                </p>
              </div>
  
              {/* Toggle button */}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                  setSuccess(null);
                }}
                className="w-full mb-8 text-center text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium"
              >
                {isLogin ? "New to the board? Create Account" : 'Already a player? Sign In'}
              </button>
  
              {/* Form */}
              <form onSubmit={isLogin ? handleLogin : handleSignUp} className="space-y-6">
                {/* Email Input */}
                <div>
                  <label className="block text-sm font-medium text-amber-100/80 mb-3">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 bg-slate-800/50 border border-amber-900/30 rounded-lg text-amber-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition placeholder:text-amber-100/40"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <svg className="absolute right-4 top-3.5 w-5 h-5 text-amber-100/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
  
                {/* Password Input */}
                <div>
                  <label className="block text-sm font-medium text-amber-100/80 mb-3">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-slate-800/50 border border-amber-900/30 rounded-lg text-amber-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition placeholder:text-amber-100/40"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <svg className="absolute right-4 top-3.5 w-5 h-5 text-amber-100/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                </div>
  
                {/* Display Name Input */}
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-amber-100/80 mb-3">
                      Display Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="King's Gambit"
                        className="w-full px-4 py-3 bg-slate-800/50 border border-amber-900/30 rounded-lg text-amber-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition placeholder:text-amber-100/40"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required
                      />
                      <svg className="absolute right-4 top-3.5 w-5 h-5 text-amber-100/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                )}
  
                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-amber-900/20 text-amber-300 rounded-lg flex items-center gap-2 border border-amber-800/50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">{error}</span>
                  </div>
                )}
  
                {/* Success Message */}
                {success && (
                  <div className="p-3 bg-green-900/20 text-green-300 rounded-lg flex items-center gap-2 border border-green-800/50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">{success}</span>
                  </div>
                )}
  
                {/* Submit Button */}
                <button
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-amber-50 py-3.5 px-4 rounded-lg font-semibold transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-amber-500/20"
                  disabled={loading}
                  type="submit"
                >
                  {loading ? (
                    isLogin ? 'Entering the Arena...' : 'Preparing Your Throne...'
                  ) : isLogin ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Sign In
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Claim Your Crown
                    </span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
