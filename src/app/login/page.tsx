'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, AlertCircle, Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotMessage, setForgotMessage] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login failed')
        return
      }

      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      router.push('/')
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotLoading(true)
    setForgotMessage('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      })

      const data = await response.json()
      setForgotMessage(data.message || 'If an account exists, a reset link has been sent.')
    } catch {
      setForgotMessage('If an account exists, a reset link has been sent.')
    } finally {
      setForgotLoading(false)
    }
  }

  if (showForgot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-4 border border-white/20">
              <span className="text-4xl">🤖</span>
            </div>
            <h1 className="text-3xl font-bold text-white">Sophie</h1>
            <p className="text-purple-200 mt-1 text-sm">AI Receptionist</p>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Reset Password</h2>
            <p className="text-gray-500 text-sm mb-6">Enter your email and we&apos;ll send you a reset link.</p>

            {forgotMessage && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {forgotMessage}
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2.5 rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50"
              >
                {forgotLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <button
              onClick={() => { setShowForgot(false); setForgotMessage('') }}
              className="w-full mt-4 text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              ← Back to Sign In
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 flex relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative z-10">
        <div className="max-w-lg text-center">
          <div className="inline-flex items-center justify-center w-28 h-28 bg-white/10 backdrop-blur-sm rounded-3xl mb-8 border border-white/20 shadow-2xl">
            <span className="text-6xl">🤖</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">Sophie</h1>
          <p className="text-2xl text-purple-200 mb-2">The AI Receptionist</p>
          <div className="w-16 h-1 bg-gradient-to-r from-purple-400 to-pink-400 mx-auto my-6 rounded-full" />
          <p className="text-purple-300 text-lg leading-relaxed mb-8">
            Intelligent call handling, real-time analytics, and seamless customer management — all powered by AI.
          </p>

          {/* Feature highlights */}
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <span className="text-2xl mb-2 block">📞</span>
              <p className="text-white font-medium text-sm">Smart Call Routing</p>
              <p className="text-purple-300 text-xs mt-1">AI-powered call management</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <span className="text-2xl mb-2 block">📊</span>
              <p className="text-white font-medium text-sm">Real-time Analytics</p>
              <p className="text-purple-300 text-xs mt-1">Live dashboard insights</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <span className="text-2xl mb-2 block">🎯</span>
              <p className="text-white font-medium text-sm">Sentiment Analysis</p>
              <p className="text-purple-300 text-xs mt-1">Understand caller emotions</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <span className="text-2xl mb-2 block">📅</span>
              <p className="text-white font-medium text-sm">Auto Scheduling</p>
              <p className="text-purple-300 text-xs mt-1">Calendar integration</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-4 border border-white/20">
              <span className="text-4xl">🤖</span>
            </div>
            <h1 className="text-3xl font-bold text-white">Sophie</h1>
            <p className="text-purple-200 mt-1">The AI Receptionist</p>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
            <p className="text-gray-500 text-sm mb-6">Sign in to your dashboard</p>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2.5 rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Signing in...' : (
                  <>Sign In <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-purple-300/60 text-xs mt-6">
            Powered by <span className="text-purple-300/80 font-medium">RPA Click</span>
          </p>
        </div>
      </div>
    </div>
  )
}
