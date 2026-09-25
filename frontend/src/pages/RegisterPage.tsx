import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole, RegisterPayload } from '../types';
import { 
  User as UserIcon, 
  Mail, 
  Lock, 
  Phone, 
  Shield, 
  ArrowRight, 
  AlertCircle,
  Building2,
  Radio,
  GraduationCap,
  Users,
  ShieldCheck,
  Check
} from 'lucide-react';

interface RegisterPageProps {
  onNavigateLogin: () => void;
  onRegisterSuccess: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigateLogin, onRegisterSuccess }) => {
  const { register, isLoading } = useAuth();
  
  const [formData, setFormData] = useState<RegisterPayload>({
    name: '',
    email: '',
    password: '',
    role: 'CITIZEN',
    phone: '',
    village: '',
    ward: '',
    district: 'Rudraprayag',
    state: 'Uttarakhand',
    latitude: 30.2844,
    longitude: 78.9811,
  });

  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const rolesList: { role: UserRole; title: string; desc: string; icon: React.ElementType }[] = [
    {
      role: 'CITIZEN',
      title: 'Citizen Volunteer',
      desc: 'Receive localized early warnings, view safe shelters & submit crowdsourced flood reports.',
      icon: Users
    },
    {
      role: 'RESEARCHER',
      title: 'Hydrologist / Researcher',
      desc: 'Access raw sensor feeds, hydrographs, AI forecast models & historical flood datasets.',
      icon: GraduationCap
    },
    {
      role: 'RESPONSE_TEAM',
      title: 'Emergency Response / NDRF',
      desc: 'Monitor live radar, manage evacuation convoys, and update active rescue operations.',
      icon: Radio
    },
    {
      role: 'GOVERNMENT_OFFICIAL',
      title: 'Disaster Authority Official',
      desc: 'Command console, issue multi-channel emergency broadcasts & manage relief center logistics.',
      icon: Building2
    },
    {
      role: 'ADMIN',
      title: 'System Administrator',
      desc: 'Configure sensor hardware, watershed boundaries, user roles & system parameters.',
      icon: Shield
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (formData.password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      await register(formData);
      onRegisterSuccess();
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Registration failed. Please check your details.';
      setErrorMessage(detail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden animate-fadeIn">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-slate-100 pb-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 uppercase">
                New User Onboarding
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">Register for Early Warning Platform</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              Select your operational role and provide territorial location details.
            </p>
          </div>

          <button
            onClick={onNavigateLogin}
            className="px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-all self-start sm:self-auto"
          >
            Already registered? <strong className="text-blue-600 ml-1">Sign In</strong>
          </button>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-3">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block mb-0.5">Registration Error</strong>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Select Operational Role */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              1. Select Operational Role & Privilege Level
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {rolesList.map((r) => {
                const Icon = r.icon;
                const isSelected = formData.role === r.role;
                return (
                  <div
                    key={r.role}
                    onClick={() => setFormData({ ...formData, role: r.role })}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50/90 border-blue-500 shadow-md shadow-blue-500/10 ring-2 ring-blue-500/30'
                        : 'bg-slate-50/80 border-slate-200/90 hover:border-slate-300 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-500'}`} />
                        <span className={`text-xs font-bold ${isSelected ? 'text-blue-950' : 'text-slate-800'}`}>{r.title}</span>
                      </div>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-white">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{r.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Personal & Credential Info */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              2. Account Credentials & Contact
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Dr. Rajesh / Officer Verma"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@organization.in"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min. 6 characters"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number (SMS Alerts)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91-9876543210"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">State / Province</label>
                <input
                  type="text"
                  value={formData.state || ''}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="Uttarakhand / Himachal Pradesh"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Step 3: Territorial Geolocation */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              3. Territorial Geolocation & Catchment Scope
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">District</label>
                <input
                  type="text"
                  value={formData.district || ''}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="Rudraprayag / Chamoli"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Village / Town / Sector</label>
                <input
                  type="text"
                  value={formData.village || ''}
                  onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                  placeholder="Sonprayag / Chopta"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ward / Post Code</label>
                <input
                  type="text"
                  value={formData.ward || ''}
                  onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                  placeholder="Ward 3"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={submitting || isLoading}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-blue-600/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Cryptographic Identity...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Complete Registration & Issue JWT</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
