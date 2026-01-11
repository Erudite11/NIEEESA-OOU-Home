import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState, ChangeEvent } from 'react'
import Card from 'components/ui/Card'
import Button from 'components/ui/Button'
import Input from 'components/ui/Input'

type Material = {
  id: number
  title: string
  url: string
  fileType: string
  createdAt: string
}

export default function Materials(){
  const router = useRouter()
  const { level, semester, type } = router.query
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const perPage = 5

  useEffect(()=>{
    if(!level || !semester || !type) return
    const fetcher = async ()=>{
      setLoading(true)
      const res = await fetch(`/api/materials?level=${level}&semester=${semester}&fileType=${encodeURIComponent(type as string)}`)
      const json = await res.json()
      if (Array.isArray(json)) {
        setMaterials(json)
      } else {
        console.warn('/api/materials returned non-array:', json)
        setMaterials([])
      }
      setLoading(false)
    }
    fetcher()
  },[level,semester,type])

  const filtered = materials.filter(m => m.title.toLowerCase().includes(search.toLowerCase()))
  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total / perPage))
  const start = (page - 1) * perPage
  const visible = filtered.slice(start, start + perPage)

  const handleDownload = async (id: number) => {
    setDownloadingId(id)
    // The actual download is handled by the browser via the href
    // We'll reset the loading state after a short delay
    setTimeout(() => {
      setDownloadingId(null)
    }, 2000)
  }

  const title = level && semester && type ? `Level ${level} • ${semester} • ${type}` : 'Materials'
  const desc = level && semester && type ? `Browse ${type} for Level ${level} • ${semester}.` : 'Browse materials.'

  return (
    <div>
      <Head>
        <title>{title} • NIEEESA Materials</title>
        <meta name="description" content={desc} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
      </Head>
      <h1 className="text-2xl font-bold mb-4">Materials</h1>
      <div className="flex items-center gap-4 mb-4">
  <Input placeholder="Search by title..." value={search} onChange={(e: ChangeEvent<HTMLInputElement>)=>{ setSearch(e.target.value); setPage(1) }} />
      </div>
      {loading && <p>Loading...</p>}
      {!loading && visible.length === 0 && <p>No materials found.</p>}
      <div className="space-y-4 mt-4">
        {visible.map(m => (
          <Card key={m.id} className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{m.title}</h3>
              <p className="text-sm text-gray-500">{m.fileType} • {new Date(m.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <a href={`/api/materials/download?id=${m.id}`} rel="noreferrer" onClick={() => handleDownload(m.id)}>
                <Button className="flex items-center gap-2" disabled={downloadingId === m.id}>
                  {downloadingId === m.id && (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {downloadingId === m.id ? 'Downloading...' : 'Download'}
                </Button>
              </a>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-600">Showing {Math.min(total, start+1)}-{Math.min(total, start+perPage)} of {total}</div>
        <div className="flex items-center gap-2">
          <Button onClick={()=>setPage(p=>Math.max(1,p-1))} className="px-2 py-1" disabled={page===1}>Prev</Button>
          <div className="text-sm">{page} / {pages}</div>
          <Button onClick={()=>setPage(p=>Math.min(pages,p+1))} className="px-2 py-1" disabled={page===pages}>Next</Button>
        </div>
      </div>
    </div>
  )
}
