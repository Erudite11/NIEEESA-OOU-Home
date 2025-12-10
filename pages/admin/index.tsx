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
  const [cloudinaryConfigured, setCloudinaryConfigured] = useState(false)
  const [supabaseConfigured, setSupabaseConfigured] = useState(false)
  const [lastStorage, setLastStorage] = useState<string | null>(null)

  const LARGE_FILE_THRESHOLD = 10 * 1024 * 1024
  const [forceSupabase, setForceSupabase] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [statusKind, setStatusKind] = useState<'info' | 'success' | 'error'>('info')
  const [progress, setProgress] = useState<number | null>(null)

  useEffect(() => {
    setCloudinaryConfigured(!!process.env.NEXT_PUBLIC_CLOUDINARY)
    setSupabaseConfigured(!!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
    fetchMaterials()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function showStatus(msg: string | null, kind: 'info' | 'success' | 'error' = 'info') {
    setStatusMessage(msg)
    setStatusKind(kind)
  }

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null
    setFile(f)
  }

  async function fetchMaterials() {
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
        // fallthrough — we'll show the raw body text below
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
    setProgress(null)
    setStatusMessage(null)

    try {
      const preferSupabase = (forceSupabase && supabaseConfigured) || (supabaseConfigured && file.size > LARGE_FILE_THRESHOLD)
      if (preferSupabase) {
        const uploadJson: any = await uploadViaServerSupabase(file)
        setLoading(false)
        // If server already created the DB record, uploadJson.id will be present and we can skip calling /api/admin/create
        if (uploadJson && uploadJson.id) {
          setLastStorage('supabase')
          showStatus('Uploaded to Supabase', 'success')
          setTitle('')
          setFile(null)
          fetchMaterials()
          return
        }

        // Otherwise, the server uploaded the object but didn't create a DB row; create it now
        const publicUrl = uploadJson.url as string
        const createRes = await fetch('/api/admin/create', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: title || 'Untitled', level, semester, fileType, url: publicUrl, storage: 'supabase', originalName: file.name }) })
        const createJson = await createRes.json()
        if (createJson.success) {
          setLastStorage('supabase')
          showStatus('Uploaded to Supabase', 'success')
          setTitle('')
          setFile(null)
          fetchMaterials()
        } else throw new Error(createJson.error || 'create failed')
        return
      }

      // server-side upload
      const form = new FormData()
      form.append('title', title)
      form.append('level', level)
      form.append('semester', semester)
      form.append('fileType', fileType)
      form.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
      const json = await res.json()

      if (json && json.fallback === 'supabase' && supabaseConfigured) {
        try {
          const publicUrl = await uploadViaServerSupabase(file)
          const createRes = await fetch('/api/admin/create', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: title || 'Untitled', level, semester, fileType, url: publicUrl, storage: 'supabase', originalName: file.name }) })
          const createJson = await createRes.json()
          setLoading(false)
          if (createJson.success) {
            setLastStorage('supabase')
            showStatus('Uploaded to Supabase', 'success')
            setTitle('')
            setFile(null)
            fetchMaterials()
            return
          } else throw new Error(createJson.error || 'create failed')
        } catch (err: any) {
          setLoading(false)
          showStatus('Automatic Supabase retry failed: ' + (err.message || String(err)), 'error')
          setProgress(null)
          return
        }
      }

      setLoading(false)
      if (json && json.ok) {
        setLastStorage(json.storage || null)
        showStatus('Uploaded', 'success')
        setTitle('')
        setFile(null)
        setProgress(null)
        fetchMaterials()
      } else {
        setStatusKind('error')
        setStatusMessage(json && json.error ? (json.error + (json.fallback ? ' (fallback: ' + json.fallback + ')' : '')) : 'Upload failed')
        setProgress(null)
      }
    } catch (err: any) {
      setLoading(false)
      console.error(err)
      showStatus('Upload failed: ' + (err.message || String(err)), 'error')
      setProgress(null)
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
        {cloudinaryConfigured ? (
          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Cloudinary env present</span>
        ) : (
          <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">Cloudinary not configured — using local uploads</span>
        )}
        {lastStorage && <span className="ml-3 text-xs text-gray-500">Last upload: {lastStorage}</span>}
      </div>

      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      <form onSubmit={handleUpload} className="p-6 bg-white rounded shadow space-y-4">
        {statusMessage && (
          <div className={`p-3 rounded text-sm ${statusKind === 'error' ? 'bg-red-50 text-red-800' : statusKind === 'success' ? 'bg-green-50 text-green-800' : 'bg-blue-50 text-blue-800'}`}>
            {statusMessage}
            {progress !== null && <div className="mt-2 text-xs">Progress: {progress}%</div>}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full border rounded p-2" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <select value={level} onChange={(e) => setLevel(e.target.value)} className="p-2 border rounded">
            {levels.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <select value={semester} onChange={(e) => setSemester(e.target.value)} className="p-2 border rounded">
            {semesters.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select value={fileType} onChange={(e) => setFileType(e.target.value)} className="p-2 border rounded">
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">File</label>
          <input type="file" onChange={handleFile} className="mt-1" />
          {supabaseConfigured && (
            <div className="mt-2 text-sm">
              <label className="inline-flex items-center">
                <input type="checkbox" checked={forceSupabase} onChange={(e) => setForceSupabase(e.target.checked)} className="mr-2" />
                <span className="text-xs">Force Supabase upload (use direct upload even for small files)</span>
              </label>
            </div>
          )}
        </div>

        <div>
          <button className="px-4 py-2 bg-green-600 text-white rounded" disabled={loading}>
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </form>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Materials</h2>
        <div className="mb-4">
          <button onClick={fetchMaterials} className="px-3 py-1 bg-blue-600 text-white rounded">
            Refresh
          </button>
        </div>
        <div className="space-y-2">
          {materials.map((m) => (
            <div key={m.id} className="p-3 bg-white rounded flex justify-between items-center">
              <div>
                <div className="font-semibold">{m.title}</div>
                <div className="text-xs text-gray-500">{m.fileType} • {new Date(m.createdAt).toLocaleString()}</div>
              </div>
              <div className="space-x-2">
                <a href={`/api/materials/download?id=${m.id}`} target="_blank" rel="noreferrer" className="px-2 py-1 bg-blue-600 text-white rounded">
                  Open
                </a>
                <button onClick={() => handleDelete(m.id)} className="px-2 py-1 bg-red-500 text-white rounded">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
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

