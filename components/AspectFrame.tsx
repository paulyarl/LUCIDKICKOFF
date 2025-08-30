"use client"
import { useEffect, useMemo, useState } from "react"

export function AspectFrame() {
  const [dims, setDims] = useState({ w: 0, h: 0 })
  
  useEffect(() => {
    function onResize() { 
      setDims({ w: window.innerWidth, h: window.innerHeight }) 
    }
    
    onResize()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const isPortrait = dims.h >= dims.w
  const targetRatio = isPortrait ? (19.5 / 9) : (16 / 10)
  const currentRatio = dims.w && dims.h ? dims.w / dims.h : targetRatio
  const isSquareish = Math.abs(currentRatio - 1) < 0.08

  const style = useMemo(() => {
    if (!dims.w || !dims.h) return {}
    const containerW = dims.w
    const containerH = dims.h * 0.7
    const containerRatio = containerW / containerH
    let w = containerW, h = Math.round(containerW / targetRatio)
    if (containerRatio > targetRatio) {
      h = containerH
      w = Math.round(containerH * targetRatio)
    }
    return { width: w, height: h }
  }, [dims, targetRatio])

  return (
    <section aria-label="Device frame" className="w-full flex justify-center">
      <div className="relative bg-black/80 rounded-lg p-2">
        <div
          role="region"
          aria-label={isSquareish ? "Square screens are not supported" : "Aspect-correct frame"}
          className="bg-white dark:bg-zinc-900 rounded-md shadow-lg overflow-hidden"
          style={style}
        />
        {isSquareish && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            Square displays are not supported. Please rotate or resize your window.
          </p>
        )}
      </div>
    </section>
  )
}
