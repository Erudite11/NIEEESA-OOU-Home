import { useState } from 'react'
import { useRouter } from 'next/router'

export default function AdminLogin(){
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const adminKey = router.query?.admin_key as string | undefined

  async function submit(e:any){
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/admin/login', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ password }) })
    const json = await res.json()
    setLoading(false)
    if(json.success) router.push('/admin')
    else alert('Invalid password')
  }

  function useSecret(){
    if(adminKey){
      // set cookie and go to admin
      document.cookie = `nieeesa_admin=1; Path=/; Max-Age=${60*60}`
      router.push('/admin')
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow">
      <h1 className="text-xl font-bold mb-4">Admin Login</h1>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm">Password</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 block w-full border rounded p-2" />
        </div>
        <div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>{loading ? 'Checking...':'Log in'}</button>
        </div>
        {adminKey && (
          <div>
            <button type="button" onClick={useSecret} className="px-4 py-2 bg-green-600 text-white rounded">Use secret link</button>
          </div>
        )}
      </form>
    </div>
  )
}
