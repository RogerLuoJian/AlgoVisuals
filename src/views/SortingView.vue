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
        </div>
        <div class="algorithm-container">
          <button id="resetBtn" @click="resetArray" style="background-color: #666">
            重置数组
          </button>
          <button id="shuffleBtn" @click="shuffleArray" style="background-color: #888">
            打乱数组
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
      <div class="array-size-control">
        <label>数组大小：</label>
        <div class="range-container">
          <input 
            type="range" 
            v-model="arraySize" 
            min="10" 
            max="100"
            @change="resetArray"
          >
          <span class="size-value">{{ arraySize }}</span>
        </div>
      </div>
    </div>
    <canvas ref="sortCanvas" width="800" height="400"></canvas>
    
    <!-- 算法说明区域 -->
    <div class="algorithm-info" v-if="currentAlgorithm">
      <h3>{{ currentAlgorithm.name }}的特点</h3>
      <p class="description">{{ currentAlgorithm.description }}</p>
      <div class="complexity-info">
        <div class="complexity-item">
          <span class="label">平均时间复杂度:</span>
          <span class="value">{{ currentAlgorithm.complexity.time }}</span>
        </div>
        <div class="complexity-item">
          <span class="label">空间复杂度:</span>
          <span class="value">{{ currentAlgorithm.complexity.space }}</span>
        </div>
        <div class="complexity-item">
          <span class="label">最好情况:</span>
          <span class="value">{{ currentAlgorithm.complexity.best }}</span>
        </div>
        <div class="complexity-item">
          <span class="label">最坏情况:</span>
          <span class="value">{{ currentAlgorithm.complexity.worst }}</span>
        </div>
        <div class="complexity-item">
          <span class="label">稳定性:</span>
          <span class="value">{{ currentAlgorithm.complexity.stable ? '稳定' : '不稳定' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'

// 算法配置
const algorithms = reactive([
  { 
    id: 'bubbleBtn', 
    name: '冒泡排序', 
    color: '#2196F3', 
    method: 'bubble', 
    algoTime: '-',
    description: '冒泡排序是最简单的排序算法，重复地走访过要排序的元素列表，依次比较两个相邻的元素，如果顺序错误就把他们交换过来。',
    complexity: {
      time: 'O(n²)',
      space: 'O(1)',
      best: 'O(n)',
      worst: 'O(n²)',
      stable: true
    }
  },
  { 
    id: 'quickBtn', 
    name: '快速排序', 
    color: '#E91E63', 
    method: 'quick', 
    algoTime: '-',
    description: '快速排序使用分治法策略来把一个序列分为较小和较大的2个子序列，然后递归地排序两个子序列。',
    complexity: {
      time: 'O(n log n)',
      space: 'O(log n)',
      best: 'O(n log n)',
      worst: 'O(n²)',
      stable: false
    }
  },
  { 
    id: 'mergeBtn', 
    name: '归并排序', 
    color: '#FF9800', 
    method: 'merge', 
    algoTime: '-',
    description: '归并排序采用分治法，将已有序的子序列合并，得到完全有序的序列。把长度为n的输入序列分成两个长度为n/2的子序列。',
    complexity: {
      time: 'O(n log n)',
      space: 'O(n)',
      best: 'O(n log n)',
      worst: 'O(n log n)',
      stable: true
    }
  },
  { 
    id: 'heapBtn', 
    name: '堆排序', 
    color: '#9C27B0', 
    method: 'heap', 
    algoTime: '-',
    description: '堆排序是利用堆这种数据结构而设计的一种排序算法，堆是一个近似完全二叉树的结构，并同时满足堆积的性质。',
    complexity: {
      time: 'O(n log n)',
      space: 'O(1)',
      best: 'O(n log n)',
      worst: 'O(n log n)',
      stable: false
    }
  },
  { 
    id: 'insertionBtn', 
    name: '插入排序', 
    color: '#4CAF50', 
    method: 'insertion', 
    algoTime: '-',
    description: '插入排序的工作原理是通过构建有序序列，对于未排序数据，在已排序序列中从后向前扫描，找到相应位置并插入。',
    complexity: {
      time: 'O(n²)',
      space: 'O(1)',
      best: 'O(n)',
      worst: 'O(n²)',
      stable: true
    }
  }
])

// 画布相关
const sortCanvas = ref(null)
const ctx = ref(null)
const animationSpeed = ref(50)
const arraySize = ref(50)

// 数组状态
const array = ref([])
const isAnimating = ref(false)

// 颜色配置
const colors = {
  default: '#2196F3',      // 默认颜色
  comparing: '#FF9800',    // 比较中的元素
  sorted: '#4CAF50',       // 已排序的元素
  selected: '#E91E63'      // 当前选中的元素
}

// 当前选中的算法
const currentAlgorithm = ref(algorithms[0])

// 初始化
onMounted(() => {
  ctx.value = sortCanvas.value.getContext('2d')
  // 设置画布大小为容器大小
  resizeCanvas()
  // 监听窗口大小变化
  window.addEventListener('resize', resizeCanvas)
  resetArray()
})

// 调整画布大小
const resizeCanvas = () => {
  const container = sortCanvas.value.parentElement
  const width = container.clientWidth - 40 // 减去内边距
  const height = Math.min(400, window.innerHeight - 300) // 限制最大高度
  
  sortCanvas.value.width = width
  sortCanvas.value.height = height
  draw() // 重新绘制
}

// 重置数组
const resetArray = () => {
  array.value = Array.from({ length: arraySize.value }, (_, i) => ({
    value: i + 1,
    state: 'default' // 状态可以是: default, comparing, sorted, selected
  }))
  shuffleArray()
  draw()
}

// 打乱数组
const shuffleArray = () => {
  for (let i = array.value.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array.value[i], array.value[j]] = [array.value[j], array.value[i]]
  }
  // 重置所有元素状态
  array.value.forEach(item => item.state = 'default')
  draw()
}

// 绘制数组
const draw = () => {
  const canvas = sortCanvas.value
  const width = canvas.width
  const height = canvas.height
  
  // 清空画布
  ctx.value.clearRect(0, 0, width, height)
  
  // 计算每个条形的宽度和间距
  // 根据数组大小动态调整条形宽度和间距
  const gap = Math.max(1, Math.floor(width / array.value.length / 10)) // 动态计算间距
  const barWidth = Math.max(2, (width - (array.value.length * gap)) / array.value.length)
  const maxValue = Math.max(...array.value.map(item => item.value))
  
  // 绘制每个条形
  array.value.forEach((item, index) => {
    const x = index * (barWidth + gap)
    const barHeight = (item.value / maxValue) * (height - 30) // 留出一些顶部空间
    
    // 根据状态设置颜色
    ctx.value.fillStyle = colors[item.state]
    
    // 绘制条形
    ctx.value.fillRect(x, height - barHeight, barWidth, barHeight)
  })
}

// 延时函数
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// 运行算法
const runAlgorithm = async (method) => {
  if (isAnimating.value) return
  
  isAnimating.value = true
  const startTime = performance.now()
  
  // 更新当前选中的算法
  currentAlgorithm.value = algorithms.find(a => a.method === method)
  
  try {
    switch (method) {
      case 'bubble':
        await bubbleSort()
        break
      case 'quick':
        await quickSort()
        break
      case 'merge':
        await mergeSort()
        break
      case 'heap':
        await heapSort()
        break
      case 'insertion':
        await insertionSort()
        break
    }
  } catch (error) {
    console.error('排序过程出错:', error)
  }
  
  const endTime = performance.now()
  const algo = algorithms.find(a => a.method === method)
  if (algo) {
    algo.algoTime = `${Math.round(endTime - startTime)}ms`
  }
  
  isAnimating.value = false
}

// 冒泡排序实现
const bubbleSort = async () => {
  const n = array.value.length
  
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      // 设置当前比较的两个元素状态
      array.value[j].state = 'comparing'
      array.value[j + 1].state = 'comparing'
      draw()
      
      await sleep(100 - animationSpeed.value)
      
      if (array.value[j].value > array.value[j + 1].value) {
        // 交换元素
        [array.value[j], array.value[j + 1]] = [array.value[j + 1], array.value[j]]
        draw()
      }
      
      // 重置状态
      array.value[j].state = 'default'
      array.value[j + 1].state = 'default'
    }
    // 标记已排序的元素
    array.value[n - i - 1].state = 'sorted'
    draw()
  }
  // 标记第一个元素为已排序
  array.value[0].state = 'sorted'
  draw()
}

// 快速排序实现
const quickSort = async () => {
  await quickSortHelper(0, array.value.length - 1)
  // 排序完成后,将所有元素标记为已排序
  array.value.forEach(item => item.state = 'sorted')
  draw()
}

// 快速排序辅助函数
const quickSortHelper = async (low, high) => {
  if (low < high) {
    // 获取分区点
    const pivotIndex = await partition(low, high)
    // 标记基准值为已排序
    array.value[pivotIndex].state = 'sorted'
    draw()
    // 递归排序左右两部分
    await quickSortHelper(low, pivotIndex - 1)
    await quickSortHelper(pivotIndex + 1, high)
  }
}

// 分区函数
const partition = async (low, high) => {
  // 选择最右边的元素作为基准值
  const pivot = array.value[high].value
  array.value[high].state = 'selected'
  draw()
  await sleep(100 - animationSpeed.value)
  
  let i = low - 1 // 小于基准值的元素的最后位置
  
  // 遍历数组,将小于基准值的元素放到左边
  for (let j = low; j < high; j++) {
    // 标记当前比较的元素
    array.value[j].state = 'comparing'
    draw()
    await sleep(100 - animationSpeed.value)
    
    if (array.value[j].value <= pivot) {
      i++
      // 交换元素
      if (i !== j) {
        [array.value[i], array.value[j]] = [array.value[j], array.value[i]]
        draw()
        await sleep(100 - animationSpeed.value)
      }
    }
    
    // 重置当前元素状态
    array.value[j].state = 'default'
  }
  
  // 将基准值放到正确的位置
  if (i + 1 !== high) {
    [array.value[i + 1], array.value[high]] = [array.value[high], array.value[i + 1]]
    draw()
    await sleep(100 - animationSpeed.value)
  }
  
  // 重置基准值状态
  array.value[high].state = 'default'
  
  return i + 1
}

// 归并排序实现
const mergeSort = async () => {
  await mergeSortHelper(0, array.value.length - 1)
  // 排序完成后,将所有元素标记为已排序
  array.value.forEach(item => item.state = 'sorted')
  draw()
}

// 归并排序辅助函数
const mergeSortHelper = async (left, right) => {
  if (left < right) {
    const mid = Math.floor((left + right) / 2)
    
    // 递归排序左半部分
    await mergeSortHelper(left, mid)
    // 递归排序右半部分
    await mergeSortHelper(mid + 1, right)
    // 合并两个有序数组
    await merge(left, mid, right)
  }
}

// 合并函数
const merge = async (left, mid, right) => {
  const n1 = mid - left + 1
  const n2 = right - mid
  
  // 创建临时数组
  const leftArr = array.value.slice(left, mid + 1)
  const rightArr = array.value.slice(mid + 1, right + 1)
  
  let i = 0 // 左数组指针
  let j = 0 // 右数组指针
  let k = left // 原数组指针
  
  // 标记当前正在合并的区域
  for (let x = left; x <= right; x++) {
    array.value[x].state = 'comparing'
  }
  draw()
  await sleep(100 - animationSpeed.value)
  
  // 合并两个数组
  while (i < n1 && j < n2) {
    // 标记当前比较的元素
    const leftIndex = left + i
    const rightIndex = mid + 1 + j
    array.value[leftIndex].state = 'selected'
    array.value[rightIndex].state = 'selected'
    draw()
    await sleep(100 - animationSpeed.value)
    
    if (leftArr[i].value <= rightArr[j].value) {
      array.value[k] = { ...leftArr[i], state: 'comparing' }
      i++
    } else {
      array.value[k] = { ...rightArr[j], state: 'comparing' }
      j++
    }
    k++
    draw()
    await sleep(100 - animationSpeed.value)
  }
  
  // 处理剩余元素
  while (i < n1) {
    array.value[k] = { ...leftArr[i], state: 'comparing' }
    i++
    k++
    draw()
    await sleep(100 - animationSpeed.value)
  }
  
  while (j < n2) {
    array.value[k] = { ...rightArr[j], state: 'comparing' }
    j++
    k++
    draw()
    await sleep(100 - animationSpeed.value)
  }
  
  // 标记已排序区域
  for (let x = left; x <= right; x++) {
    array.value[x].state = 'sorted'
  }
  draw()
  await sleep(100 - animationSpeed.value)
}

// 堆排序实现
const heapSort = async () => {
  const n = array.value.length;
  
  // 构建最大堆
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    await heapify(n, i);
  }
  
  // 一个个从堆顶取出元素
  for (let i = n - 1; i > 0; i--) {
    // 标记当前要交换的元素
    array.value[0].state = 'selected';
    array.value[i].state = 'selected';
    draw();
    await sleep(100 - animationSpeed.value);
    
    // 将堆顶元素（最大值）与末尾元素交换
    [array.value[0], array.value[i]] = [array.value[i], array.value[0]];
    
    // 标记已排序的元素
    array.value[i].state = 'sorted';
    draw();
    await sleep(100 - animationSpeed.value);
    
    // 重新调整堆
    await heapify(i, 0);
  }
  
  // 标记最后一个元素为已排序
  array.value[0].state = 'sorted';
  draw();
};

// 调整堆
const heapify = async (n, i) => {
  let largest = i; // 初始化最大值为根节点
  const left = 2 * i + 1; // 左子节点
  const right = 2 * i + 2; // 右子节点
  
  // 标记当前节点为正在处理
  if (i < array.value.length) {
    array.value[i].state = 'comparing';
  }
  
  // 标记子节点为正在比较
  if (left < n) {
    array.value[left].state = 'comparing';
  }
  if (right < n) {
    array.value[right].state = 'comparing';
  }
  draw();
  await sleep(100 - animationSpeed.value);
  
  // 比较左子节点
  if (left < n && array.value[left].value > array.value[largest].value) {
    // 重置之前的最大值状态
    array.value[largest].state = 'default';
    largest = left;
    array.value[largest].state = 'selected';
    draw();
    await sleep(100 - animationSpeed.value);
  }
  
  // 比较右子节点
  if (right < n && array.value[right].value > array.value[largest].value) {
    // 重置之前的最大值状态
    array.value[largest].state = 'default';
    largest = right;
    array.value[largest].state = 'selected';
    draw();
    await sleep(100 - animationSpeed.value);
  }
  
  // 如果最大值不是根节点
  if (largest !== i) {
    // 交换元素
    [array.value[i], array.value[largest]] = [array.value[largest], array.value[i]];
    draw();
    await sleep(100 - animationSpeed.value);
    
    // 重置状态
    array.value[i].state = 'default';
    array.value[largest].state = 'default';
    if (left < n) array.value[left].state = 'default';
    if (right < n) array.value[right].state = 'default';
    
    // 递归调整被影响的子堆
    await heapify(n, largest);
  } else {
    // 重置状态
    array.value[i].state = 'default';
    if (left < n) array.value[left].state = 'default';
    if (right < n) array.value[right].state = 'default';
  }
};

// 插入排序实现
const insertionSort = async () => {
  const n = array.value.length;
  
  // 第一个元素默认已排序
  array.value[0].state = 'sorted';
  draw();
  await sleep(100 - animationSpeed.value);
  
  // 从第二个元素开始遍历
  for (let i = 1; i < n; i++) {
    // 保存当前要插入的元素
    const current = array.value[i];
    current.state = 'selected';
    draw();
    await sleep(100 - animationSpeed.value);
    
    let j = i - 1;
    
    // 从后向前扫描已排序序列，找到插入位置
    while (j >= 0) {
      // 标记当前比较的元素
      array.value[j].state = 'comparing';
      draw();
      await sleep(100 - animationSpeed.value);
      
      if (array.value[j].value > current.value) {
        // 移动元素
        array.value[j + 1] = array.value[j];
        draw();
        await sleep(100 - animationSpeed.value);
        
        // 重置状态为已排序
        array.value[j].state = 'sorted';
      } else {
        // 重置状态为已排序
        array.value[j].state = 'sorted';
        break;
      }
      j--;
    }
    
    // 插入元素
    array.value[j + 1] = current;
    array.value[j + 1].state = 'sorted';
    draw();
    await sleep(100 - animationSpeed.value);
  }
};
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  box-sizing: border-box;
}

.control-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  width: 100%;
  max-width: 800px;
}

.buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
  width: 100%;
  flex-wrap: wrap;
}

.algorithm-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

button {
  padding: 8px 0;
  font-size: 12px;
  cursor: pointer;
  border: none;
  border-radius: 4px;
  color: white;
  transition: opacity 0.3s;
  width: 70px;
}

button:hover {
  opacity: 0.8;
}

.time-info {
  font-size: 10px;
  color: #666;
  white-space: nowrap;
}

.speed-control,
.array-size-control {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 300px;
  padding: 0 10px;
  box-sizing: border-box;
}

.range-container {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.size-value {
  min-width: 25px;
  font-size: 12px;
  color: #666;
}

canvas {
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  width: 100%;
  max-width: 100%;
  height: auto;
}

.algorithm-info {
  width: 100%;
  max-width: 800px;
  margin-top: 20px;
  padding: 15px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.algorithm-info h3 {
  color: #333;
  margin: 0 0 10px 0;
  font-size: 16px;
}

.description {
  color: #666;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 15px;
}

.complexity-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}

.complexity-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.complexity-item .label {
  color: #666;
  font-size: 12px;
}

.complexity-item .value {
  color: #333;
  font-weight: 500;
  font-size: 14px;
}

@media (max-width: 600px) {
  .container {
    padding: 10px;
  }
  
  .buttons {
    gap: 8px;
  }
  
  button {
    width: 65px;
    font-size: 11px;
  }
  
  .time-info {
    font-size: 9px;
  }
  
  .speed-control,
  .array-size-control {
    flex-direction: row;
    align-items: center;
  }
  
  .range-container {
    flex: 1;
  }
  
  input[type="range"] {
    flex: 1;
    min-width: 100px;
  }
  
  .algorithm-info {
    padding: 12px;
  }
  
  .algorithm-info h3 {
    font-size: 14px;
  }
  
  .description {
    font-size: 12px;
  }
  
  .complexity-info {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .complexity-item .label {
    font-size: 11px;
  }
  
  .complexity-item .value {
    font-size: 12px;
  }
}
</style> 