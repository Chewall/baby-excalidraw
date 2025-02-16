import {useLayoutEffect, useState} from 'react'
import rough from 'roughjs/bundled/rough.esm.js'

const generator = rough.generator()

function createElement(x1, y1, x2, y2, type) {
  const roughElement =
    type === 'line'
      ? generator.line(x1, y1, x2, y2)
      : generator.rectangle(x1, y1, x2 - x1, y2 - y1);
  return { x1, y1, x2, y2, roughElement}
}
function App() {

  const [elements, setElements] = useState([])
  const [drawing, setDrawing] = useState(false)
  const [elementType, setElementType] = useState('line')

  useLayoutEffect(() => {
    const canvas = document.getElementById('canvas')
    const context = canvas.getContext('2d')
    context.clearRect(0, 0, canvas.width, canvas.height)

    const roughCanvas = rough.canvas(canvas)
    elements.forEach(({roughElement}) => roughCanvas.draw(roughElement))
  }, [elements]);

  const handleMouseDown = (event) => {
    setDrawing(true)

    const { clientX, clientY } = event
    const element = createElement(clientX, clientY, clientX, clientY, elementType)
    setElements((prevState) => [...prevState, element])
  }

  const handleMouseMove = (event) => {
    if (!drawing) return

    const { clientX, clientY } = event
    const index = elements.length - 1
    const { x1, y1 } = elements[index]
    const updateElement = createElement(x1, y1, clientX, clientY, elementType)

    const elementsCopy = [...elements]
    elementsCopy[index] = updateElement
    setElements(elementsCopy)
  }

  const handleMouseUp = () => {
    setDrawing(false)
  }
  return (
    <div>
      <div style={{position: "fixed"}}>
        {/* 单选按钮 - 线条 */}
        <input
          type="radio"
          id="line"
          checked={elementType === "line"} // 判断当前选中是否为线条
          onChange={() => setElementType("line")} // 切换为线条
        />
        <label htmlFor="line">Line</label>

        {/* 单选按钮 - 矩形 */}
        <input
          type="radio"
          id="rectangle"
          checked={elementType === "rectangle"} // 判断当前选中是否为矩形
          onChange={() => setElementType("rectangle")} // 切换为矩形
        />
        <label htmlFor="rectangle">Rectangle</label>
      </div>
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
    </div>
  )
}

export default App
