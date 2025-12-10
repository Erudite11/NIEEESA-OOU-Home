import Link from 'next/link'
import { useRouter } from 'next/router'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'

const semesters = ['Harmattan', 'Rain']

export default function Semesters(){
  const router = useRouter()
  const { level } = router.query

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4"> {level} Level / Select Semester</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {semesters.map(s => (
          <Card key={s} className="hover:shadow-md">
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
