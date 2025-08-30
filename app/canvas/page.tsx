"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DrawingCanvas } from '@/components/canvas/DrawingCanvas'

export default function CanvasPage() {
  // Fit canvas to viewport
  const [size, setSize] = useState({ w: 1200, h: 800 })
  const [brushColor, setBrushColor] = useState<string>("#ffffff")
  const [brushSize, setBrushSize] = useState<number>(4)
  const [showGrid, setShowGrid] = useState<boolean>(false)
  const [clearCmd, setClearCmd] = useState(0)
  const [undoCmd, setUndoCmd] = useState(0)
  const [redoCmd, setRedoCmd] = useState(0)
  const [initialLines, setInitialLines] = useState<any[]>([])
  const [initialTexts] = useState<any[]>([])
  const linesRef = useRef<any[]>([])
  const storageKey = useMemo(() => 'lucidcraft.canvas.v2', [])

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Load from localStorage once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed?.lines)) {
          setInitialLines(parsed.lines)
          linesRef.current = parsed.lines
        }
      }
    } catch {}
  }, [storageKey])

  const handleChangeV2 = useCallback((payload: { version: 2; lines: any[]; texts: any[] }) => {
    try {
      linesRef.current = payload.lines ?? []
      localStorage.setItem(storageKey, JSON.stringify({ lines: linesRef.current, texts: payload.texts ?? [] }))
    } catch {}
  }, [storageKey])

  const handleSave = useCallback((lines: any[], imageDataUrl: string) => {
    try {
      // Persist current lines explicitly and trigger a download of the PNG
      localStorage.setItem(storageKey, JSON.stringify({ lines, texts: [] }))
      const link = document.createElement('a')
      link.href = imageDataUrl
      link.download = `lucidcraft-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch {}
  }, [storageKey])

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col">
      <div className="flex items-center gap-3 p-3 border-b border-slate-700 bg-slate-800/80">
        <label className="text-sm text-slate-200">Color</label>
        <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} className="h-8 w-10 p-0 border-0 bg-transparent" />

        <label className="text-sm text-slate-200 ml-3">Size</label>
        <input
          type="range"
          min={1}
          max={32}
          step={1}
          value={brushSize}
          onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
          className="w-40"
        />
        <span className="text-xs text-slate-300 w-8">{brushSize}px</span>

        <label className="text-sm text-slate-200 ml-4 flex items-center gap-2">
          <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
          Grid
        </label>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setUndoCmd((v) => v + 1)} className="px-3 py-1.5 text-sm rounded border border-slate-600 text-slate-100 hover:bg-slate-700">Undo</button>
          <button onClick={() => setRedoCmd((v) => v + 1)} className="px-3 py-1.5 text-sm rounded border border-slate-600 text-slate-100 hover:bg-slate-700">Redo</button>
          <button onClick={() => setClearCmd((v) => v + 1)} className="px-3 py-1.5 text-sm rounded border border-red-500 text-red-200 hover:bg-red-600/20">Clear</button>
          <button onClick={() => {
            // Trigger save via keyboard handler provided by canvas, or call our onSave using data URL stored there
            // We directly rely on onSave callback from the component when user presses Ctrl+S; here we request an explicit save by creating our own image from canvas
            const ev = new KeyboardEvent('keydown', { key: 's', ctrlKey: true })
            window.dispatchEvent(ev)
          }} className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700">Save</button>
        </div>
      </div>

      <main className="relative flex-1">
        <DrawingCanvas
          width={size.w}
          height={size.h - 56}
          className="w-full h-full"
          showGrid={showGrid}
          brushColor={brushColor}
          brushSize={brushSize}
          clearCommand={clearCmd}
          undoCommand={undoCmd}
          redoCommand={redoCmd}
          initialLines={initialLines}
          initialTexts={initialTexts}
          onChangeV2={handleChangeV2}
          onSave={handleSave}
        />
      </main>
    </div>
  )
}
