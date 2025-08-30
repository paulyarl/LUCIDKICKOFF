// Simple layout for testing purposes
import './globals.css';
import { Open_Sans } from 'next/font/google';

export default function TestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white">
        <main className="p-8">
          {children}
        </main>
      </body>
    </html>
  )
}
