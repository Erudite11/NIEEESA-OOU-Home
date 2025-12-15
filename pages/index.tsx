import Link from 'next/link'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

const levels = ['100','200','300','400','500']

export default function Home(){
  return (
    
    <div className="bg-gradient-to-b from-blue-50 to-white -mt-4">   
      <div className="max-w-6xl mx-auto px-4 py-10">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold"> <span className='text-red-500'>NIEEESA</span> Academic Resource Center</h1>
          <p className="text-gray-600 mt-3 text-lg">Your central access point for departmental PDFs, past questions, and course forms.</p>
        </header>

        <section>
          <h2 className="text-2xl font-bold mb-4" id='level'>Select Level</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {levels.map(level => (
              <Card key={level} className="hover:shadow-lg hover:-translate-y-1 transform transition rounded-xl bg-gradient-to-t from-fuchsia-200 to-cyan-50 ">
                <div className="flex flex-col justify-between h-full">
                  <div>
                    <div className="text-3xl">🎓</div>
                    <h3 className="text-xl font-bold mt-2"> {level} Level</h3>
                    <p className="text-sm text-gray-500 mt-1">Access Harmattan and Rain semester materials</p>
                  </div>
                  <div className="mt-4">
                    <Link href={`/levels/${level}/semesters`}>
                      <Button>Open</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>

      <footer className="mt-8 bg-transparent">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-gray-600">
          © 2025 Oshiyoku Olaoluwa p.k.a Erudite. Designed to support academic excellence. <br  />K Â B Ô D&apos; 26
        </div>
      </footer>
    </div>
  )
}