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
  const perPage = 5

  useEffect(()=>{
    if(!level || !semester || !type) return
    const fetcher = async ()=>{
      setLoading(true)
      const res = await fetch(`/api/materials?level=${level}&semester=${semester}&fileType=${encodeURIComponent(type as string)}`)
      const json = await res.json()
      setMaterials(json)
      setLoading(false)
    }
    fetcher()
  },[level,semester,type])

  const filtered = materials.filter(m => m.title.toLowerCase().includes(search.toLowerCase()))
  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total / perPage))
  const start = (page - 1) * perPage
  const visible = filtered.slice(start, start + perPage)

  return (
    <div>
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
              <a href={m.url} target="_blank" rel="noreferrer"><Button>Download</Button></a>
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
