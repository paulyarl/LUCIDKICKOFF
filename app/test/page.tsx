 "use client"

import { DrawingCanvas } from "@/components/DrawingCanvas"

export default function TestPage() {
  const guide = [
    { x: 80, y: 180 },
    { x: 160, y: 120 },
    { x: 240, y: 160 },
    { x: 320, y: 100 },
    { x: 400, y: 140 },
    { x: 480, y: 120 },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Canvas Engine Demo</h1>
        <p className="text-sm text-gray-600 mb-6">Draw over the gray guide line, then click Evaluate.</p>

        <div className="bg-white p-4 rounded-lg shadow border">
          <DrawingCanvas width={600} height={360} guide={guide} />
        </div>
      </div>
    </div>
  );
}
