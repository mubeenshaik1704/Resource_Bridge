import { useState } from 'react';
import { loginUser } from '../services/api';
import {
  Building2,
  ShieldCheck,
  Lock,
  User,
  KeyRound,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ usernameOrEmail: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await loginUser(form.usernameOrEmail, form.password);
      onLoginSuccess(data.user);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.error || err.message || 'Invalid credentials. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col">

      {/* Top Government Bar */}
      <div className="bg-slate-950/80 border-b border-slate-800 py-2 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          System Online
        </div>
        <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
          Government of Education | Department Portal
        </span>
      </div>

      {/* Main centered content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">

          {/* Logo + Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg shadow-blue-900/40 mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div className="flex items-center justify-center mb-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-blue-400 bg-blue-950/60 border border-blue-800 px-3 py-0.5 rounded-full">
                Government Education Department
              </span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Resource Bridge
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              School Resource Allocation &amp; Management System
            </p>
          </div>

          {/* Amber Policy Notice */}
          <div className="mb-6 bg-amber-500/10 border border-amber-500/40 rounded-xl p-3 flex items-start gap-2.5 text-amber-300 text-xs">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <span>
              <strong className="font-bold text-amber-200">Statutory Policy:</strong>{' '}
              This system does not automatically transfer government-owned resources.
              All decisions require authorized officer approval.
            </span>
          </div>

          {/* Login Card */}
          <div className="bg-white/8 backdrop-blur-sm border border-slate-700 rounded-2xl overflow-hidden">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-5 py-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-bold text-white">Authorized Portal Access</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Sign in with your registered credentials to continue.
              </p>
            </div>

            {/* Form */}
            <div className="p-5">
              {errorMessage && (
                <div className="mb-4 p-3 bg-red-900/40 border border-red-700/60 text-red-300 text-xs rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Username or Email
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      autoComplete="username"
                      placeholder="Enter your username"
                      value={form.usernameOrEmail}
                      onChange={(e) => setForm({ ...form, usernameOrEmail: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-800/80 border border-slate-600 text-white placeholder-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                {/* Password field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-800/80 border border-slate-600 text-white placeholder-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-2.5 rounded-lg text-sm font-bold transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      Sign In to Portal
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom footer */}
      <div className="bg-slate-950/60 border-t border-slate-800 py-3 text-center text-[11px] text-slate-600">
        Resource Bridge &copy; {new Date().getFullYear()} — Government School Resource Allocation &amp; Management System
      </div>
    </div>
  );
}
