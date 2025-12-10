const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main(){
  const samples = [
    { title: 'Intro to Engineering', level: '100', semester: 'Harmattan', fileType: 'PDF Material', url: 'https://example.com/sample1.pdf' },
    { title: 'Mechanics Past Questions', level: '200', semester: 'Rain', fileType: 'Past Question', url: 'https://example.com/sample2.pdf' },
    { title: 'Thermodynamics Course Form', level: '300', semester: 'Harmattan', fileType: 'Course Form', url: 'https://example.com/sample3.pdf' },
    { title: 'Circuits Notes', level: '400', semester: 'Rain', fileType: 'PDF Material', url: 'https://example.com/sample4.pdf' },
    { title: 'Signals Past Questions', level: '500', semester: 'Harmattan', fileType: 'Past Question', url: 'https://example.com/sample5.pdf' },
    { title: 'Lab Course Form', level: '100', semester: 'Rain', fileType: 'Course Form', url: 'https://example.com/sample6.pdf' },
  ]

  for(const s of samples){
    await prisma.material.create({ data: s })
    console.log('created', s.title)
  }
}

main()
  .then(()=>{ console.log('done'); process.exit(0) })
  .catch(e=>{ console.error(e); process.exit(1) })
