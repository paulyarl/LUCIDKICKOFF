"use client"
import { Stage, Layer, Rect } from "react-konva"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export function KonvaStage() {
  const [color, setColor] = useState("#4f46e5")
  return (
    <div>
      <div className="flex gap-2">
        <Button 
          size="lg" 
          className="h-11 min-h-11" 
          onClick={() => setColor("#4f46e5")}
        >
          Indigo
        </Button>
        <Button 
          size="lg" 
          className="h-11 min-h-11" 
          onClick={() => setColor("#16a34a")}
        >
          Green
        </Button>
      </div>
      <div className="mt-3 border rounded-md overflow-hidden">
        <Stage width={600} height={360} aria-label="Drawing canvas">
          <Layer>
            <Rect x={40} y={40} width={200} height={100} fill={color} cornerRadius={8} />
          </Layer>
        </Stage>
      </div>
    </div>
  )
}
