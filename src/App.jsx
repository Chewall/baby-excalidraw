import {useLayoutEffect, useState} from 'react'
import rough from 'roughjs/bundled/rough.esm.js'

const generator = rough.generator()

function createElement(id, x1, y1, x2, y2, type) {
  const roughElement =
    type === 'line'
      ? generator.line(x1, y1, x2, y2)
      : generator.rectangle(x1, y1, x2 - x1, y2 - y1);
  return { id, x1, y1, x2, y2, type, roughElement}
}

// 判断点是否在元素内（矩形或线段）
const isWithinElement = (x, y, element) => {
  const { type, x1, x2, y1, y2 } = element;

  if (type === "rectangle") {
    // 如果是矩形，计算矩形的边界
    const minX = Math.min(x1, x2); // 矩形左边界
    const maxX = Math.max(x1, x2); // 矩形右边界
    const minY = Math.min(y1, y2); // 矩形上边界
    const maxY = Math.max(y1, y2); // 矩形下边界

    // 判断点是否在矩形边界内
    return x >= minX && x <= maxX && y >= minY && y <= maxY;
  } else {
    // 如果是线段，计算点与线段的关系
    const a = { x: x1, y: y1 }; // 线段起点
    const b = { x: x2, y: y2 }; // 线段终点
    const c = { x, y }; // 待判断的点

    // 计算偏移量：线段的总长度减去两段的距离和
    const offset = distance(a, b) - (distance(a, c) + distance(b, c));

    // 如果偏移量接近 0，则点在线段上
    return Math.abs(offset) < 1;
  }
};

// 计算两点之间的距离
const distance = (a, b) =>
  Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

const getElementAtPosition = (x, y, elements) => {
  return elements.find((element) => isWithinElement(x, y, element));
};

function App() {

  const [elements, setElements] = useState([])
  const [action, setAction] = useState('none')
  const [tool, setTool] = useState('line')
  const [selectedElement, setSelectedElement] = useState(null)

  useLayoutEffect(() => {
    const canvas = document.getElementById('canvas')
    const context = canvas.getContext('2d')
    context.clearRect(0, 0, canvas.width, canvas.height)

    const roughCanvas = rough.canvas(canvas)
    elements.forEach(({roughElement}) => roughCanvas.draw(roughElement))
  }, [elements]);

  const updateElement = (id, x1, y1, x2, y2, type) => {
    const updateElement = createElement(id, x1, y1, x2, y2, type)

    const elementsCopy = [...elements]
    elementsCopy[id] = updateElement
    setElements(elementsCopy)
  }
  const handleMouseDown = (event) => {
    const { clientX, clientY } = event
    if (tool === 'selection') {
      const element = getElementAtPosition(clientX, clientY, elements)
      if (element){
        const offsetX = clientX - element.x1
        const offsetY = clientY - element.y1
        setSelectedElement({...element, offsetX, offsetY})
        setAction('moving')
      }
    } else {
      const id = elements.length;
      const element = createElement(id, clientX, clientY, clientX, clientY, tool)
      setElements((prevState) => [...prevState, element])

      setAction('drawing')
    }
  }

  const handleMouseMove = (event) => {
    const { clientX, clientY } = event

    if (tool === 'selection') {
      event.target.style.cursor = getElementAtPosition(clientX, clientY, elements)
      ? 'move' : 'default'
    }
    if (action === 'drawing') {
      const index = elements.length - 1
      const { x1, y1 } = elements[index]
      updateElement(index, x1, y1, clientX, clientY, tool)
    }else if(action === 'moving') {
      const { id, x1, x2, y1, y2, type, offsetX, offsetY } = selectedElement
      const width = x2 - x1
      const height = y2 - y1
      const nexX1 = clientX - offsetX
      const nexY1 = clientY - offsetY
      updateElement(id, nexX1, nexY1, nexX1 + width, nexY1 + height, type )
    }


  }

  const handleMouseUp = () => {
    setAction('none')
    setSelectedElement(null)
  }
  return (
    <div>
      <div style={{position: "fixed"}}>
        <input
          type="radio"
          id="selection"
          checked={tool === "selection"} // 判断当前选中是否为线条
          onChange={() => setTool("selection")} // 切换为线条
        />
        <label htmlFor="selection">selection</label>
        {/* 单选按钮 - 线条 */}
        <input
          type="radio"
          id="line"
          checked={tool === "line"} // 判断当前选中是否为线条
          onChange={() => setTool("line")} // 切换为线条
        />
        <label htmlFor="line">Line</label>

        {/* 单选按钮 - 矩形 */}
        <input
          type="radio"
          id="rectangle"
          checked={tool === "rectangle"} // 判断当前选中是否为矩形
          onChange={() => setTool("rectangle")} // 切换为矩形
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
