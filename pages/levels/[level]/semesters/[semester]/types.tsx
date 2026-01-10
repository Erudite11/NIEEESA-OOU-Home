import Link from 'next/link'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import Card from 'components/ui/Card'
import Button from 'components/ui/Button'

const types = ['PDF Material','Past Question','Course Form']

export default function Types(){
  const router = useRouter()
  const { level, semester } = router.query

  const title = level && semester ? `Level ${level} • ${semester} • Types` : 'Material Types'
  const desc = level && semester ? `Choose a material type for Level ${level} • ${semester}.` : 'Choose a material type.'

  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.reveal-card')) as HTMLElement[]

    // Reveal in-view on first load
    els.forEach((el) => {
      const rect = el.getBoundingClientRect()
      if (rect.top < window.innerHeight * 0.9) el.classList.add('is-visible')
    })

    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add('is-visible') })
      }, { root: null, rootMargin: '0px', threshold: 0.2 })
      els.forEach(el => obs.observe(el))
      return () => obs.disconnect()
    } else {
      els.forEach(el => el.classList.add('is-visible'))
    }
  }, [])

  return (
    <div>
      <Head>
        <title>{title} • NIEEESA Materials</title>
        <meta name="description" content={desc} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
      </Head>
      <h1 className="text-lg font-bold font-sans text-gray-700 mb-4"> {level} Level / {semester} / Material Type</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {types.map(t => (
          <Card key={t} className="reveal-card hover:shadow-md">
            <div className="flex flex-col justify-between h-full">
              <div>
                <h2 className="text-lg font-semibold">{t}</h2>
              </div>
              <div className="mt-4">
                <Link href={`/levels/${level}/semesters/${semester}/types/${encodeURIComponent(t)}/materials`}>
                  <Button>Open</Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}