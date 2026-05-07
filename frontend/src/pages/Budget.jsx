import { useEffect, useState } from 'react'
import api from '../api/client'
import { fmtVND } from '../utils/format'
import { PageHeader, Card, Spinner, PrimaryBtn, Modal, Field, TextInput, FieldGroup, ErrorMsg, ProgressBar } from '../components/ui'

function EditBudgetsModal({ categories, onClose, onDone }) {
  const [entries, setEntries] = useState(() =>
    Object.fromEntries(categories.map(c => [c.CategoryID, c.limitAmount > 0 ? String(Math.round(c.limitAmount)) : '']))
  )
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const save = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const budgets = Object.entries(entries).map(([categoryID, v]) => ({
        categoryID: +categoryID,
        limitAmount: parseFloat(v) || 0,
      }))
      await api.put('/budgets', { budgets })
      onDone()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Edit Budget Limits" onClose={onClose}>
      <form onSubmit={save}>
        <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
          {categories.map(c => (
            <div key={c.CategoryID} className="flex items-center gap-3">
              <span className="text-sm text-gray-700 w-40 truncate">{c.CategoryName}</span>
              <TextInput
                value={entries[c.CategoryID]}
                onChange={v => setEntries(prev => ({ ...prev, [c.CategoryID]: v }))}
                placeholder="0"
                className="flex-1"
              />
            </div>
          ))}
        </div>
        <ErrorMsg msg={error} />
        <div className="flex gap-3 pt-4">
          <button type="button" onClick={onClose} className="flex-1 h-10 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={loading} className="flex-1 h-10 rounded-xl bg-[#5E548E] text-white text-sm font-semibold hover:bg-[#5E548E]/70 disabled:opacity-60">
            {loading ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function Budget() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await api.get('/budgets')
      setData(r.data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  if (loading) return <Spinner />

  const { summary, categories } = data || {}
  const exceeded = categories?.filter(c => c.limitAmount > 0 && c.spent >= c.limitAmount) || []
  const warning  = categories?.filter(c => c.limitAmount > 0 && c.spent / c.limitAmount >= 0.7 && c.spent < c.limitAmount) || []

  return (
    <div className="p-7 space-y-5">
      <PageHeader title="Budget" subtitle="Track your spending across categories" />

      {exceeded.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4">
          <p className="text-red-700 font-medium text-sm">⊙ Budget Limit Exceeded</p>
          <p className="text-red-600 text-xs mt-1">Exceeded in {exceeded.length} {exceeded.length === 1 ? 'category' : 'categories'}. Review your spending.</p>
        </div>
      )}
      {warning.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
          <p className="text-amber-700 font-medium text-sm">⚠︎  Approaching Budget Limit</p>
          <p className="text-amber-600 text-xs mt-1">Close to limit in {warning.length} {warning.length === 1 ? 'category' : 'categories'}.</p>
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
            <p className="text-gray-500 text-sm">Total Budget</p>
            <p className="text-xl font-semibold text-gray-800 mt-1">{fmtVND(summary.totalBudget)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
            <p className="text-gray-500 text-sm">Total Spent</p>
            <p className="text-xl font-semibold text-gray-800 mt-1">{fmtVND(summary.totalSpent)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
            <p className="text-gray-500 text-sm">Remaining</p>
            <p className={`text-xl font-semibold mt-1 ${summary.remaining >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmtVND(summary.remaining)}</p>
          </div>
        </div>
      )}

      <Card>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="text-base font-bold text-gray-800">Budget Categories</h3>
          <PrimaryBtn onClick={() => setShowEdit(true)}>Edit Budgets</PrimaryBtn>
        </div>
        <div className="divide-y divide-gray-50 pb-4">
          {categories?.map(c => {
            const spent = parseFloat(c.spent)
            const limit = parseFloat(c.limitAmount)
            const pct   = limit > 0 ? Math.min(spent / limit, 1) : 0
            const barColor = pct >= 1 ? 'bg-red-500' : pct >= 0.7 ? 'bg-amber-500' : 'bg-[#E0B1CB]'
            return (
              <div key={c.CategoryID} className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">■ {c.CategoryName}</span>
                  {limit > 0 && (
                    <span className="text-xs text-gray-500">{fmtVND(spent)} / {fmtVND(limit)}</span>
                  )}
                </div>
                <ProgressBar value={pct} color={barColor} />
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs text-gray-400">{(pct*100).toFixed(1)}% used</span>
                  <span className={`text-xs font-medium ${limit > 0 && limit - spent > 0 ? 'text-green-600' : limit > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                    {limit > 0 ? `${fmtVND(Math.max(limit - spent, 0))} left` : 'No limit set'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {showEdit && <EditBudgetsModal categories={categories} onClose={() => setShowEdit(false)} onDone={() => { setShowEdit(false); load() }} />}
    </div>
  )
}
