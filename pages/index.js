// pages/index.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) setError(error.message);
    else alert('Check your email to confirm your account!');

    setLoading(false);
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow bg-white">
      <h1 className="text-2xl font-bold mb-6 text-center">Login / Sign Up</h1>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 mb-4 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 mb-4 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="mb-4 text-red-500">{error}</p>}

        <button
          className="w-full bg-blue-500 text-white p-2 rounded mb-2 disabled:opacity-50"
          disabled={loading}
          type="submit"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <button
          className="w-full bg-green-500 text-white p-2 rounded"
          onClick={handleSignUp}
          disabled={loading}
          type="button"
        >
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>
      </form>
    </div>
  );
}
