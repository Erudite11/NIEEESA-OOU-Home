import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/assets/nieesa.jpg" />
        <link rel="apple-touch-icon" href="/assets/nieesa.jpg" />
        <meta name="theme-color" content="#0ea5e9" />
      </Head>
      <body className="bg-sky-50">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
