import { useState } from 'react';
import { loginUser, registerSchool } from '../services/api';
import { 
  Building2, 
  ShieldCheck, 
  Lock, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  GraduationCap, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  KeyRound,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Login form state
  const [loginForm, setLoginForm] = useState({
    usernameOrEmail: '',
    password: ''
  });

  // Registration form state
  const [regForm, setRegForm] = useState({
    schoolCode: '',
    schoolName: '',
    district: 'Central District',
    address: '',
    principalName: '',
    contactNumber: '',
    studentCount: 500,
    classroomCount: 15,
    username: '',
    email: '',
    password: ''
  });

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await loginUser(loginForm.usernameOrEmail, loginForm.password);
      onLoginSuccess(data.user);
      onClose();
    } catch (err) {
      setErrorMessage(err.response?.data?.error || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (username, password) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await loginUser(username, password);
      onLoginSuccess(data.user);
      onClose();
    } catch (err) {
      setErrorMessage(err.response?.data?.error || err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await registerSchool(regForm);
      setSuccessMessage('School registered successfully!');
      setTimeout(() => {
        onLoginSuccess(data.user);
        onClose();
      }, 1000);
    } catch (err) {
      setErrorMessage(err.response?.data?.error || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-800 transition"
          >
            &times;
          </button>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-sm">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800">
                Authorized Access
              </span>
              <h2 className="text-xl font-bold text-white mt-1">Resource Bridge Portal</h2>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-2">
            Login as a registered School Administrator or an authorized Education Department Officer.
          </p>

          {/* Tab Selector */}
          <div className="mt-4 flex bg-slate-800/80 p-1 rounded-lg border border-slate-700 text-xs">
            <button
              onClick={() => { setAuthMode('login'); setErrorMessage(''); }}
              className={`flex-1 py-1.5 rounded-md font-semibold transition ${
                authMode === 'login' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setAuthMode('register'); setErrorMessage(''); }}
              className={`flex-1 py-1.5 rounded-md font-semibold transition ${
                authMode === 'register' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              Register New School
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{successMessage}</span>
            </div>
          )}

          {authMode === 'login' ? (
            <div className="space-y-4">
              {/* Quick Demo Logins for Beginner Testing */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Quick Demo Access (1-Click Login):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('officer', 'officer123')}
                    disabled={loading}
                    className="p-2.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-left transition flex items-center justify-between group shadow-2xs"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        Officer Portal
                      </div>
                      <div className="text-[10px] text-slate-400">Dr. Rajesh Sharma</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('schoola', 'school123')}
                    disabled={loading}
                    className="p-2.5 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg text-left transition flex items-center justify-between group shadow-2xs"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                        School A (Surplus)
                      </div>
                      <div className="text-[10px] text-emerald-600 font-medium">8 unused computers</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 transition" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('schoolb', 'school123')}
                    disabled={loading}
                    className="p-2.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 rounded-lg text-left transition flex items-center justify-between group shadow-2xs"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-rose-600" />
                        School B (Shortage)
                      </div>
                      <div className="text-[10px] text-rose-600 font-medium">Needs 15 computers</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-rose-600 transition" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('schoolc', 'school123')}
                    disabled={loading}
                    className="p-2.5 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-lg text-left transition flex items-center justify-between group shadow-2xs"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-amber-600" />
                        School C (Repairs)
                      </div>
                      <div className="text-[10px] text-amber-600 font-medium">4 underutilized / 10 repair</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-600 transition" />
                  </button>
                </div>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                  Or enter credentials
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Standard Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username or Email Address
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. officer or schoola"
                      value={loginForm.usernameOrEmail}
                      onChange={(e) => setLoginForm({ ...loginForm, usernameOrEmail: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-xs font-bold transition shadow-sm flex items-center justify-center space-x-1.5 disabled:opacity-50 mt-2"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
                </button>
              </form>
            </div>
          ) : (
            /* School Registration Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    School Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SCH-005"
                    value={regForm.schoolCode}
                    onChange={(e) => setRegForm({ ...regForm, schoolCode: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    District *
                  </label>
                  <select
                    value={regForm.district}
                    onChange={(e) => setRegForm({ ...regForm, district: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="South District">South District</option>
                    <option value="Central District">Central District</option>
                    <option value="West District">West District</option>
                    <option value="North District">North District</option>
                    <option value="East District">East District</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  School Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Government Secondary School, Block 7"
                  value={regForm.schoolName}
                  onChange={(e) => setRegForm({ ...regForm, schoolName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Principal Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Smt. Asha Rao"
                    value={regForm.principalName}
                    onChange={(e) => setRegForm({ ...regForm, principalName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98765 00000"
                    value={regForm.contactNumber}
                    onChange={(e) => setRegForm({ ...regForm, contactNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={regForm.studentCount}
                    onChange={(e) => setRegForm({ ...regForm, studentCount: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Classroom Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={regForm.classroomCount}
                    onChange={(e) => setRegForm({ ...regForm, classroomCount: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  placeholder="Street / Area / Pin"
                  value={regForm.address}
                  onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Admin Login Credentials
                </span>
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    placeholder="Admin Username"
                    value={regForm.username}
                    onChange={(e) => setRegForm({ ...regForm, username: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Official Email Address"
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="password"
                    required
                    placeholder="Password (minimum 6 characters)"
                    value={regForm.password}
                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-xs font-bold transition shadow-sm flex items-center justify-center space-x-1.5 disabled:opacity-50 mt-3"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{loading ? 'Registering School...' : 'Complete School Registration'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
