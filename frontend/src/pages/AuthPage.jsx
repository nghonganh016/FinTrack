import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Color palette: #E0B1CB, #BE95C4, #9F86C0, #5E548E, #231942

function EyeIcon({ visible }) {
  return visible ? (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function PasswordInput({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label style={{ color: '#231942' }} className="block text-sm font-semibold mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-12 px-4 pr-10 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-[#5E548E] focus:ring-1 focus:ring-[#5E548E] focus:shadow-[0_0_0_1px_#5E548E]"
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors text-gray-400 hover:text-gray-600"
        >
          <EyeIcon visible={show} />
        </button>
      </div>
    </div>
  )
}

function TextInput({ label, type = 'text', value, onChange, placeholder, disabled }) {
  return (
    <div>
      <label style={{ color: '#231942' }} className="block text-sm font-semibold mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full h-12 px-4 pr-10 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-[#5E548E] focus:ring-1 focus:ring-[#5E548E]"
      />
    </div>
  )
}

// Inline error with icon — persistent, not auto-dismissed
function InlineError({ msg }) {
  if (!msg) return null
  return (
    <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-sm" style={{ background: '#fde8f0', border: '1px solid #f0b8ce', color: '#7a1f3d' }}>
      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      <span>{msg}</span>
    </div>
  )
}

const gradientBtn = {
  background: 'linear-gradient(135deg, #9F86C0 0%, #5E548E 60%, #231942 100%)',
  color: '#fff',
  border: 'none',
  cursor: 'pointer',
}

export default function AuthPage() {
  const navigate = useNavigate()
  const { login, register } = useAuth()
  const [tab, setTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Login
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPw, setLoginPw] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  // Register
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regPw, setRegPw] = useState('')
  const [regPw2, setRegPw2] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    if (!loginEmail || !loginPw) return setError('Please fill in all fields.')
    setLoading(true)
    try {
      await login(loginEmail, loginPw)
      navigate('/dashboard')
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.error || ''
      // Map backend messages to user-friendly ones
      if (detail.toLowerCase().includes('not registered') || detail.toLowerCase().includes('email')) {
        setError('This email address is not registered. Please check or create a new account.')
      } else if (detail.toLowerCase().includes('password') || detail.toLowerCase().includes('incorrect')) {
        setError('Incorrect password. Please try again.')
      } else {
        setError(detail || 'Sign in failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    if (!regName || !regEmail || !regPw || !regPw2) return setError('Full name, email and password are required.')
    if (regPw.length < 6) return setError('Password must be at least 6 characters.')
    if (regPw !== regPw2) return setError('Passwords do not match.')
    setLoading(true)
    try {
      await register(regName, regEmail, regPw, regPhone)
      setSuccess('✓ Account created! Please sign in.')
      setTimeout(() => { setTab('login'); setSuccess(''); setLoginEmail(regEmail) }, 1500)
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.error || ''
      if (detail.toLowerCase().includes('already')) {
        setError('This email is already registered. Please sign in instead.')
      } else {
        setError(detail || 'Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const switchTab = (t) => { setTab(t); setError(''); setSuccess('') }

  return (
    <div className="min-h-screen flex" style={{ background: '#ffffff' }}>
      {/* Left panel */}
      <div
        className="bg-white hidden lg:flex w-[480px] flex-shrink-0 flex-col justify-center -mt-8 pt-0 p-12 relative overflow-hidden" style={{background: '#231942'}}
      >
      
        <div className="relative z-10">
          {/* App name */}
          <div className="flex items-center gap-2 mb-8">
            <span className="font-bold text-7xl leading-tight" style={{ color: '#ffffff'}}>FinTrack</span>
          </div>

          <h2 className="font-bold text-5xl leading-tight mb-4" style={{ color: '#BE95C4'}}>
            Smart finance<br />
            <span style={{ color: '#E0B1CB' }}>tracking.</span>
          </h2>
          <p className="mt-6 text-gray-300">
            Track expenses, plan budgets, and achieve your <br /> financial goals.
          </p>
      
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-2xl">

          {tab === 'login' ? (
            <div className="bg-white rounded-3xl p-10 space-y-6">
              <div>
                <h1 className="text-4xl font-medium mb-3" style={{ color: '#231942' }}>Welcome back</h1>
                <p className="text-gray-500">Sign in to your FinTrack account</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <TextInput label="Email address" type="email" value={loginEmail} onChange={setLoginEmail} placeholder="you@example.com" />
                <PasswordInput label="Password" value={loginPw} onChange={setLoginPw} placeholder="••••••••" />
                
                <InlineError msg={error} />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl font-bold text-sm transition-opacity disabled:opacity-60 hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
                  style={gradientBtn}
                >
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500">
                Don't have an account?{' '}
                <button onClick={() => switchTab('register')} className="font-medium hover:opacity-60 transition-opacity" style={{ color: '#5E548E' }}>
                  Register
                </button>
              </p>
            </div>

          ) : (
            <div className="bg-white rounded-3xl p-10 space-y-6">
              <div>
                <h2 className="text-4xl font-medium mb-3" style={{ color: '#231942' }}>Create account</h2>
                <p className="text-gray-500">Start tracking your finances today</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <TextInput label="Full name" value={regName} onChange={setRegName} placeholder="John Doe" />
                  <TextInput label="Email" type="email" value={regEmail} onChange={setRegEmail} placeholder="you@example.com" />
                  <TextInput label="Phone" value={regPhone} onChange={setRegPhone} placeholder="09xxxxxxxx" />
                  <PasswordInput label="Password" value={regPw} onChange={setRegPw} placeholder="min 6 characters" />
                </div>
                <PasswordInput label="Confirm password" value={regPw2} onChange={setRegPw2} placeholder="re-enter password" />

                <InlineError msg={error} />
                {success && (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm" style={{ background: '#edf7f0', border: '1px solid #a8d5b5', color: '#2d6a4f' }}>
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl font-bold text-sm transition-opacity disabled:opacity-60 hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
                  style={gradientBtn}
                >
                  {loading ? 'Creating account…' : 'Create account'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500">
                Already registered?{' '}
                <button onClick={() => switchTab('login')} className="font-medium hover:opacity-60 transition-opacity" style={{ color: '#5E548E' }}>
                  Sign in
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}