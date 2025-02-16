import { useLayoutEffect, useState } from 'react';

function createElement(x1, y1, x2, y2, type) {
  // 创建一个绘图元素，包括起始点和结束点，以及类型
  return { x1, y1, x2, y2, type };
}

function App() {
  const [elements, setElements] = useState([]); // 存储所有绘图元素
  const [drawing, setDrawing] = useState(false); // 控制是否正在绘图
  const [elementType, setElementType] = useState('line'); // 当前选择的绘图类型

  useLayoutEffect(() => {
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    // 清空画布
    context.clearRect(0, 0, canvas.width, canvas.height);

    // 遍历绘图元素并绘制
    elements.forEach(({ x1, y1, x2, y2, type }) => {
      context.beginPath();
      if (type === 'line') {
        // 绘制线条
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
      } else if (type === 'rectangle') {
        // 绘制矩形
        const rectWidth = x2 - x1;
        const rectHeight = y2 - y1;
        context.rect(x1, y1, rectWidth, rectHeight);
      }
      context.stroke(); // 描边
    });
  }, [elements]); // 当 elements 更新时重绘画布

  const handleMouseDown = (event) => {
    setDrawing(true);

    // 获取鼠标起始位置
    const { clientX, clientY } = event;
    const element = createElement(clientX, clientY, clientX, clientY, elementType);
    setElements((prevState) => [...prevState, element]); // 将新元素添加到元素列表
  };

  const handleMouseMove = (event) => {
    if (!drawing) return;

    // 获取鼠标当前位置
    const { clientX, clientY } = event;
    const index = elements.length - 1; // 获取当前正在绘制的元素索引
    const { x1, y1 } = elements[index];
    const updatedElement = createElement(x1, y1, clientX, clientY, elementType);

    // 更新当前元素并设置到状态中
    const elementsCopy = [...elements];
    elementsCopy[index] = updatedElement;
    setElements(elementsCopy);
  };

  const handleMouseUp = () => {
    setDrawing(false); // 停止绘图
  };

  return (
    <div>
      <div style={{ position: 'fixed' }}>
        {/* 单选按钮 - 线条 */}
        <input
          type="radio"
          id="line"
          checked={elementType === 'line'} // 判断当前选中是否为线条
          onChange={() => setElementType('line')} // 切换为线条
        />
        <label htmlFor="line">Line</label>

        {/* 单选按钮 - 矩形 */}
        <input
          type="radio"
          id="rectangle"
          checked={elementType === 'rectangle'} // 判断当前选中是否为矩形
          onChange={() => setElementType('rectangle')} // 切换为矩形
        />
        <label htmlFor="rectangle">Rectangle</label>
      </div>
      <canvas
        id="canvas"
        width={window.innerWidth} // 设置画布宽度为窗口宽度
        height={window.innerHeight} // 设置画布高度为窗口高度
        onMouseDown={handleMouseDown} // 鼠标按下事件
        onMouseMove={handleMouseMove} // 鼠标移动事件
        onMouseUp={handleMouseUp} // 鼠标抬起事件
        style={{ border: '1px solid black' }} // 为画布添加边框
      >
        canvas
      </canvas>
    </div>
  );
}

export default App;
