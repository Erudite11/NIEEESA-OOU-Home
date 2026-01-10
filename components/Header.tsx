import Link from 'next/link'
import Image from 'next/image';

import { useRouter } from 'next/router'

export default function Header() {
  const router = useRouter()
  const isHome = router.pathname === '/'
  return (
    <header className="bg-blue-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-2 py-2 flex items-center justify-between ">
        <div className="flex items-center gap-3">
          <div className=" flex font-bold"></div>
          {isHome ? (
            <>
              <Image src="/assets/oou.jpg" alt="OOU" width={40} height={40} />
              <Image src="/assets/nieesa.jpg" alt="NIEEESA" width={40} height={40} />
              <p className='text-lg font-bold'>OOU-NIEEESA</p>
            </>
          ) : (
            <>
              <Image src="/assets/nieesa.jpg" alt="NIEEESA" width={40} height={40} />
              <p className='text-lg font-bold'>NIEEESA</p>
            </>
          )}
        </div>

        <nav className="flex items-center gap-6 ">
          <Link
            href="#level"
            className="inline-flex items-center justify-center text-gray-700 transition-all duration-300 transform-gpu hover:text-gray-900 hover:scale-110 hover:rotate-6 active:scale-95">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
              />
            </svg>
          </Link>
          <Link href="/" className="inline-flex items-center justify-center text-gray-700 transition-all duration-300 transform-gpu hover:text-gray-900 hover:scale-110 hover:rotate-6 active:scale-95">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
              />
            </svg>
          </Link>
        </nav>
      </div>
      {isHome && (
        <div className="marquee-wrapper  bg-gradient-to-r from-fuchsia-200 to-cyan-50">
          <div className="marquee-track">
            <span className="marquee-item text-gradient text-lg font-semibold">
              Welcome NIEEESA&apos;ites! Access essential Electrical and Electronics Engineering resources quickly and easily. National Institute of Electrical and Electronics Engineering Student Association, OOU Chapter. Select your level to begin.
            </span>
            <span className="marquee-item text-gradient text-lg font-semibold">
              Welcome NIEEESA&apos;ites! Access essential Electrical and Electronics Engineering resources quickly and easily. National Institute of Electrical and Electronics Engineering Student Association, OOU Chapter. Select your level to begin.
            </span>
          </div>
       </div>
      )}
    </header>
  )
}
