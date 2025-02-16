import {useLayoutEffect, useState} from 'react'
import rough from 'roughjs/bundled/rough.esm.js'

const generator = rough.generator()

function createElement(x1, y1, x2, y2) {
  const roughElement = generator.line(x1, y1, x2, y2)
  return { x1, y1, x2, y2, roughElement}
}
function App() {

  const [elements, setElements] = useState([])
  const [drawing, setDrawing] = useState(false)

  useLayoutEffect(() => {
    const canvas = document.getElementById('canvas')
    const context = canvas.getContext('2d')
    context.clearRect(0, 0, canvas.width, canvas.height)

    const roughCanvas = rough.canvas(canvas)
    const rect = generator.rectangle(10, 10, 100, 100)
    roughCanvas.draw(rect)
  }, []);

  const handleMouseDown = (event) => {
    setDrawing(true)
    
    const { clientX, clientY } = event
    const element = createElement(clientX, clientY, clientX, clientY)
    setElements((prevState) => [...prevState, element])
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
