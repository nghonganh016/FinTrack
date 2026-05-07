import { useEffect, useState } from 'react'
import api from '../api/client'
import { fmtVND } from '../utils/format'
import { StatCard, PageHeader, Card, Spinner, PrimaryBtn, DangerBtn, Modal, Field, TextInput, Select, FieldGroup, ErrorMsg } from '../components/ui'

const ACCOUNT_TYPES = ['Cash','Bank Account','Credit Card','Investment','E-Wallet','Other']
const BANKS = ['Vietcombank (VCB)','BIDV','VietinBank','Agribank','Techcombank','MB Bank','VPBank','ACB','Sacombank','TPBank','HDBank','OCB','SHB','MSB','SeABank','Shinhan Bank','HSBC','Standard Chartered','Citibank','Other']
const EWALLETS = ['MoMo','ZaloPay','ViettelPay','ShopeePay','VNPay','Payoo','Other']

const TYPE_ICON = {
  'Cash':           '/icons/cash.png',
  'Bank Account': '/icons/bank.png',
  'Credit Card':  '/icons/credit-card.png',
  'Investment':     '/icons/investment.png',
  'E-Wallet':     '/icons/ewallet.png',
  'Other':          '/icons/other.png',
}

function AddAccountModal({ onClose, onDone }) {
  const [name, setName]     = useState('')
  const [type, setType]     = useState('Bank Account')
  const [bank, setBank]     = useState(BANKS[0])
  const [ewallet, setEw]    = useState(EWALLETS[0])
  const [balance, setBal]   = useState('0')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!name.trim())
      return setError('Account name is required.')
    if (name.trim().length < 2)
      return setError('Account name must be at least 2 characters.')
    if (name.trim().length > 100)
      return setError('Account name must be at most 100 characters.')
    if (!/^[\p{L}\p{N} _-]+$/u.test(name.trim()))
      return setError('Account name may only contain letters, numbers, spaces, hyphens and underscores.')
    const bal = parseFloat(balance)
    if (isNaN(bal) || bal < 0)
      return setError('Balance must be a valid non-negative number.')
    if (isNaN(bal)) return setError('Invalid balance.')
    setLoading(true)
    try {
      await api.post('/accounts', {
        accountName: name,
        accountType: type,
        bankName: ['Bank Account','Credit Card'].includes(type) ? bank : null,
        provider: type === 'E-Wallet' ? ewallet : null,
        balance: bal,
      })
      onDone()
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Failed to save.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Add Account" onClose={onClose}>
      <form onSubmit={submit}>
        <FieldGroup>
          <Field label="Account Name">
            <TextInput value={name} onChange={setName} placeholder="e.g. My Savings" />
          </Field>
          <Field label="Account Type">
            <Select value={type} onChange={setType} options={ACCOUNT_TYPES.map(t => ({ value: t, label: t }))} />
          </Field>
          {['Bank Account','Credit Card'].includes(type) && (
            <Field label="Bank">
              <Select value={bank} onChange={setBank} options={BANKS.map(b => ({ value: b, label: b }))} />
            </Field>
          )}
          {type === 'E-Wallet' && (
            <Field label="Provider">
              <Select value={ewallet} onChange={setEw} options={EWALLETS.map(e => ({ value: e, label: e }))} />
            </Field>
          )}
          <Field label="Initial Balance (₫)">
            <TextInput value={balance} onChange={setBal} placeholder="0" />
          </Field>
          <ErrorMsg msg={error} />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 h-10 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 h-10 rounded-xl bg-[#5E548E] text-white text-sm font-semibold hover:bg-[#5E548E]/70 disabled:opacity-60 transition-colors">
              {loading ? 'Saving…' : 'Add Account'}
            </button>
          </div>
        </FieldGroup>
      </form>
    </Modal>
  )
}

export default function Accounts() {
  const [accounts, setAccounts] = useState([])
  const [summary, setSummary]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [deleteError, setDeleteError] = useState('')
  
  const load = async () => {
    setLoading(true)
    try {
      const [a, s] = await Promise.all([api.get('/accounts'), api.get('/accounts/summary')])
      setAccounts(a.data)
      setSummary(s.data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const del = async (id) => {
    setDeleteError('')
    if (!confirm('Delete this account?')) return
    try {
      await api.delete(`/accounts/${id}`)
      load()
    } catch (err) {
      setDeleteError(err.response?.data?.detail || 'Failed to delete account.')
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="p-7 space-y-6">
      <PageHeader
        title="Accounts"
        subtitle="Manage and track your accounts"
        action={<PrimaryBtn onClick={() => setShowAdd(true)}>＋ Add Account</PrimaryBtn>}
      />

      {deleteError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-red-700 font-semibold text-sm">Cannot Delete Account</p>
            <p className="text-red-600 text-xs mt-1">{deleteError}</p>
          </div>
          <button
            onClick={() => setDeleteError('')}
            className="text-red-400 hover:text-red-600 text-xl leading-none flex-shrink-0"
          >&times;</button>
        </div>
      )}
      
      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Total Net Worth"    value={fmtVND(summary.netWorth)}         sub={`${summary.accountCount} accounts`} subColor={summary.netWorth >= 0 ? 'text-green-600' : 'text-red-500'} />
          <StatCard label="Total Assets"       value={fmtVND(summary.totalAssets)}      sub="Positive balances" subColor="text-green-600" />
          <StatCard label="Total Liabilities"  value={fmtVND(summary.totalLiabilities)} sub="Credit outstanding" subColor={summary.totalLiabilities > 0 ? 'text-red-500' : 'text-gray-400'} />
        </div>
      )}

      <Card>
        <h3 className="px-5 pt-5 pb-3 text-base font-bold text-gray-800">All Accounts</h3>
        {accounts.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">No accounts yet. Add one above.</p>
        ) : (
          <div className="divide-y divide-gray-50 pb-3">
            {accounts.map(acc => {
              const bal = parseFloat(acc.Balance)
              const detail = [acc.AccountType, acc.BankName, acc.Provider].filter(Boolean).join('  ·  ')
              return (
                <div key={acc.AccountID} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                  <img
                      src={TYPE_ICON[acc.AccountType] || '/icons/other.svg'}
                      alt={acc.AccountType}
                      className="w-8 h-8"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">{acc.AccountName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{detail}</p>
                  </div>
                  <p className={`font-bold text-sm ${bal >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {fmtVND(bal)}
                  </p>
                  <DangerBtn onClick={() => del(acc.AccountID)}></DangerBtn>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {showAdd && <AddAccountModal onClose={() => setShowAdd(false)} onDone={() => { setShowAdd(false); load() }} />}
    </div>
  )
}
