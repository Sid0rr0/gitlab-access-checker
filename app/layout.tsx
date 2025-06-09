import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'GitLab Access Checker',
  description: 'List all members of a GitLab group, subgroups and projects with their access levels',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav className="flex items-center justify-center gap-4 p-4">
          <Link className="underline" href="/">Home</Link>
          <Link className="underline" href="/settings">Settings</Link>
        </nav>
        {children}
      </body>
    </html>
  )
}
