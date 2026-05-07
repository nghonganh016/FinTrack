import { useEffect, useState } from 'react'
import api from '../api/client'
import { fmtVND, daysLeft } from '../utils/format'
import { PageHeader, Spinner, PrimaryBtn, DangerBtn, Modal, Field, TextInput, Select, FieldGroup, ErrorMsg, ProgressBar, Card } from '../components/ui'

const ICONS = [
  { value: '/icons/goals/house.png',       label: 'Home' },
  { value: '/icons/goals/travel.png',     label: 'Travel' },
  { value: '/icons/goals/car.png',        label: 'Car' },
  { value: '/icons/goals/savings.png',    label: 'Savings' },
  { value: '/icons/goals/education.png',  label: 'Education' },
  { value: '/icons/goals/laptop.png',     label: 'Laptop' },
  { value: '/icons/goals/fitness.png',    label: 'Fitness' },
  { value: '/icons/goals/target.png',     label: 'Target' },
  { value: '/icons/goals/ring.png',       label: 'Ring' },
  { value: '/icons/goals/vacation.png',   label: 'Vacation' },
  { value: '/icons/goals/guitar.png', label: 'Guitar'},
  { value: '/icons/goals/smartphone.png', label: 'Phone'},
  { value: '/icons/goals/food.png', label: 'Food'},
  { value: '/icons/goals/baby.png', label: 'Baby'},
  { value: '/icons/goals/pets.png', label: 'Pets'},
]

function AddGoalModal({ onClose, onDone }) {
  const [icon, setIcon]       = useState('/icons/goals/target.svg')
  const [name, setName]       = useState('')
  const [target, setTarget]   = useState('')
  const [saved, setSaved]     = useState('0')
  const [date, setDate]       = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!name.trim())
      return setError('Goal name is required.')
    if (name.trim().length < 2)
      return setError('Goal name must be at least 2 characters.')
    if (name.trim().length > 100)
      return setError('Goal name must be at most 100 characters.')
    if (!/^[\p{L}\p{N} _-]+$/u.test(name.trim()))
      return setError('Goal name may only contain letters, numbers, spaces, hyphens and underscores.')
    const t = parseFloat(target)
    const s = parseFloat(saved || '0')
    if (isNaN(t) || t <= 0)
      return setError('Target amount must be a valid positive number.')
    if (t > 999999999999)
      return setError('Target amount is too large.')
    if (isNaN(s) || s < 0)
      return setError('Saved amount must be a valid non-negative number.')
    if (s > t)
      return setError('Saved amount cannot exceed target amount.')
    setLoading(true)
    try {
      await api.post('/goals', { goalName: name, icon, targetAmount: t, savedAmount: s, targetDate: date || null })
      onDone()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="New Savings Goal" onClose={onClose}>
      <form onSubmit={submit}>
        <FieldGroup>
          <Field label="Choose Icon">
            <div className="grid grid-cols-5 gap-2 bg-gray-50 rounded-xl p-3">
              {ICONS.map(ic => (
                <button key={ic.value} type="button" onClick={() => setIcon(ic.value)}
                  className={`h-10 rounded-lg flex items-center justify-center ${
                    icon === ic.value ? 'bg-[#EDE9FF] border-2 border-[#6B52C8]' : 'hover:bg-gray-100'
                  }`}>
                  <img src={ic.value} alt={ic.label} className="w-6 h-6" />
                </button>
              ))}   
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Goal Name"><TextInput value={name} onChange={setName} placeholder="Emergency Fund" /></Field>
            <Field label="Target Amount (₫)"><TextInput value={target} onChange={setTarget} placeholder="10000000" /></Field>
            <Field label="Already Saved (₫)"><TextInput value={saved} onChange={setSaved} placeholder="0" /></Field>
            <Field label="Target Date"><TextInput type="date" value={date} onChange={setDate} /></Field>
          </div>
          <ErrorMsg msg={error} />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 h-10 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 h-10 rounded-xl bg-[#6B52C8] text-white text-sm font-semibold hover:bg-[#5A42B0] disabled:opacity-60">
              {loading ? 'Saving…' : 'Add Goal'}
            </button>
          </div>
        </FieldGroup>
      </form>
    </Modal>
  )
}

function DepositModal({ goal, onClose, onDone }) {
  const [amount, setAmount]   = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) return setError('Enter a valid amount.')
    setLoading(true)
    try {
      await api.patch(`/goals/${goal.GoalID}/deposit`, { amount: amt })
      onDone()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title={`Deposit — ${goal.GoalName}`} onClose={onClose}>
      <form onSubmit={submit}>
        <FieldGroup>
          <Field label="Amount (₫)"><TextInput value={amount} onChange={setAmount} placeholder="0" /></Field>
          <ErrorMsg msg={error} />
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 h-10 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 h-10 rounded-xl bg-[#5E548E] text-white text-sm font-semibold hover:bg-[#5E548E]/70 disabled:opacity-60">
              {loading ? 'Saving…' : 'Deposit'}
            </button>
          </div>
        </FieldGroup>
      </form>
    </Modal>
  )
}

function GoalCard({ goal, onDeposit, onDelete }) {
  const target = parseFloat(goal.targetAmount)
  const saved  = parseFloat(goal.savedAmount)
  const pct    = target > 0 ? Math.min(saved / target, 1) : 0
  const days   = daysLeft(goal.TargetDate || goal.targetDate)
  const done   = pct >= 1

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl flex-shrink-0">
          <img
            src={goal.Icon || goal.icon || '/icons/goals/target.svg'}
            alt="goal"
            className="w-7 h-7"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800">{goal.GoalName || goal.goalName}</p>
          {days > 0 && <p className="text-xs text-gray-400 mt-0.5">{days} days remaining</p>}
        </div>
      </div>

      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-xl font-semibold text-gray-800">{fmtVND(saved)}</span>
        <span className="text-sm text-gray-400">of {fmtVND(target)}</span>
      </div>

      <ProgressBar value={pct} color={done ? 'bg-[#9F86C0]' : 'bg-[#E0B1CB]'} />

      <div className="flex items-center justify-between mt-2 mb-4">
        <span className="text-xs text-gray-400">{fmtVND(Math.max(target - saved, 0))} to go</span>
        <span className={`text-xs font-semibold ${done ? 'text-[#9F86C0]' : 'text-[#BE95C4]'}`}>{(pct*100).toFixed(1)}%</span>
      </div>

      <div className="flex gap-2">
        <button onClick={() => onDeposit(goal)} className="flex-1 h-8 bg-[#9F86C0]/25 hover:bg-[#5E548E] hover:text-white text-[#5E548E] text-xs font-semibold rounded-lg transition-colors">
          + Deposit
        </button>
        <DangerBtn onClick={() => onDelete(goal.GoalID || goal.goalID)}></DangerBtn>
      </div>
    </Card>
  )
}

export default function Goals() {
  const [goals, setGoals]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [depositGoal, setDep]   = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const r = await api.get('/goals')
      setGoals(r.data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const del = async (id) => {
    if (!confirm('Delete this goal?')) return
    await api.delete(`/goals/${id}`)
    load()
  }

  if (loading) return <Spinner />

  return (
    <div className="p-7 space-y-5">
      <PageHeader
        title="Financial Goals"
        subtitle="Track progress towards your savings goals"
        action={<PrimaryBtn onClick={() => setShowAdd(true)}>＋ Add Goal</PrimaryBtn>}
      />

      {goals.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-4xl mb-3">🎯</p>
          <p className="text-gray-500 text-sm">No goals yet. Add your first savings goal!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map(g => (
            <GoalCard key={g.GoalID || g.goalID} goal={g} onDeposit={setDep} onDelete={del} />
          ))}
        </div>
      )}

      {showAdd    && <AddGoalModal onClose={() => setShowAdd(false)} onDone={() => { setShowAdd(false); load() }} />}
      {depositGoal && <DepositModal goal={depositGoal} onClose={() => setDep(null)} onDone={() => { setDep(null); load() }} />}
    </div>
  )
}
