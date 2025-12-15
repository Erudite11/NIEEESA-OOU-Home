import Link from 'next/link'
import { useRouter } from 'next/router'
import Card from 'components/ui/Card'
import Button from 'components/ui/Button'

const types = ['PDF Material','Past Question','Course Form']

export default function Types(){
  const router = useRouter()
  const { level, semester } = router.query

  return (
    <div>
      <h1 className="text-lg font-bold font-sans text-gray-700 mb-4"> {level} Level / {semester} / Material Type</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {types.map(t => (
          <Card key={t} className="hover:shadow-md">
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