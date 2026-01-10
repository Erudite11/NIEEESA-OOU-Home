import Link from 'next/link'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'

const semesters = ['Harmattan', 'Rain']

export default function Semesters(){
  const router = useRouter()
  const { level } = router.query

  const title = level ? `Level ${level} • Semesters` : 'Semesters'
  const desc = level ? `Choose a semester for Level ${level} to continue.` : 'Choose a semester to continue.'

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
      <h1 className="text-lg font-sans font-bold text-gray-700 mb-4"> {level} Level / Semester</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {semesters.map(s => (
          <Card key={s} className="reveal-card hover:shadow-md">
            <div className="flex flex-col justify-between h-full">
              <div>
                <h2 className="text-lg font-semibold">{s}</h2>
                <p className="text-sm text-gray-500">Click to view material types</p>
              </div>
              <div className="mt-4">
                <Link href={`/levels/${level}/semesters/${s}/types`}>
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
