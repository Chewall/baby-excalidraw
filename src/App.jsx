import {useLayoutEffect, useState} from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'

function App() {

  useLayoutEffect(() => {
    const canvas = document.getElementById('canvas')
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = 'green'
    ctx.fillRect(10, 10, 150, 100)
    ctx.strokeRect(200, 200, 100, 100)
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
