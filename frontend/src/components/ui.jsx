// Shared UI primitives

export function StatCard({ label, value, sub, subColor = 'text-green-600' }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-5">
      <p className="text-gray-500 text-sm mb-1">{label}</p>
      <p className="text-2xl font-semibold text-sidebar tracking-tight leading-tight">{value}</p>
      {sub && <p className={`text-xs mt-1 ${subColor}`}>{sub}</p>}
    </div>
  )
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between px-3 pt-7 pb-0">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>
      {children}
    </div>
  )
}

export function PrimaryBtn({ children, onClick, disabled, type = 'button', className = '' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`h-10 px-5 bg-[#5E548E] hover:bg-[#5E548E]/70 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center gap-2 ${className}`}
    >
      {children}
    </button>
  )
}

export function SecondaryBtn({ children, onClick, disabled, type = 'button', className = '' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`h-10 px-5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center gap-2 ${className}`}
    >
      {children}
    </button>
  )
}

export function DangerBtn({ onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`h-8 w-8 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center ${className}`}
    >
      <img src="/icons/delete.png" alt="Delete" className="w-4 h-4" />
    </button>
  )
}

export function Badge({ className = '', children }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${className}`}>
      {children}
    </span>
  )
}

export function ProgressBar({ value, color = 'bg-[#6B52C8]' }) {
  const pct = Math.min(Math.max(value, 0), 1) * 100
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-4 border-[#6B52C8]/20 border-t-[#6B52C8] rounded-full animate-spin" />
    </div>
  )
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

export function FieldGroup({ children }) {
  return <div className="space-y-4">{children}</div>
}

export function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

export function TextInput({ value, onChange, placeholder, type = 'text', disabled, className = '' }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 text-sm
        focus:outline-none focus:border-[#6B52C8] focus:ring-2 focus:ring-[#6B52C8]/20
        disabled:bg-gray-100 disabled:text-gray-400 transition-all ${className}`}
    />
  )
}

export function Select({ value, onChange, options, className = '' }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`w-full h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 text-sm
        focus:outline-none focus:border-[#6B52C8] focus:ring-2 focus:ring-[#6B52C8]/20 transition-all ${className}`}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

export function ErrorMsg({ msg }) {
  if (!msg) return null
  return <p className="text-red-500 text-xs mt-1">{msg}</p>
}
