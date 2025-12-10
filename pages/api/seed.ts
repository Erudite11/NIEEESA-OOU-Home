import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try{
    const samples = [
      { title: 'Intro to Engineering', level: '100', semester: 'Harmattan', fileType: 'PDF Material', url: 'https://example.com/sample1.pdf' },
      { title: 'Mechanics Past Questions', level: '200', semester: 'Rain', fileType: 'Past Question', url: 'https://example.com/sample2.pdf' },
      { title: 'Thermodynamics Course Form', level: '300', semester: 'Harmattan', fileType: 'Course Form', url: 'https://example.com/sample3.pdf' },
      { title: 'Circuits Notes', level: '400', semester: 'Rain', fileType: 'PDF Material', url: 'https://example.com/sample4.pdf' },
      { title: 'Signals Past Questions', level: '500', semester: 'Harmattan', fileType: 'Past Question', url: 'https://example.com/sample5.pdf' },
      { title: 'Lab Course Form', level: '100', semester: 'Rain', fileType: 'Course Form', url: 'https://example.com/sample6.pdf' },
    ]

    const created = []
    for(const s of samples){
      const m = await prisma.material.create({ data: s })
      created.push(m)
    }

    res.json({ success: true, created })
  }catch(err:any){
    console.error(err)
    res.status(500).json({ error: err.message || 'server error' })
  }
}
