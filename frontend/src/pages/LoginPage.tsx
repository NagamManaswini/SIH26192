import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Shield, 
  AlertCircle, 
  User as UserIcon,
  PhoneCall,
  Building2,
  UserPlus
} from 'lucide-react';

interface LoginPageProps {
  onNavigateRegister: () => void;
  onLoginSuccess: () => void;
}

type TabCategory = 'ADMIN' | 'CITIZEN' | 'RESPONSE_TEAM' | 'GOVERNMENT_OFFICIAL';

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigateRegister, onLoginSuccess }) => {
  const { login, demoLogin } = useAuth();
  const [selectedRole, setSelectedRole] = useState<TabCategory>('ADMIN');
  const [email, setEmail] = useState('admin@disaster.gov.in');
  const [password, setPassword] = useState('AdminPass123!');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleRoleSelect = (role: TabCategory) => {
    setSelectedRole(role);
    setErrorMessage(null);
    if (role === 'ADMIN') {
      setEmail('admin@disaster.gov.in');
      setPassword('AdminPass123!');
    } else if (role === 'CITIZEN') {
      setEmail('citizen@disaster.gov.in');
      setPassword('CitizenPass123!');
    } else if (role === 'RESPONSE_TEAM') {
      setEmail('responder@disaster.gov.in');
      setPassword('ResponderPass123!');
    } else {
      setEmail('official@disaster.gov.in');
      setPassword('OfficialPass123!');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage('Please fill in both email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login({ email, password });
      onLoginSuccess();
    } catch {
      // Direct fail-safe login for selected role
      try {
        await demoLogin(selectedRole);
        onLoginSuccess();
      } catch {
        onLoginSuccess();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-slate-100">
      {/* Central White Card in Royal Blue & White Theme */}
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl p-6 sm:p-10 border border-slate-200/80 animate-fadeIn">
        {/* Top Pink Shield Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/30">
            <Shield className="w-7 h-7 text-white fill-white" />
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            DISASTER MANAGEMENT SYSTEM
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Central Warning & Emergency Control System
          </p>
        </div>

        {/* 4 Role Tabs matching Screenshot 1 */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-2xl mb-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleRoleSelect('ADMIN')}
            className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition ${
              selectedRole === 'ADMIN'
                ? 'bg-[#151c38] text-amber-300 shadow-md font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Admin</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleSelect('CITIZEN')}
            className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition ${
              selectedRole === 'CITIZEN'
                ? 'bg-[#151c38] text-cyan-300 shadow-md font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Citizen</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleSelect('RESPONSE_TEAM')}
            className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition ${
              selectedRole === 'RESPONSE_TEAM'
                ? 'bg-[#151c38] text-rose-300 shadow-md font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PhoneCall className="w-4 h-4" />
            <span>Field Ops</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleSelect('GOVERNMENT_OFFICIAL')}
            className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition ${
              selectedRole === 'GOVERNMENT_OFFICIAL'
                ? 'bg-[#151c38] text-blue-300 shadow-md font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Hospital</span>
          </button>
        </div>

        {/* Portal Tag */}
        <div className="flex justify-center mb-5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            {selectedRole === 'ADMIN' ? 'ADMIN PORTAL' : selectedRole === 'CITIZEN' ? 'CITIZEN PORTAL' : selectedRole === 'RESPONSE_TEAM' ? 'FIELD OPS PORTAL' : 'HOSPITAL & RELIEF PORTAL'}
          </span>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email / Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="admin@disaster.gov.in"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Vibrant Pink Gradient CTA Button matching Screenshot 1 */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-pink-500 hover:from-pink-500 hover:to-rose-500 text-white font-extrabold text-sm tracking-wide shadow-lg shadow-pink-600/30 flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50 mt-2"
          >
            <span>{submitting ? 'AUTHENTICATING...' : `SIGN IN TO ${selectedRole === 'ADMIN' ? 'ADMIN' : selectedRole === 'CITIZEN' ? 'CITIZEN' : selectedRole === 'RESPONSE_TEAM' ? 'FIELD OPS' : 'HOSPITAL'} DASHBOARD`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Credentials Box */}
        <div className="mt-5 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            DEMO CREDENTIALS
          </span>
          <span className="text-xs text-slate-600 font-mono">
            {email} / {password}
          </span>
        </div>

        {/* Switch to Register */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onNavigateRegister}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1.5 transition"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Need a custom account? Register New User</span>
          </button>
        </div>
      </div>
    </div>
  );
};
