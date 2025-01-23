<template>
  <div class="container">
    <div class="control-panel">
      <div class="buttons">
        <div class="algorithm-container" v-for="algo in algorithms" :key="algo.name">
          <button 
            :id="algo.id" 
            :style="{ backgroundColor: algo.color }"
            @click="runAlgorithm(algo.method)"
          >
            {{ algo.name }}
          </button>
          <span class="time-info">算法耗时：{{ algo.algoTime }}</span>
          <span class="time-info">路径耗时：{{ algo.pathTime }}</span>
        </div>
        <div class="algorithm-container">
          <button id="resetBtn" @click="resetMap" style="background-color: #666">
            重置地图
          </button>
        </div>
      </div>
      <div class="speed-control">
        <label>动画速度：</label>
        <input 
          type="range" 
          v-model="animationSpeed" 
          min="1" 
          max="100"
        >
      </div>
    </div>
    <canvas ref="gameCanvas" width="500" height="500"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { PathFinding } from '../utils/pathfinding'

// 算法配置
const algorithms = reactive([
  { id: 'greedyBtn', name: '贪心算法', color: '#2196F3', method: 'greedy', algoTime: '-', pathTime: '-' },
  { id: 'astarBtn', name: 'A*算法', color: '#E91E63', method: 'astar', algoTime: '-', pathTime: '-' },
  { id: 'dijkstraBtn', name: 'Dijkstra算法', color: '#FF9800', method: 'dijkstra', algoTime: '-', pathTime: '-' },
  { id: 'bfsBtn', name: 'BFS算法', color: '#9C27B0', method: 'bfs', algoTime: '-', pathTime: '-' }
])

// 画布相关
const gameCanvas = ref(null)
const ctx = ref(null)
const gridSize = 20
const animationSpeed = ref(50)

// 游戏状态
const snake = reactive({ x: 0, y: 0 })
const food = ref(null)
const obstacles = ref([])
const visitedNodes = ref(new Map())
const currentExplorationPath = ref([])
const isAnimating = ref(false)

// 各算法的路径
const paths = reactive({
  greedy: [],
  astar: [],
  dijkstra: [],
  bfs: []
})

// 初始化
onMounted(() => {
  ctx.value = gameCanvas.value.getContext('2d')
  resetMap()
  
  // 添加画布点击事件
  gameCanvas.value.addEventListener('click', handleCanvasClick)
})

// 方法定义
const resetMap = () => {
  // 清空所有路径和状态
  Object.keys(paths).forEach(key => paths[key] = [])
  obstacles.value = []
  visitedNodes.value.clear()
  currentExplorationPath.value = []
  
  // 重置时间显示
  algorithms.forEach(algo => {
    algo.algoTime = '-'
    algo.pathTime = '-'
  })
  
  generateFood()
  generateObstacles()
  draw()
}

const generateFood = () => {
  const cols = gameCanvas.value.width / gridSize
  const rows = gameCanvas.value.height / gridSize
  
  // 在右下角区域生成食物
  const minX = Math.floor(cols * 0.5)
  const minY = Math.floor(rows * 0.5)
  
  do {
    food.value = {
      x: minX + Math.floor(Math.random() * (cols - minX)),
      y: minY + Math.floor(Math.random() * (rows - minY))
    }
  } while (isObstacle(food.value.x, food.value.y))
}

const generateObstacles = () => {
  const cols = gameCanvas.value.width / gridSize
  const rows = gameCanvas.value.height / gridSize
  
  // 生成随机障碍物
  const obstacleCount = Math.floor((cols * rows) * 0.2) // 20%的格子作为障碍物
  
  for (let i = 0; i < obstacleCount; i++) {
    let x, y
    do {
      x = Math.floor(Math.random() * cols)
      y = Math.floor(Math.random() * rows)
    } while (
      (x === snake.x && y === snake.y) || // 不在蛇的位置
      (food.value && x === food.value.x && y === food.value.y) || // 不在食物的位置
      isObstacle(x, y) // 不重复放置
    )
    
    obstacles.value.push({ x, y })
  }
}

const isObstacle = (x, y) => {
  return obstacles.value.some(o => o.x === x && o.y === y)
}

const draw = () => {
  const canvas = gameCanvas.value
  ctx.value.clearRect(0, 0, canvas.width, canvas.height)
  
  // 绘制网格
  drawGrid()
  
  // 绘制障碍物
  drawObstacles()
  
  // 绘制已访问节点
  drawVisitedNodes()
  
  // 绘制探索路径
  drawExplorationPaths()
  
  // 绘制最终路径
  drawFinalPaths()
  
  // 绘制蛇和食物
  drawFoodAndSnake()
}

// 绘制相关方法
const drawGrid = () => {
  const canvas = gameCanvas.value
  ctx.value.strokeStyle = '#ddd'
  ctx.value.lineWidth = 0.5
  
  for (let x = 0; x <= canvas.width; x += gridSize) {
    ctx.value.beginPath()
    ctx.value.moveTo(x, 0)
    ctx.value.lineTo(x, canvas.height)
    ctx.value.stroke()
  }
  
  for (let y = 0; y <= canvas.height; y += gridSize) {
    ctx.value.beginPath()
    ctx.value.moveTo(0, y)
    ctx.value.lineTo(canvas.width, y)
    ctx.value.stroke()
  }
}

const drawObstacles = () => {
  ctx.value.fillStyle = '#333'
  obstacles.value.forEach(obstacle => {
    ctx.value.fillRect(
      obstacle.x * gridSize,
      obstacle.y * gridSize,
      gridSize,
      gridSize
    )
  })
}

const drawVisitedNodes = () => {
  ctx.value.fillStyle = 'rgba(173, 216, 230, 0.5)' // 浅蓝色
  visitedNodes.value.forEach((_, key) => {
    const [x, y] = key.split(',')
    ctx.value.fillRect(
      parseInt(x) * gridSize,
      parseInt(y) * gridSize,
      gridSize,
      gridSize
    )
  })
}

const drawExplorationPaths = () => {
  ctx.value.strokeStyle = 'rgba(128, 128, 128, 0.3)' // 浅灰色
  ctx.value.lineWidth = 1
  ctx.value.setLineDash([4, 4]) // 设置虚线样式
  
  // 绘制当前探索路径
  if (currentExplorationPath.value.length > 1) {
    ctx.value.beginPath()
    const start = currentExplorationPath.value[0]
    ctx.value.moveTo(
      (start.x * gridSize) + (gridSize / 2),
      (start.y * gridSize) + (gridSize / 2)
    )
    
    for (let i = 1; i < currentExplorationPath.value.length; i++) {
      const point = currentExplorationPath.value[i]
      ctx.value.lineTo(
        (point.x * gridSize) + (gridSize / 2),
        (point.y * gridSize) + (gridSize / 2)
      )
    }
    ctx.value.stroke()
  }
  
  ctx.value.setLineDash([]) // 恢复实线样式
}

const drawFinalPaths = () => {
  // 为每种算法设置不同的颜色
  const pathColors = {
    greedy: '#2196F3',
    astar: '#E91E63',
    dijkstra: '#FF9800',
    bfs: '#9C27B0'
  }
  
  ctx.value.lineWidth = 3
  ctx.value.setLineDash([]) // 确保使用实线
  
  Object.entries(paths).forEach(([method, path]) => {
    if (path && path.length > 1) {
      ctx.value.strokeStyle = pathColors[method]
      
      ctx.value.beginPath()
      ctx.value.moveTo(
        (path[0].x * gridSize) + (gridSize / 2),
        (path[0].y * gridSize) + (gridSize / 2)
      )
      
      for (let i = 1; i < path.length; i++) {
        ctx.value.lineTo(
          (path[i].x * gridSize) + (gridSize / 2),
          (path[i].y * gridSize) + (gridSize / 2)
        )
      }
      ctx.value.stroke()
    }
  })
}

const drawFoodAndSnake = () => {
  // 绘制蛇
  ctx.value.fillStyle = '#4CAF50'
  ctx.value.fillRect(
    snake.x * gridSize,
    snake.y * gridSize,
    gridSize,
    gridSize
  )
  
  // 绘制食物
  if (food.value) {
    ctx.value.fillStyle = '#F44336'
    ctx.value.fillRect(
      food.value.x * gridSize,
      food.value.y * gridSize,
      gridSize,
      gridSize
    )
  }
}

// 处理画布点击
const handleCanvasClick = (event) => {
  const rect = gameCanvas.value.getBoundingClientRect()
  const x = Math.floor((event.clientX - rect.left) / gridSize)
  const y = Math.floor((event.clientY - rect.top) / gridSize)
  
  // 如果点击的不是蛇或食物的位置，切换障碍物状态
  if (!(x === snake.x && y === snake.y) && 
      !(food.value && x === food.value.x && y === food.value.y)) {
    const index = obstacles.value.findIndex(o => o.x === x && o.y === y)
    if (index === -1) {
      obstacles.value.push({ x, y })
    } else {
      obstacles.value.splice(index, 1)
    }
    draw()
  }
}

// 算法相关方法
const findPathGreedy = async () => {
  const result = await PathFinding.findPathGreedy(
    snake,
    food.value,
    gameCanvas.value.width / gridSize,
    gameCanvas.value.height / gridSize,
    obstacles.value,
    key => visitedNodes.value.set(key, true),
    path => {
      currentExplorationPath.value = path
      draw()
    }
  )
  
  paths.greedy = result.path
  draw()
}

const findPathAstar = async () => {
  const result = await PathFinding.findPathAstar(
    snake,
    food.value,
    gameCanvas.value.width / gridSize,
    gameCanvas.value.height / gridSize,
    obstacles.value,
    key => visitedNodes.value.set(key, true),
    path => {
      currentExplorationPath.value = path
      draw()
    }
  )
  
  paths.astar = result.path
  draw()
}

const findPathDijkstra = async () => {
  const result = await PathFinding.findPathDijkstra(
    snake,
    food.value,
    gameCanvas.value.width / gridSize,
    gameCanvas.value.height / gridSize,
    obstacles.value,
    key => visitedNodes.value.set(key, true),
    path => {
      currentExplorationPath.value = path
      draw()
    }
  )
  
  paths.dijkstra = result.path
  draw()
}

const findPathBFS = async () => {
  const result = await PathFinding.findPathBFS(
    snake,
    food.value,
    gameCanvas.value.width / gridSize,
    gameCanvas.value.height / gridSize,
    obstacles.value,
    key => visitedNodes.value.set(key, true),
    path => {
      currentExplorationPath.value = path
      draw()
    }
  )
  
  paths.bfs = result.path
  draw()
}

// 运行算法
const runAlgorithm = async (method) => {
  if (isAnimating.value) return
  
  isAnimating.value = true
  // 只清除当前算法的路径和访问状态
  paths[method] = []
  visitedNodes.value.clear()
  currentExplorationPath.value = []
  
  const startTime = performance.now()
  
  switch (method) {
    case 'greedy':
      await findPathGreedy()
      break
    case 'astar':
      await findPathAstar()
      break
    case 'dijkstra':
      await findPathDijkstra()
      break
    case 'bfs':
      await findPathBFS()
      break
  }
  
  const endTime = performance.now()
  const algo = algorithms.find(a => a.method === method)
  if (algo) {
    algo.algoTime = `${Math.round(endTime - startTime)}ms`
    const pathTime = calculatePathTime(paths[method])
    algo.pathTime = pathTime ? `${pathTime}步` : '-'
  }
  
  isAnimating.value = false
}

const calculatePathTime = (path) => {
  return path ? path.length : null
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px;
}

.control-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  width: 500px;
}

.buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
  width: 100%;
}

.algorithm-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

button {
  padding: 6px 0;
  font-size: 13px;
  cursor: pointer;
  border: none;
  border-radius: 4px;
  color: white;
  transition: opacity 0.3s;
  width: 85px;
}

button:hover {
  opacity: 0.8;
}

.time-info {
  font-size: 11px;
  color: #666;
  white-space: nowrap;
}

.speed-control {
  margin-top: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}

input[type="range"] {
  width: 200px;
}

canvas {
  border: 1px solid #000;
}
</style> 