import {useLayoutEffect, useState} from 'react'
import rough from 'roughjs/bundled/rough.esm.js'

const generator = rough.generator()

function App() {

  const [elements, setElements] = useState([])
  const [drawing, setDrawing] = useState(false)

  useLayoutEffect(() => {
    const canvas = document.getElementById('canvas')
    const ctx = canvas.getContext('2d')

    const roughCanvas = rough.canvas(canvas)
    const rect = generator.rectangle(10, 10, 100, 100)
    roughCanvas.draw(rect)
  }, []);

  const handleMouseDown = (event) => {
    setDrawing(true)
  }
  
  const handleMouseMove = (event) => {
    if (!drawing) return
    
    const { clientX, clientY } = event
    console.log(clientX, clientY)
  } 
  
  const handleMouseUp = () => {
    setDrawing(false)
  }
  return (
    <canvas
      id='canvas'
      width={window.innerWidth}
      height={window.innerHeight}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      canvas
    </canvas>
  )
}

export default App
