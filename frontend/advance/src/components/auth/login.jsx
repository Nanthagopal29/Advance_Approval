import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get('http://10.1.21.13:8600/login/');
      const users = res.data;

      const validUser = users.find(
        (user) =>
          user.username === username &&
          user.password === password &&
          (user.app_n === 2 || user.app_n === null)
      );

      if (!validUser) {
        setError('Invalid credentials or not authorized');
        return;
      }

      const role = validUser.screen_per.toLowerCase();

      // ✅ UPDATED PART (pass full user data)
      if (role === 'admin') {
        navigate('/admin', { state: validUser });
      } else if (role === 'request' || role === 'action') {
        navigate('/home', { state: validUser });
      } else if (role === 'statement') {
        navigate('/statement', { state: validUser });
      } else {
        setError('Unknown role');
      }

    } catch (err) {
      console.error(err);
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex w-1/2 bg-linear-to-br from-blue-700 via-indigo-700 to-violet-800 flex-col items-center justify-center p-14 relative overflow-hidden">

        <div className="absolute w-96 h-96 rounded-full border border-white/10 top-15 left-15" />
        <div className="absolute w-72 h-72 rounded-full border border-white/10 bottom-10 right-10" />
        <div className="absolute w-48 h-48 bg-white/5 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 blur-2xl" />

        <div className="relative z-10 text-center">
          <div className="bg-white/15 backdrop-blur border border-white/20 p-5 rounded-3xl inline-block mb-8 shadow-xl">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.745 3.745 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.745 3.745 0 013.296-1.043A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.745 3.745 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-3">Hero Fashion</h1>
          <p className="text-blue-200 text-base leading-relaxed max-w-xs">
            Manage advance requests, approvals, and attendance — all in one place.
          </p>

          <div className="mt-10 flex flex-col gap-3 text-left">
            {[
              { icon: '🔐', text: 'Role-based secure access' },
              { icon: '📋', text: 'Advance request & approval' },
              { icon: '📊', text: 'Real-time attendance reports' },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3 bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white text-sm backdrop-blur">
                <span className="text-lg">{f.icon}</span>
                {f.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-md">

          <div className="lg:hidden text-center mb-8">
            <span className="text-2xl font-extrabold text-indigo-700">Hero Fashion</span>
            <p className="text-gray-400 text-sm mt-1">Employee Portal</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200 px-8 py-10">

            <h2 className="text-2xl font-bold text-gray-800 mb-1">Sign in</h2>
            <p className="text-gray-400 text-sm mb-7">Enter your credentials to access your dashboard</p>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">

              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-4 pr-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50"
              />

              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-4 pr-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-sm bg-indigo-600 text-white"
              >
                {loading ? 'Signing in...' : 'Sign In →'}
              </button>

            </form>
          </div>

          <p className="text-center text-gray-400 text-xs mt-6">
            © 2026 Hero Fashion. All rights reserved.
          </p>
        </div>
      </div>

    </div>
  );
};

export default Login;