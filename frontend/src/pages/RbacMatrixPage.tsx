import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole, RolePermissionInfo } from '../types';
import { apiService } from '../services/api';
import { 
  CheckCircle2, 
  XCircle, 
  Terminal, 
  Layers, 
  ArrowRight, 
  RefreshCw 
} from 'lucide-react';

export const RbacMatrixPage: React.FC = () => {
  const { user, demoLogin } = useAuth();
  const [matrixData, setMatrixData] = useState<Record<string, RolePermissionInfo> | null>(null);
  const [loading, setLoading] = useState(false);
  const [endpointResults, setEndpointResults] = useState<Record<string, { status: number; message: string; ok: boolean }>>({});
  const [testingEndpoint, setTestingEndpoint] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatrix = async () => {
      try {
        const data = await apiService.getPermissionsMatrix();
        setMatrixData(data);
      } catch (err) {
        console.error('Failed to load matrix:', err);
      }
    };
    fetchMatrix();
  }, []);

  const endpointsToTest = [
    {
      id: 'citizen-portal',
      name: 'Citizen Disaster Portal',
      url: '/rbac/citizen/portal',
      allowedRoles: ['CITIZEN', 'ADMIN'],
      description: 'Public flood risk warnings, community report submissions & shelter locations'
    },
    {
      id: 'research-analytics',
      name: 'Research & Model Analytics',
      url: '/rbac/research/analytics',
      allowedRoles: ['RESEARCHER', 'ADMIN'],
      description: 'Raw hydrological sensor telemetry, hydrographs, and temporal forecasting models'
    },
    {
      id: 'response-status',
      name: 'Emergency Dispatch & Response',
      url: '/rbac/response/status',
      allowedRoles: ['RESPONSE_TEAM', 'GOVERNMENT_OFFICIAL', 'ADMIN'],
      description: 'Live sensor radar, active warnings, safe evacuation routes, and responder dispatch'
    },
    {
      id: 'gov-command',
      name: 'Government Executive Console',
      url: '/rbac/gov/command',
      allowedRoles: ['GOVERNMENT_OFFICIAL', 'ADMIN'],
      description: 'Strategic disaster management, emergency alert broadcast, and shelter capacity tracking'
    },
    {
      id: 'admin-users',
      name: 'Admin User Management',
      url: '/rbac/admin/users',
      allowedRoles: ['ADMIN'],
      description: 'System root control, user registry, IoT edge nodes, and platform config'
    }
  ];

  const handleTestEndpoint = async (url: string, endpointId: string) => {
    setTestingEndpoint(endpointId);
    try {
      const data = await apiService.testRoleEndpoint(url);
      setEndpointResults((prev) => ({
        ...prev,
        [endpointId]: {
          status: 200,
          message: JSON.stringify(data),
          ok: true
        }
      }));
    } catch (err: any) {
      const status = err.response?.status || 500;
      const detail = err.response?.data?.detail || err.message;
      setEndpointResults((prev) => ({
        ...prev,
        [endpointId]: {
          status,
          message: typeof detail === 'string' ? detail : JSON.stringify(detail),
          ok: false
        }
      }));
    } finally {
      setTestingEndpoint(null);
    }
  };

  const handleTestAll = async () => {
    setLoading(true);
    for (const ep of endpointsToTest) {
      await handleTestEndpoint(ep.url, ep.id);
    }
    setLoading(false);
  };

  const roles: UserRole[] = ['CITIZEN', 'RESEARCHER', 'RESPONSE_TEAM', 'GOVERNMENT_OFFICIAL', 'ADMIN'];

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-blue-50 text-blue-700 border-blue-300';
      case 'GOVERNMENT_OFFICIAL':
        return 'bg-indigo-50 text-indigo-700 border-indigo-300';
      case 'RESPONSE_TEAM':
        return 'bg-amber-50 text-amber-700 border-amber-300';
      case 'RESEARCHER':
        return 'bg-teal-50 text-teal-700 border-teal-300';
      case 'CITIZEN':
      default:
        return 'bg-sky-50 text-sky-700 border-sky-300';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8 animate-fadeIn pb-12">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-[10px] font-mono font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                Security Matrix
              </span>
              <span className="text-xs text-slate-500 font-mono font-semibold">FastAPI Dependency RBAC</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              Role-Based Access Control & Permission Inspector
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Real-time authorization matrix verifying cryptographic JWT claims against endpoint access rules.
            </p>
          </div>

          {/* Active Session & Fast Switcher */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 min-w-[300px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                Current Active Session
              </span>
              {user ? (
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getRoleBadgeStyle(user.role)}`}>
                  {user.role}
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                  UNAUTHENTICATED
                </span>
              )}
            </div>

            {user ? (
              <div className="text-xs font-mono text-slate-700 mb-3">
                <p className="truncate font-bold text-slate-900">{user.name}</p>
                <p className="text-slate-500 text-[11px] truncate">{user.email}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 mb-3">No active JWT bearer token loaded.</p>
            )}

            <div className="border-t border-slate-200 pt-2.5">
              <p className="text-[10px] text-slate-500 font-bold mb-1.5 uppercase tracking-wider">Switch role to test live authorization:</p>
              <div className="grid grid-cols-5 gap-1">
                {roles.map((r) => (
                  <button
                    key={r}
                    onClick={() => demoLogin(r)}
                    className={`px-1.5 py-1 rounded text-[9px] font-mono font-bold border transition-all truncate cursor-pointer ${
                      user?.role === r
                        ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300'
                    }`}
                    title={`Login as ${r}`}
                  >
                    {r.split('_')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Endpoint Permission Simulator */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center space-x-2">
              <Terminal className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">Live Endpoint RBAC Validator</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Sends authenticated requests from the current user identity to each role-gated backend route.
            </p>
          </div>

          <button
            onClick={handleTestAll}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Test All Endpoints</span>
          </button>
        </div>

        <div className="space-y-3">
          {endpointsToTest.map((ep) => {
            const result = endpointResults[ep.id];
            const isTesting = testingEndpoint === ep.id;

            return (
              <div
                key={ep.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-slate-900">{ep.name}</span>
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white text-blue-700 border border-slate-300 font-bold">
                      GET {ep.url}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{ep.description}</p>
                  
                  <div className="flex items-center space-x-2 text-[11px]">
                    <span className="text-slate-500 font-medium">Authorized Roles:</span>
                    <div className="flex flex-wrap gap-1">
                      {ep.allowedRoles.map((r) => (
                        <span key={r} className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-300 font-semibold">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Test Action & Live Response Status */}
                <div className="flex items-center space-x-3 shrink-0">
                  {result && (
                    <div className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center space-x-2 ${
                      result.ok
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : result.status === 403
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {result.ok ? (
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600" />
                      )}
                      <span className="font-bold">HTTP {result.status}</span>
                      <span className="text-[10px] max-w-[120px] truncate font-sans">
                        {result.ok ? 'Authorized' : result.status === 403 ? 'Forbidden' : 'Unauthorized'}
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => handleTestEndpoint(ep.url, ep.id)}
                    disabled={isTesting || loading}
                    className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold transition-all disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer shadow-xs"
                  >
                    <span>{isTesting ? 'Sending...' : 'Test Request'}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Permissions Matrix Breakdown Table */}
      {matrixData && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center space-x-2 mb-6">
            <Layers className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Full Role Permissions Reference Matrix</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(matrixData).map(([roleKey, info]) => {
              const isCurrent = user?.role === roleKey;
              return (
                <div
                  key={roleKey}
                  className={`p-5 rounded-xl border flex flex-col justify-between ${
                    isCurrent
                      ? 'bg-blue-50/50 border-blue-400 shadow-xs ring-2 ring-blue-400/30'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getRoleBadgeStyle(roleKey as UserRole)}`}>
                        {roleKey}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] text-blue-600 font-bold font-mono">YOUR ROLE</span>
                      )}
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 mb-1">{info.title}</h3>
                    <p className="text-xs text-slate-500 mb-4">{info.description}</p>
                    
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Capabilities & Privileges:
                      </span>
                      {info.permissions.map((perm) => (
                        <div key={perm} className="flex items-center space-x-2 text-xs text-slate-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="font-mono text-[11px]">{perm}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-200">
                    <button
                      onClick={() => demoLogin(roleKey as UserRole)}
                      className="w-full py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-800 text-xs font-mono font-bold border border-slate-300 transition-all cursor-pointer shadow-xs"
                    >
                      Assume {roleKey} Identity
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
