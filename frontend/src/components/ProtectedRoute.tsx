import React, { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { ShieldAlert, Lock, ArrowRight, UserCheck } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  requiredPermission?: string;
  onNavigateLogin?: () => void;
  onNavigateRegister?: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredPermission,
  onNavigateLogin,
  onNavigateRegister,
}) => {
  const { user, isAuthenticated, isLoading, hasRole, hasPermission, demoLogin } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-mono text-sm">Verifying cryptographic token & role credentials...</p>
      </div>
    );
  }

  // Case 1: Unauthenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 glass-panel border border-amber-500/30 rounded-2xl text-center shadow-2xl shadow-amber-950/30">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
          <Lock className="w-8 h-8" />
        </div>
        <span className="px-3 py-1 text-xs font-mono font-bold tracking-widest text-amber-400 bg-amber-950/60 border border-amber-500/40 rounded-full uppercase">
          Authentication Required
        </span>
        <h2 className="text-2xl font-bold text-white mt-4 mb-2">Restricted Access Module</h2>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          This system module requires an authenticated identity with valid JWT bearer credentials. Please sign in or create an account to proceed.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {onNavigateLogin && (
            <button
              onClick={onNavigateLogin}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-600/30 flex items-center justify-center space-x-2 transition-all"
            >
              <span>Sign In to Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          {onNavigateRegister && (
            <button
              onClick={onNavigateRegister}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-all"
            >
              <span>Register Account</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Case 2: Role check failed
  const isRoleAllowed = allowedRoles ? hasRole(allowedRoles) : true;
  const isPermissionAllowed = requiredPermission ? hasPermission(requiredPermission) : true;

  if (!isRoleAllowed || !isPermissionAllowed) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 glass-panel border border-rose-500/30 rounded-2xl shadow-2xl shadow-rose-950/30">
        <div className="flex items-start space-x-5">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 flex-shrink-0 shadow-lg shadow-rose-500/10">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="px-2.5 py-0.5 text-[11px] font-mono font-bold tracking-wider text-rose-400 bg-rose-950/60 border border-rose-500/40 rounded-full uppercase">
                403 Forbidden
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Current Role: <strong className="text-cyan-400 font-bold">{user.role}</strong>
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Insufficient Role Privileges</h2>
            <p className="text-slate-300 text-sm mb-4 leading-relaxed">
              Your account does not possess the requisite operational clearance for this feature.
            </p>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 mb-6 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Required Role(s):</span>
                <span className="font-mono text-cyan-300 font-semibold">
                  {allowedRoles ? allowedRoles.join(', ') : 'Specialized Role'}
                </span>
              </div>
              {requiredPermission && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Required Capability:</span>
                  <span className="font-mono text-emerald-400 font-semibold">{requiredPermission}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Your Identity:</span>
                <span className="text-slate-300 font-mono">{user.email}</span>
              </div>
            </div>

            {/* Quick Role Switcher for Evaluators */}
            <div className="border-t border-slate-800 pt-4">
              <p className="text-xs text-slate-400 mb-3 flex items-center space-x-1.5 font-medium">
                <UserCheck className="w-4 h-4 text-cyan-400" />
                <span>Switch to an authorized role for live evaluation:</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {allowedRoles && allowedRoles.map((role) => (
                  <button
                    key={role}
                    onClick={() => demoLogin(role)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-medium transition-all shadow-sm shadow-cyan-500/20"
                  >
                    Switch to {role}
                  </button>
                ))}
                <button
                  onClick={() => demoLogin('ADMIN')}
                  className="px-3 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-300 text-xs font-mono font-medium transition-all"
                >
                  Switch to ADMIN (Superuser)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
