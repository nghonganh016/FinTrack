import { useEffect, useState, useCallback } from 'react'
import api from '../api/client'
import { fmtVND, fmtDate } from '../utils/format'
import { PageHeader, Card, Spinner, PrimaryBtn, DangerBtn, Modal, Field, TextInput, Select, FieldGroup, ErrorMsg, Badge } from '../components/ui'

function AddTxModal({ onClose, onDone }) {
  const [type, setType]       = useState('Expense')
  const [desc, setDesc]       = useState('')
  const [amount, setAmount]   = useState('')
  const [date, setDate]       = useState(new Date().toISOString().slice(0,10))
  const [catID, setCatID]     = useState('')
  const [accID, setAccID]     = useState('')
  const [cats, setCats]       = useState([])
  const [accs, setAccs]       = useState([])
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Promise.all([api.get('/transactions/categories'), api.get('/accounts')]).then(([c, a]) => {
      setCats(c.data)
      setAccs(a.data)
      if (c.data.length) setCatID(c.data[0].CategoryID)
      if (a.data.length) setAccID(a.data[0].AccountID)
    })
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0)
      return setError('Enter a valid positive amount.')
    if (amt > 999999999999)
      return setError('Amount is too large.')
    if (desc.trim().length > 255)
      return setError('Description must be at most 255 characters.')
    if (!/^[\p{L}\p{N} _-]+$/u.test(desc.trim()))
      return setError('Description may only contain letters, numbers, spaces, hyphens and underscores.')
    if (type === 'Expense' && !catID)
      return setError('Select a category.')
    if (!accID)
      return setError('Select an account.')
    setLoading(true)
    try {
      await api.post('/transactions', { type, amount: amt, date, accountID: +accID, description: desc, categoryID: type === 'Expense' ? +catID : undefined })
      onDone()
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Failed to add.')
    } finally {
      setLoading(false)
    }
  }

  const accOptions = accs.map(a => ({
    value: a.AccountID,
    label: `${a.AccountName}  (${fmtVND(a.Balance)})`
  }))

  return (
    <Modal title="Add Transaction" onClose={onClose}>
      <form onSubmit={submit}>
        <FieldGroup>
          <Field label="Type">
            <div className="flex gap-3">
              {['Expense','Income'].map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={type === t} onChange={() => setType(t)} className="accent-[#5E548E]" />
                  <span className="text-sm text-gray-700">{t}</span>
                </label>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Description">
              <TextInput value={desc} onChange={setDesc} placeholder="e.g. Grocery shopping" />
            </Field>
            <Field label="Amount (₫)">
              <TextInput value={amount} onChange={setAmount} placeholder="0" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {type === 'Expense' && (
              <Field label="Category">
                <Select value={catID} onChange={setCatID} options={cats.map(c => ({ value: c.CategoryID, label: c.CategoryName }))} />
              </Field>
            )}
            <Field label="Date">
              <TextInput type="date" value={date} onChange={setDate} />
            </Field>
          </div>
          <Field label="Account">
            <Select value={accID} onChange={setAccID} options={accOptions} />
          </Field>
          <ErrorMsg msg={error} />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 h-10 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 h-10 rounded-xl bg-[#5E548E] text-white text-sm font-semibold hover:bg-[#5E548E]/70 disabled:opacity-60">
              {loading ? 'Adding…' : 'Add Transaction'}
            </button>
          </div>
        </FieldGroup>
      </form>
    </Modal>
  )
}

// Tooltip component for full description on hover
function DescriptionCell({ text }) {
  const [hovered, setHovered] = useState(false)
  if (!text) return <span className="text-gray-400">—</span>

  return (
    <div className="relative" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <span className="text-gray-800 cursor-default">{text}</span>
      {hovered && text.length > 0 && (
        <div className="absolute z-50 left-0 top-full mt-1 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl whitespace-normal max-w-[280px] min-w-[120px] leading-relaxed pointer-events-none">
          {text}
          <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 rotate-45" />
        </div>
      )}
    </div>
  )
}

export default function Transactions() {
  const [rows, setRows]       = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('All')
  const [accFilter, setAccFilter] = useState('')   // account filter
  const [accounts, setAccounts]   = useState([])   // for account dropdown
  const [showAdd, setShowAdd] = useState(false)

  // Load accounts list once for the filter dropdown
  useEffect(() => {
    api.get('/accounts').then(r => setAccounts(r.data)).catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { search, type: filter }
      if (accFilter) params.accountID = accFilter
      const r = await api.get('/transactions', { params })
      setRows(r.data.rows)
      setTotal(r.data.total)
    } catch {}
    setLoading(false)
  }, [search, filter, accFilter])

  useEffect(() => { load() }, [load])

  const del = async (id, type) => {
    await api.delete(`/transactions/${id}`, { params: { type } })
    load()
  }

  return (
    <div className="p-7 space-y-5">
      <PageHeader
        title="Transactions"
        subtitle="View and manage all your transactions"
        action={<PrimaryBtn onClick={() => setShowAdd(true)}>＋ Add Transaction</PrimaryBtn>}
      />

      {/* Toolbar */}
      <Card className="flex flex-wrap items-center gap-3 px-4 py-3">
        {/* Search */}
        <div className="flex-1 min-w-[180px] flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 h-9">
          <img src="/icons/search.png" alt="Search" className="w-4 h-4 opacity-40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search transactions…"
            className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder-gray-400"
          />
        </div>

        {/* Type filter */}
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="h-9 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:outline-none focus:border-[#6B52C8]"
        >
          {['All','Expense','Income'].map(v => <option key={v}>{v}</option>)}
        </select>

        {/* Account filter */}
        <select
          value={accFilter}
          onChange={e => setAccFilter(e.target.value)}
          className="h-9 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:outline-none focus:border-[#6B52C8]"
        >
          <option value="">All Accounts</option>
          {accounts.map(a => (
            <option key={a.AccountID} value={a.AccountID}>{a.AccountName}</option>
          ))}
        </select>

        <span className="text-xs text-gray-400">{total} transactions</span>
      </Card>

      {/* Table */}
      <Card>
        {loading ? <Spinner /> : rows.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">No transactions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['', 'Date', 'Description', 'Category', 'Account', 'Status', 'Amount', ''].map((h, i) => (
                    <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((row, i) => {
                  const amt = parseFloat(row.amount)
                  const initial = ((row.descr || row.category || '?')[0] || '?').toUpperCase()
                  return (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      {/* Avatar */}
                      <td className="pl-4 py-3 w-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${row.type === 'Income' ? 'bg-[#9F86C0]' : 'bg-[#E0B1CB]'}`}>
                          {initial}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(row.txdate)}</td>

                      {/* Description — full text with tooltip */}
                      <td className="px-4 py-3 text-gray-800 max-w-[200px]">
                        <DescriptionCell text={row.descr} />
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge className={row.type === 'Income' ? 'bg-[#9F86C0]/30 text-[#5E548E]' : 'bg-[#E0B1CB]/30 text-[#8D6093]'}>{row.category}</Badge>
                      </td>

                      {/* Account */}
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {row.AccountName || '—'}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge className="bg-green-100 text-green-800">{row.status}</Badge>
                      </td>

                      {/* Amount */}
                      <td className={`px-4 py-3 font-semibold whitespace-nowrap ${amt >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {amt >= 0 ? '+' : ''}{fmtVND(Math.abs(amt))}
                      </td>

                      {/* Delete */}
                      <td className="pr-4 py-3">
                        <DangerBtn onClick={() => del(row.id, row.type)}></DangerBtn>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showAdd && <AddTxModal onClose={() => setShowAdd(false)} onDone={() => { setShowAdd(false); load() }} />}
    </div>
  )
}