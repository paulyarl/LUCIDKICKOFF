"use client"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8">
      <h1 className="text-4xl font-bold">LucidCraft</h1>
      <p className="mt-4 text-lg">Welcome to LucidCraft - Testing Basic Render</p>
      <a
        href="/canvas"
        className="mt-8 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Start Drawing
      </a>
    </main>
  )
}
