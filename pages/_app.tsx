import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import Layout from '../components/Layout'

import { useRouter } from 'next/router'

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  return (
    <>
      <Head>
        <title>NIEEESA Materials Portal</title>
        <meta name="description" content="Find, upload and download NIEEESA course materials, past questions and forms by level and semester." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="OOU NIEEESA Materials Portal" />
        <meta property="og:description" content="Find, upload and download NIEEESA course materials, past questions and forms." />
        <meta property="og:image" content="/assets/nieesa.jpg" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="icon" href="/assets/nieesa.jpg" />
      </Head>
      <Layout>
        <div key={router.asPath} className="page-fade">
          <Component {...pageProps} />
        </div>
      </Layout>
    </>
  )
}
