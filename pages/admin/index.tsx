import React, { useState, ChangeEvent, useEffect } from 'react'
import { isAdminAuthed } from '../../lib/auth'

const levels = ['100', '200', '300', '400', '500']
const semesters = ['Harmattan', 'Rain']
const types = ['PDF Material', 'Past Question', 'Course Form']

export default function Admin(): JSX.Element {
  const [title, setTitle] = useState('')
  const [level, setLevel] = useState(levels[0])
  const [semester, setSemester] = useState(semesters[0])
  const [fileType, setFileType] = useState(types[0])
  const [file, setFile] = useState<File | null>(null)
  const [materials, setMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [supabaseConfigured, setSupabaseConfigured] = useState(false)
  const [lastStorage, setLastStorage] = useState<string | null>(null)

  const LARGE_FILE_THRESHOLD = 10 * 1024 * 1024
  const forceSupabase = true // Always use Supabase
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [statusKind, setStatusKind] = useState<'info' | 'success' | 'error'>('info')
  const [progress, setProgress] = useState<number | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  // Admin filters and UI state
  const [adminSearch, setAdminSearch] = useState('')
  const [filterTypeAdmin, setFilterTypeAdmin] = useState<'All' | string>('All')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setSupabaseConfigured(!!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
    fetchMaterials()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function showStatus(msg: string | null, kind: 'info' | 'success' | 'error' = 'info') {
    setStatusMessage(msg)
    setStatusKind(kind)
    
    // Auto-dismiss after 5 seconds (except for info messages during upload)
    if (msg && kind !== 'info') {
      setTimeout(() => {
        setStatusMessage(null)
      }, 5000)
    }
  }

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null
    setFile(f)
  }

  async function fetchMaterials() {
    setRefreshing(true)
    try {
      const res = await fetch('/api/admin/list')
      const json = await res.json()
      // The /api/materials endpoint expects query params for level/semester/fileType.
      // Ensure we only set materials when the response is an array.
      if (Array.isArray(json)) {
        setMaterials(json)
      } else {
        // Not an array (probably an error object) — clear the list and surface a hint.
        console.warn('/api/admin/list returned non-array:', json)
        setMaterials([])
        if (json && json.error) showStatus('Could not load materials: ' + json.error, 'error')
      }
    } catch (e) {
      setMaterials([])
    } finally {
      setRefreshing(false)
    }
  }

  async function uploadToSupabaseDirect(file: File) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    // Allow configuring the bucket via env; default to 'materials'
    const bucket = (process.env.NEXT_PUBLIC_SUPABASE_BUCKET as string) || 'materials'

  // Use the original filename (sanitized) as object path — no timestamp prefix
  const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9._-]/g, '-')
  const objectPath = sanitize(file.name)
    const uploadUrl = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/${bucket}/${encodeURIComponent(objectPath)}`
    const publicUrl = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${bucket}/${encodeURIComponent(objectPath)}`

    // Ensure the target bucket exists (server will create it if needed). This requires
    // the SUPABASE_SERVICE_ROLE_KEY on the server so the server endpoint can create buckets.
    try {
      const ensureRes = await fetch('/api/admin/ensure-bucket', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ bucket }) })
      if (!ensureRes.ok) {
        const txt = await ensureRes.text()
        throw new Error('Failed to ensure Supabase bucket: ' + txt)
      }
    } catch (e:any) {
      throw new Error('Failed to ensure Supabase bucket: ' + (e.message || String(e)))
    }

    const uploadRes = await new Promise<Response>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', uploadUrl)
      xhr.setRequestHeader('Authorization', `Bearer ${supabaseAnon}`)
      // Content-Type should be the file's mimetype
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100))
      }
      xhr.onload = () => resolve(new Response(xhr.response, { status: xhr.status }))
      xhr.onerror = () => reject(new Error('Network error'))
      xhr.send(file)
    })

    if (!uploadRes.ok) {
      // Try to parse JSON error body; Supabase returns helpful JSON (e.g. { statusCode: '404', error: 'Bucket not found' })
      let bodyText = ''
      try {
        bodyText = await uploadRes.text()
        const parsed = JSON.parse(bodyText)
        // If bucket not found, surface a clear message for the developer/admin
        if (parsed && (parsed.error === 'Bucket not found' || parsed.message === 'Bucket not found')) {
          throw new Error(`Supabase upload failed: Bucket not found. Create the bucket named '${bucket}' in your Supabase project (Storage → Buckets) or set NEXT_PUBLIC_SUPABASE_BUCKET to an existing bucket.`)
        }
      } catch (e) {

      }
      throw new Error('Supabase upload failed: ' + (bodyText || uploadRes.statusText || uploadRes.status))
    }

    return publicUrl
  }

  async function uploadViaServerSupabase(file: File) {
    // POST multipart to server endpoint which will upload using service role key
    const form = new FormData()
    form.append('title', title)
    form.append('level', level)
    form.append('semester', semester)
    form.append('fileType', fileType)
    form.append('file', file)

    const res = await fetch('/api/admin/upload-supabase', { method: 'POST', body: form })
    const json = await res.json()
    if (!res.ok) throw new Error((json && (json.error || json.detail)) ? JSON.stringify(json) : 'Server upload failed')
    if (!json || !json.url) throw new Error('Invalid upload response')
    // Return full json so caller can detect if the server already created the DB record (json.id)
    return json
  }

 async function handleUpload(e: any) {
  e.preventDefault()
  if (!file) {
    showStatus('Please choose a file', 'error')
    return
  }

  setLoading(true)
  setStatusMessage(null)
  setProgress(null)

  try {
    let fileUrl: string

    // Determine which upload method to use
    if (supabaseConfigured && (forceSupabase || file.size >= LARGE_FILE_THRESHOLD)) {
      // Use Supabase for large files or when forced
      showStatus('Uploading to Supabase...', 'info')
      setLastStorage('Supabase')
      
      if (file.size >= LARGE_FILE_THRESHOLD) {
        // Large file: use server-side upload with service role key
        const serverResult = await uploadViaServerSupabase(file)
        // If server already created the DB record, we're done
        if (serverResult.id) {
          showStatus('Uploaded successfully to Supabase', 'success')
          setFile(null)
          setTitle('')
          fetchMaterials()
          return
        }
        fileUrl = serverResult.url
      } else {
        // Small file: direct upload from browser
        fileUrl = await uploadToSupabaseDirect(file)
      }
    } else if (false) {
      // Use Cloudinary if configured and Supabase not preferred
      // Cloudinary upload path removed in production cleanup
      throw new Error('Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
    } else {
      throw new Error('No storage provider configured. Please set up Supabase or Cloudinary in .env.local')
    }

    // Save metadata to DB
    showStatus('Saving to database...', 'info')
    const saveRes = await fetch('/api/admin/create', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: title || 'Untitled',
        level,
        semester,
        fileType,
        url: fileUrl,
        publicId: null,
        originalName: file.name,
      }),
    })

    const saveJson = await saveRes.json()
    if (!saveJson.success) throw new Error('DB save failed')

    showStatus('Uploaded successfully!', 'success')
    
    // Clear form completely
    setFile(null)
    setTitle('')
    setProgress(null)
    setLevel(levels[0])
    setSemester(semesters[0])
    setFileType(types[0])
    
    // Clear file input by resetting the form
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    if (fileInput) fileInput.value = ''
    
    fetchMaterials()
  } catch (err: any) {
    console.error(err)
    showStatus(err.message || 'Upload failed', 'error')
  } finally {
    setLoading(false)
  }
}

  async function handleDelete(id: number) {
    if (!confirm('Delete this material?')) return
    const res = await fetch('/api/admin/delete', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }) })
    const json = await res.json()
    if (json.success) {
      showStatus('Deleted', 'success')
      fetchMaterials()
    } else {
      showStatus('Delete failed: ' + (json.error || 'unknown'), 'error')
    }
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <span className="text-sm text-gray-600">Storage:</span>
        {supabaseConfigured ? (
          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Supabase</span>
        ) : (
          <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">Supabase not configured</span>
        )}
        {lastStorage && <span className="ml-3 text-xs text-gray-500">Last upload: {lastStorage}</span>}
      </div>

      <h1 className="text-2xl font-bold mb-4  text-cyan-600">Admin Dashboard</h1>

      <form onSubmit={handleUpload} className="p-6 bg-sky-100 rounded shadow space-y-4">
        {statusMessage && (
          <div className={`p-3 rounded text-sm ${statusKind === 'error' ? 'bg-red-50 text-red-800' : statusKind === 'success' ? 'bg-green-50 text-green-800' : 'bg-blue-50 text-blue-800'}`}>
            {statusMessage}
            {progress !== null && <div className="mt-2 text-xs">Progress: {progress}%</div>}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 bg-blue-50 block w-full border rounded p-2" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <select value={level} onChange={(e) => setLevel(e.target.value)} className="p-2 bg-blue-50 border rounded">
            {levels.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <select value={semester} onChange={(e) => setSemester(e.target.value)} className="p-2 bg-blue-50 border rounded">
            {semesters.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select value={fileType} onChange={(e) => setFileType(e.target.value)} className="p-2 bg-blue-50 border rounded">
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">File</label>
          <input type="file" onChange={handleFile} className="mt-1 bg-blue-50" />
        </div>

        <div>
          <button className="px-4 py-2  bg-gradient-to-l from-fuchsia-400 to-green-400 text-white rounded" disabled={loading}>
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </form>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Materials <span className="text-sm text-gray-500">({materials.length})</span></h2>
        <div className="mb-4 flex flex-col gap-3">
          <div>
            <button onClick={fetchMaterials} disabled={refreshing} className="px-3 py-1 bg-cyan-600 text-white rounded flex items-center gap-2">
              {refreshing && (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              value={adminSearch}
              onChange={(e) => setAdminSearch(e.target.value)}
              placeholder="Search by title..."
              className="px-3 py-2 border rounded bg-white"
            />
            <select value={filterTypeAdmin} onChange={(e) => setFilterTypeAdmin(e.target.value)} className="px-3 py-2 border rounded bg-white">
              <option value="All">All Types</option>
              {types.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <div className="text-sm text-gray-500 flex items-center">Tip: Click a group header to collapse/expand</div>
          </div>
        </div>

        {(() => {
          // Group by Level and Semester, keeping a nice order
          const levelOrder = new Map(levels.map((l, i) => [l, i]))
          const semOrder = new Map(semesters.map((s, i) => [s, i]))

          const groups: { level: string; semester: string; items: any[] }[] = []
          for (const l of levels) {
            for (const s of semesters) {
              const items = materials
                .filter((m) => m.level === l && m.semester === s)
                // Apply admin filters
                .filter((m) => (filterTypeAdmin === 'All' ? true : m.fileType === filterTypeAdmin))
                .filter((m) => (adminSearch.trim() ? m.title.toLowerCase().includes(adminSearch.toLowerCase()) : true))
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              if (items.length) groups.push({ level: l, semester: s, items })
            }
          }

          if (groups.length === 0) {
            return <div className="text-sm text-gray-500">No materials yet.</div>
          }

          return (
            <div className="space-y-6">
              {groups.map((g) => (
                <div key={`${g.level}-${g.semester}`} className="border border-gray-100 rounded overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setCollapsed((prev) => ({ ...prev, [`${g.level}-${g.semester}`]: !prev[`${g.level}-${g.semester}`] }))}
                    className="w-full text-left px-3 py-2 bg-gray-50 border-b text-sm font-semibold flex items-center justify-between hover:bg-gray-100"
                  >
                    <div>
                      Level {g.level} • {g.semester}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-gray-500">{g.items.length} item{g.items.length === 1 ? '' : 's'}</div>
                      <svg className={`h-4 w-4 transition-transform ${collapsed[`${g.level}-${g.semester}`] ? '-rotate-90' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.27a.75.75 0 01-.02-1.06z" clipRule="evenodd" /></svg>
                    </div>
                  </button>
                  {!collapsed[`${g.level}-${g.semester}`] && (
                    <div className="divide-y">
                      {g.items.map((m) => (
                        <div key={m.id} className="p-3 bg-blue-50 flex justify-between items-center">
                          <div>
                            <div className="font-semibold">{m.title}</div>
                            <div className="text-xs text-gray-500">{m.fileType} • {new Date(m.createdAt).toLocaleString()}</div>
                          </div>
                          <div className="flex space-x-2">
                            <a href={`/api/materials/download?id=${m.id}`} target="_blank" rel="noreferrer" className="px-2 py-1 bg-emerald-600 text-white rounded">
                              Open
                            </a>
                            <button onClick={() => handleDelete(m.id)} className="px-2 py-1 bg-fuchsia-700 text-white rounded">
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        })()}

      </div>
    </div>
  )
}

export async function getServerSideProps(ctx: any) {
  // Server-side protect the admin page so it isn't visible without login.
  if (!isAdminAuthed(ctx.req)) {
    return {
      redirect: {
        destination: '/admin/login',
        permanent: false,
      },
    }
  }

  return { props: {} }
}