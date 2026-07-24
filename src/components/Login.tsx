import React, { useState } from 'react';
import { Shield, Key, AlertCircle, RefreshCw } from 'lucide-react';
import { User } from '../types';

interface LoginProps {
  onLoginSuccess: (user: User, token: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) {
      setError('Please enter your UserID');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        onLoginSuccess(data.user, data.token);
      } else {
        setError(data.message || 'Authentication rejected by security controller.');
      }
    } catch (err) {
      setError('Connection timeout with PSU Domain Controller.');
    } finally {
      setLoading(false);
    }
  };

  // One-click quick login for testing standard roles
  const handleQuickLogin = async (usr: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usr, password: 'password' })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        onLoginSuccess(data.user, data.token);
      }
    } catch (err) {
      setError('Mock server connectivity error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="aims-login-screen" className="min-h-screen bg-slate-100 flex flex-col justify-between font-sans">
      {/* Top Banner Accent */}
      <div className="w-full bg-gradient-to-r from-gov-blue-900 via-gov-blue-800 to-blue-900 border-b-4 border-yellow-500 py-4 px-6 md:px-12 text-white">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-sm shadow-md">
              {/* Reference the generated emblem logo */}
              <img 
                src="/src/assets/images/aims_gov_emblem_1779951913381.png" 
                alt="RINL VSP Emblem" 
                className="h-10 w-10 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <p className="text-xs font-mono text-yellow-300 font-semibold tracking-widest uppercase">Government of India Enterprise</p>
              <h1 className="text-base md:text-xl font-bold tracking-tight">RASHTRIYA ISPAT NIGAM LIMITED • VISAKHAPATNAM STEEL PLANT</h1>
            </div>
          </div>
          <div className="hidden md:block text-right">
            <span className="bg-blue-950/60 border border-blue-700/60 text-blue-200 text-[10px] uppercase font-semibold px-2.5 py-1 rounded-sm">
              Secured Intranet Gateway V3.4
            </span>
          </div>
        </div>
      </div>

      {/* Main Form Center */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-slate-300 shadow-xl rounded-sm overflow-hidden animate-fade-in">
          {/* Form Header */}
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-md font-bold text-slate-800">AIMS Central Sign-On</h2>
              <p className="text-xs text-slate-500">Audit Information Management System</p>
            </div>
            <div className="bg-blue-50 p-2 rounded-sm text-blue-800">
              <Shield className="w-5 h-5" />
            </div>
          </div>

          <form onSubmit={handleFormLogin} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-600 p-3 text-xs text-red-800 flex items-start gap-2 rounded-2xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                UserID
              </label>
              <div className="relative">
                <input
                  id="username-field"
                  type="text"
                  placeholder="e.g. 1001, 2002, 3003, 4004, or 5005"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="oracle-field-value w-full pl-3 py-2 text-sm rounded-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password-field"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="oracle-field-value w-full pl-3 py-2 text-sm rounded-sm"
                />
              </div>
              <div className="text-right mt-1">
                <span className="text-[11px] text-blue-700 hover:underline cursor-pointer font-medium">
                  Forgot PIN / Password?
                </span>
              </div>
            </div>

            <button
              id="login-submit-button"
              type="submit"
              disabled={loading}
              className="w-full btn-primary-gov py-2 mt-2 font-bold"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  AUTHENTICATING WITH ACTIVE DIRECTORY...
                </>
              ) : (
                'ENTER AIMS SECURE APPLICATION'
              )}
            </button>
          </form>


        </div>
      </div>

      {/* Corporate Footer */}
      <div className="bg-slate-200 border-t border-slate-300 py-3 text-center text-xs text-slate-600 font-medium">
        <p>© 2026 Rashtriya Ispat Nigam Limited. All Rights Reserved. Audit Information Management System (AIMS).</p>
        <p className="text-[10px] text-slate-500 font-mono mt-0.5">Designed in conformity with Central Vigilance Commission (CVC) Digital Audit Protocols.</p>
      </div>
    </div>
  );
}
