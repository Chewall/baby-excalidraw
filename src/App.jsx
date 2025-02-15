import {useLayoutEffect, useState} from 'react'
import rough from 'roughjs/bundled/rough.esm.js'

const generator = rough.generator()

function App() {

  useLayoutEffect(() => {
    const canvas = document.getElementById('canvas')
    const ctx = canvas.getContext('2d')

    const roughCanvas = rough.canvas(canvas)
    const rect = generator.rectangle(10, 10, 100, 100)
    roughCanvas.draw(rect)
  }, []);

  return (
    <canvas
      id='canvas'
      width={window.innerWidth}
      height={window.innerHeight}
    >
      canvas
    </canvas>
  )
}

export default App
