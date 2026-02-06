'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Lock, User, Eye, EyeOff, LogIn, Zap, AlertTriangle,
  Key, Mail, CheckCircle, ArrowRight, Sparkles,
  Shield, Briefcase, Users, Eye as EyeIcon,
  Database, Server, Cpu, Activity, Network,
  ShieldCheck, BarChart, Globe
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const redirect = searchParams.get('redirect');
  const sessionExpired = searchParams.get('session') === 'expired';

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      toast.error('Please enter both username and password');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          rememberMe: formData.rememberMe
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Login successful!');
        
        setTimeout(() => {
          router.push(redirect || '/assets/dashboard');
        }, 500);
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { role: 'Admin', username: 'admin', password: 'admin123', color: 'bg-gradient-to-r from-red-500 to-orange-500', icon: Shield },
    { role: 'Manager', username: 'manager', password: 'manager123', color: 'bg-gradient-to-r from-blue-500 to-cyan-500', icon: Briefcase },
    { role: 'Staff', username: 'staff', password: 'staff123', color: 'bg-gradient-to-r from-green-500 to-emerald-500', icon: Users },
    { role: 'Viewer', username: 'viewer', password: 'viewer123', color: 'bg-gradient-to-r from-purple-500 to-pink-500', icon: EyeIcon },
  ];

  const features = [
    { icon: ShieldCheck, title: 'Secure Access', desc: 'Enterprise-grade security' },
    { icon: BarChart, title: 'Real-time Analytics', desc: 'Live asset tracking' },
    { icon: Globe, title: 'Cloud Based', desc: 'Access from anywhere' },
    { icon: Database, title: 'Centralized Data', desc: 'Single source of truth' },
  ];

  if (!mounted) return null;

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 left-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1500"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          opacity: 0.4
        }}></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-center gap-12">
          
          {/* Left Side - Branding & Features */}
          <div className="lg:w-1/2 space-y-8 px-4">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-lg opacity-70"></div>
                  <div className="relative p-4 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-2xl">
                    <Zap className="w-12 h-12 text-white animate-pulse" />
                  </div>
                </div>
                <div>
                  <h1 className="text-5xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                    AssetFlow
                  </h1>
                  <p className="text-lg text-slate-300 mt-2">Enterprise Asset Management Platform</p>
                </div>
              </div>

              <p className="text-xl text-slate-300 leading-relaxed">
                Streamline your asset management with our powerful, intuitive platform designed for modern enterprises.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-indigo-500/50 transition-all duration-300 hover:scale-105"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg group-hover:from-indigo-500/30 group-hover:to-purple-500/30 transition-all">
                      <feature.icon className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{feature.title}</h3>
                      <p className="text-sm text-slate-400">{feature.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Login Card */}
          <div className="lg:w-1/2 max-w-md">
            {/* Session Expired Alert */}
            {sessionExpired && (
              <div className="mb-6 animate-in slide-in-from-top duration-500">
                <div className="relative overflow-hidden rounded-xl border border-red-500/30 bg-gradient-to-r from-red-500/10 to-red-500/5">
                  <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-red-500 to-red-600"></div>
                  <div className="flex items-center gap-3 p-4 pl-6">
                    <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
                    <div>
                      <p className="text-sm font-medium text-red-300">Session Expired</p>
                      <p className="text-xs text-red-400/80">Please login again to continue</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="relative group">
              {/* Glow effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              
              {/* Login Card */}
              <div className="relative bg-gradient-to-br from-gray-900 to-slate-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-8 text-center border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
                  <div className="inline-flex items-center justify-center w-20 h-20 mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur-lg opacity-50"></div>
                      <div className="relative p-4 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-full shadow-2xl">
                        <Key className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                  <p className="text-slate-400">Sign in to your AssetFlow account</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="p-8">
                  <div className="space-y-6">
                    {/* Username Field */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Username or Email
                        </div>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-slate-500" />
                        </div>
                        <input
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          required
                          disabled={loading}
                          className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 transition-all backdrop-blur-sm"
                          placeholder="admin@assetflow.com"
                        />
                      </div>
                    </div>

                    {/* Password Field */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-3">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          Password
                        </div>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-slate-500" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          required
                          disabled={loading}
                          className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 transition-all backdrop-blur-sm"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center hover:scale-110 transition-transform"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-300" />
                          ) : (
                            <Eye className="h-5 w-5 text-slate-400 hover:text-slate-300" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Remember Me & Forgot Password */}
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          <input
                            id="remember-me"
                            name="rememberMe"
                            type="checkbox"
                            checked={formData.rememberMe}
                            onChange={handleInputChange}
                            disabled={loading}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded border ${formData.rememberMe ? 'bg-gradient-to-r from-indigo-500 to-purple-500 border-transparent' : 'border-slate-600 bg-white/5'} transition-all group-hover:scale-110`}>
                            {formData.rememberMe && (
                              <CheckCircle className="w-5 h-5 p-0.5 text-white" />
                            )}
                          </div>
                        </div>
                        <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                          Remember me
                        </span>
                      </label>
                      <Link 
                        href="/forgot-password" 
                        className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors hover:underline flex items-center gap-1"
                      >
                        Forgot password?
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>

                    {/* Login Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 group relative overflow-hidden"
                    >
                      {/* Shine effect */}
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                      
                      <div className="relative flex items-center justify-center gap-3">
                        {loading ? (
                          <>
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Signing in...</span>
                          </>
                        ) : (
                          <>
                            <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            <span>Sign In</span>
                            <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                          </>
                        )}
                      </div>
                    </button>
                  </div>
                </form>

                {/* Demo Accounts */}
                <div className="px-8 pb-8">
                  <div className="pt-6 border-t border-white/10">
                    <p className="text-sm text-slate-400 text-center mb-4 flex items-center justify-center gap-2">
                      <span>Quick access demo accounts</span>
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {demoAccounts.map((account) => (
                        <button
                          key={account.role}
                          type="button"
                          onClick={() => {
                            setFormData({
                              username: account.username,
                              password: account.password,
                              rememberMe: false
                            });
                            toast.success(`${account.role} credentials loaded`, {
                              icon: <account.icon className="w-4 h-4" />
                            });
                          }}
                          className={`py-3 px-4 ${account.color} text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2`}
                        >
                          <account.icon className="w-4 h-4" />
                          {account.role}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-8 text-center">
                    <p className="text-sm text-slate-500">
                      Need access?{' '}
                      <Link 
                        href="/contact" 
                        className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors hover:underline inline-flex items-center gap-1"
                      >
                        Contact administrator
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </p>
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-xs text-slate-600">
                        © {new Date().getFullYear()} AssetFlow Management System. v2.1.4
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}