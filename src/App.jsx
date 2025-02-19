import {useEffect, useLayoutEffect, useState} from 'react'
import rough from 'roughjs/bundled/rough.esm.js'
import getStroke from 'perfect-freehand'

// 初始化 RoughJS 的 generator 实例，用于生成图形
const generator = rough.generator()

// 创建绘图元素
const createElement = (id, x1, y1, x2, y2, type) => {
  switch (type) {
    case "line":
    case "rectangle":
      { const roughElement = type === "line"
        ? generator.line(x1, y1, x2, y2)
        : generator.rectangle(x1, y1, x2 - x1, y2 - y1
        );
      return { id, x1, y1, x2, y2, type, roughElement }; }

    case "pencil":
      return { id, type, points: [{ x: x1, y: y1 }] };

    default:
      throw new Error(`Type not recognised: ${type}`);
  }
};
// 判断某个点是否接近目标点（用于操作时判断是否接近顶点）
const nearPoint = (x, y, x1, y1, name) => {
  return Math.abs(x - x1) < 5 && Math.abs(y - y1) < 5 ? name : null
}

const onLine = (x1, y1, x2, y2, x, y, maxDistance = 1) => {
  const a = { x: x1, y: y1 };
  const b = { x: x2, y: y2 };
  const c = { x, y };

  const offset = distance(a, b) - (distance(a, c) + distance(b, c));
  return Math.abs(offset) < maxDistance ? "inside" : null;
};

// 判断点是否在元素内，并返回相应位置
const positionWithinElement = (x, y, element) => {
  const { type, x1, y1, x2, y2 } = element;

  switch (type) {
    case "line":{
      const on = onLine(x1, y1, x2, y2, x, y);
      const start = nearPoint(x, x1, y1);
      const end = nearPoint(x, x2, y2);
      return start && end || on;
    }

    case "rectangle":{
      const topLeft = nearPoint(x, x1, y1);
      const topRight = nearPoint(x, x2, y1);
      const bottomLeft = nearPoint(x, x1, y2);
      const bottomRight = nearPoint(x, x2, y2);
      const inside = x >= x1 && x <= x2 && y >= y1 && y <= y2 ? "inside" : null;
      return topLeft || topRight || bottomLeft || bottomRight || inside;
    }

    case "pencil":{
      const betweenAnyPoint = element.points.some((point, index) => {
        const nextPoint = element.points[index + 1];
        if (!nextPoint) return false;
        return onLine(point.x, point.y, nextPoint.x, nextPoint.y, x, y, 5) != null;
      });
      return betweenAnyPoint ? "inside" : null;
    }

    default:
      throw new Error(`Type not recognised: ${type}`);
  }
};


// 计算两点之间的距离
const distance = (a, b) =>
  Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

// 获取鼠标点击位置对应的元素（包含点击位置的信息）
const getElementAtPosition = (x, y, elements) => {
  return elements
    .map((element) => ({ ...element, position: positionWithinElement(x, y, element) }))
    .find((element) => element.position != null);
};

// 调整元素的坐标（确保 x1, y1 是左上角，x2, y2 是右下角）
const adjustElementCoordinates = (element) => {
  const { type, x1, y1, x2, y2 } = element
  if (type === "rectangle") {
    const minX = Math.min(x1, x2)
    const maxX = Math.max(x1, x2)
    const minY = Math.min(y1, y2)
    const maxY = Math.max(y1, y2)
    return { x1: minX, y1: minY, x2: maxX, y2: maxY }
  } else {
    if (x1 < x2 || (x1 === x2 && y1 < y2)) {
      return { x1, y1, x2, y2 }
    } else {
      return { x1: x2, y1: y2, x2: x1, y2: y1 }
    }
  }
}

// 根据鼠标位置调整元素的光标样式
const cursorForPosition = position => {
  switch (position) {
    case "tl":
    case "br":
    case "start":
    case "end":
      return "nwse-resize"; // 斜向调整
    case "tr":
    case "bl":
      return "nesw-resize"; // 斜向调整
    default:
      return "move"; // 移动
  }
};

// 根据调整的方向重新计算坐标
const resizeCoordinates = (clientX, clientY, position, coordinates) => {
  const { x1, y1, x2, y2 } = coordinates
  switch (position) {
    case 'tl':
    case 'start': // 起点
      return { x1: clientX, y1: clientY, x2, y2 }
    case 'tr': // 右上角
      return { x1, y1: clientY, x2: clientX, y2 }
    case 'bl': // 左下角
      return { x1: clientX, y1, x2, y2: clientY }
    case 'br':
    case 'end': // 终点
      return { x1, y1, x2: clientX, y2: clientY }
    default:
      return null
  }
};

const useHistory = (initialState) => {
  const [index, setIndex] = useState(0)
  const [history, setHistory] = useState([initialState]) //history为: [[{…}], [{…}]]

  const setState = (action, overwrite = false) => {
    const newState = typeof action === 'function' ? action(history[index]) : action
    if (overwrite) {
      const historyCopy = [...history]
      historyCopy[index] = newState
      setHistory(historyCopy)
    } else {
      const updatedState = [...history].slice(0, index+1)
      setHistory([...updatedState, newState])
      setIndex(prevState => prevState+1)
    }
  }
  
  const undo = () => index > 0 && setIndex(prevState => prevState - 1)
  const redo = () => index < history.length - 1 && setIndex(prevState => prevState + 1)
  
  return [history[index], setState, undo, redo]
}

const getSvgPathFromStroke = stroke => {
  if (!stroke.length) return "";

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"]
  );

  d.push("Z");
  return d.join(" ");
};


const drawElement = (roughCanvas, context, element) => {
  switch (element.type) {
    case "line":
    case "rectangle":
      roughCanvas.draw(element.roughElement);
      break;
    case "pencil":
      { const stroke = getSvgPathFromStroke(getStroke(element.points))
      context.fill(new Path2D(stroke))
      break; }
      // {
      //   console.log("Debug__element :", element.points)
      //   const resGetStroke = getStroke(element.points)
      //   console.log("Debug__resGetStroke :", typeof(resGetStroke),resGetStroke)
      //   const stroke = getSvgPathFromStroke(resGetStroke)
      //   console.log("Debug__stroke :", stroke)
      //   context.fill(new Path2D(stroke))
      //   break; }
    default:
      throw new Error(`Type not recognised: ${element.type}`);
  }
};

const adjustmentRequired = (type) => ['line', 'rectangle'].includes(type)

// 主组件
function App() {
  const [elements, setElements, undo, redo] = useHistory([]); // 存储所有元素
  const [action, setAction] = useState('none'); // 当前操作状态
  const [tool, setTool] = useState('pencil'); // 当前工具类型（线条或矩形）
  const [selectedElement, setSelectedElement] = useState(null); // 当前选中的元素

  // 每次元素更新后，重新绘制 canvas
  useLayoutEffect(() => {
    const canvas = document.getElementById('canvas')
    const context = canvas.getContext('2d')
    context.clearRect(0, 0, canvas.width, canvas.height)

    const roughCanvas = rough.canvas(canvas)
    elements.forEach((element) => drawElement(roughCanvas, context, element))
  }, [elements]);


  useEffect(() => {
    const undoRedoFunction = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'z') {
        if (event.shiftKey) {
          redo()
        } else {
          undo()
        }
      }
    }
    document.addEventListener('keydown', undoRedoFunction)

    return () => {
      document.removeEventListener('keydown', undoRedoFunction)
    }
  }, [undo, redo]);

  // 更新元素（用于绘制或调整）
  const updateElement = (id, x1, y1, x2, y2, type) => {
    const elementsCopy = [...elements];

    switch (type) {
      case "line":
      case "rectangle":
        elementsCopy[id] = createElement(id, x1, y1, x2, y2, type);
        break;
      case "pencil":
        elementsCopy[id].points = [
          ...elementsCopy[id].points,
          { x: x2, y: y2 }
        ];
        break;
      default:
        throw new Error(`Type not recognised: ${type}`);
    }

    setElements(elementsCopy, true);
  };


  // 鼠标按下事件
  const handleMouseDown = (event) => {
    const { clientX, clientY } = event
    if (tool === 'selection') {
      // 选择工具：根据鼠标位置选中元素
      const element = getElementAtPosition(clientX, clientY, elements);
      if (element) {
        if (element.type === "pencil") {
          const xOffsets = element.points.map(point => clientX - point.x);
          const yOffsets = element.points.map(point => clientY - point.y);
          setSelectedElement( { ...element, xOffsets, yOffsets });
        } else {
          const offsetX = clientX - element.x1;
          const offsetY = clientY - element.y1;
          setSelectedElement({ ...element, offsetX, offsetY });
        }
        setElements(prevState => prevState);
        if (element.position === "inside") {
          setAction("moving");
        } else {
          setAction("resizing");
        }
      }
    } else {
      // 绘制工具：创建新元素
      const id = elements.length;
      const element = createElement(id, clientX, clientY, clientX, clientY, tool)
      setElements((prevState) => [...prevState, element])
      setSelectedElement(element)
      setAction('drawing')
    }
  }

  // 鼠标移动事件
  const handleMouseMove = (event) => {
    const { clientX, clientY } = event

    if (tool === 'selection') {
      // 根据鼠标悬停的位置更新光标样式
      const element = getElementAtPosition(clientX, clientY, elements)
      event.target.style.cursor = element
        ? cursorForPosition(element.position) : 'default'
    }

    if (action === 'drawing') {
      // 如果正在绘制新元素，实时更新坐标
      const index = elements.length - 1
      const { x1, y1 } = elements[index]
      updateElement(index, x1, y1, clientX, clientY, tool)
    } else if (action === 'moving') {
      // 如果正在移动元素，计算新的位置
      if (selectedElement.type === "pencil") {
        const newPoints = selectedElement.points.map((_, index) => ({
          x: clientX - selectedElement.xOffsets[index],
          y: clientY - selectedElement.yOffsets[index],
        }));
        //添加连线功能
        const elementsCopy = [...elements];
        elementsCopy[selectedElement.id].points = newPoints;
        setElements(elementsCopy, true);
      } else {
        const { id, x1, x2, y1, y2, type, offsetX, offsetY } = selectedElement;
        const width = x2 - x1;
        const height = y2 - y1;
        const newX1 = clientX - offsetX;
        const newY1 = clientY - offsetY;
        updateElement(id, newX1, newY1, newX1 + width, newY1 + height, type);
      }
    } else if (action === 'resizing') {
      // 如果正在调整大小，实时更新尺寸
      const { id, type, position, ...coordinates } = selectedElement
      const { x1, y1, x2, y2 } = resizeCoordinates(clientX, clientY, position, coordinates)
      updateElement(id, x1, y1, x2, y2, type)
    }
  }

  // 鼠标松开事件
  const handleMouseUp = () => {
    if (selectedElement) {
      const index = selectedElement.id
      const { id, type } = elements[index]
      if ((action === 'drawing' || action === 'resizing') && adjustmentRequired(type)) {
        // 调整坐标，以确保矩形的左上角和右下角正确
        const { x1, y1, x2, y2 } = adjustElementCoordinates(elements[index])
        updateElement(id, x1, y1, x2, y2, type)
      }
    }
    setAction('none')
    setSelectedElement(null)
  }

  // 渲染 UI
  return (
    <div>
      <div style={{position: "fixed"}}>
        {/* 工具选择 - 选择工具 */}
        <input
          type="radio"
          id="selection"
          checked={tool === "selection"}
          onChange={() => setTool("selection")}
        />
        <label htmlFor="selection">Selection</label>

        {/* 工具选择 - 绘制线条 */}
        <input
          type="radio"
          id="line"
          checked={tool === "line"}
          onChange={() => setTool("line")}
        />
        <label htmlFor="line">Line</label>

        {/* 工具选择 - 绘制矩形 */}
        <input
          type="radio"
          id="rectangle"
          checked={tool === "rectangle"}
          onChange={() => setTool("rectangle")}
        />
        <label htmlFor="rectangle">Rectangle</label>
        <input
          type="radio"
          id="pencil"
          checked={tool === "pencil"}
          onChange={() => setTool("pencil")}
        />
        <label htmlFor="pencil">Pencil</label>
      </div>
      <div style={{position: 'fixed', bottom: 0, padding: 10}}>
        <button onClick={undo}>Undo</button>
        <button onClick={redo}>Redo</button>
      </div>

      {/* Canvas 画布 */}
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
