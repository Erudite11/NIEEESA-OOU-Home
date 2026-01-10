import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/router'

export default function AdminLogin(){
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const adminKey = router.query?.admin_key as string | undefined

  async function submit(e:any){
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await fetch('/api/admin/login', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ password }) })
    const json = await res.json()
    setLoading(false)
    if(json.success) router.push('/admin')
    else setError('Invalid password')
  }

  function useSecret(){
    if(adminKey){
      // set cookie and go to admin
      document.cookie = `nieeesa_admin=1; Path=/; Max-Age=${60*60}`
      router.push('/admin')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-4">
      <div className="w-full max-w-md bg-white/80 backdrop-blur rounded-2xl shadow-xl border border-slate-100 p-8">
        <div className="flex items-center gap-3 mb-6">
          <Image src="/assets/nieesa.jpg" alt="NIEEESA" width={40} height={40} className="rounded-full object-cover" />
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Admin Portal</h1>
            <p className="text-xs text-slate-500">NIEEESA • Secure Access</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-5">
          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <div className="mt-1 relative">
              <input type={show ? 'text' : 'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter admin password" className="block w-full border border-slate-200 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400" />
              <button type="button" onClick={() => setShow(s => !s)} className="absolute inset-y-0 right-2 my-auto h-8 w-8 grid place-items-center text-slate-500 hover:text-slate-700">
                {show ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 15.338 6.386 18 12 18c5.614 0 8.773-2.662 10.066-6-.319-.836-.764-1.62-1.314-2.333M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644C3.423 7.51 7.36 5 12 5c4.639 0 8.576 2.51 9.964 6.678.07.2.07.444 0 .644C20.577 16.49 16.64 19 12 19c-4.639 0-8.576-2.51-9.964-6.678z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button className="w-full px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-lg shadow hover:opacity-95 active:scale-[.99] transition disabled:opacity-60" disabled={loading}>
            {loading ? 'Checking...' : 'Sign in'}
          </button>

          {adminKey && (
            <button type="button" onClick={useSecret} className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg">Use secret link</button>
          )}
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">Protected area • Authorized personnel only</p>
      </div>
    </div>
  )
}
