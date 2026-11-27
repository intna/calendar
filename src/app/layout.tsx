import type { Metadata, Viewport } from 'next'
import { Manrope, Oswald } from 'next/font/google'
import './globals.css'

const sans = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

const display = Oswald({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '收益日历',
  description: 'Polymarket 每日收益、充值与提现',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: '#FFFFFF',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={`${sans.variable} ${display.variable} font-sans antialiased`}>{children}</body>
    </html>
  )
}
