/**
 * 寻路算法工具类
 */
export class PathFinding {
  /**
   * 获取指定位置的相邻节点
   * @param {Object} node - 当前节点
   * @param {number} cols - 总列数
   * @param {number} rows - 总行数
   * @param {Array} obstacles - 障碍物数组
   * @returns {Array} 可行的相邻节点数组
   */
  static getNeighbors(node, cols, rows, obstacles) {
    const directions = [
      { x: 0, y: -1 }, // 上
      { x: 1, y: 0 },  // 右
      { x: 0, y: 1 },  // 下
      { x: -1, y: 0 }  // 左
    ]
    
    return directions
      .map(dir => ({
        x: node.x + dir.x,
        y: node.y + dir.y
      }))
      .filter(pos => 
        pos.x >= 0 && pos.x < cols &&
        pos.y >= 0 && pos.y < rows &&
        !obstacles.some(o => o.x === pos.x && o.y === pos.y)
      )
  }

  /**
   * 贪心算法实现
   * @param {Object} start - 起点
   * @param {Object} end - 终点
   * @param {number} cols - 总列数
   * @param {number} rows - 总行数
   * @param {Array} obstacles - 障碍物数组
   * @param {Function} onVisit - 访问节点时的回调
   * @param {Function} onExplore - 探索路径时的回调
   * @returns {Object} 包含路径和访问记录的结果对象
   */
  static async findPathGreedy(start, end, cols, rows, obstacles, onVisit, onExplore) {
    const visited = new Set()
    const stack = []
    let current = { ...start }
    let tempPath = [{ ...start }]
    let bestPath = null
    
    // 将起点加入已访问集合
    visited.add(`${current.x},${current.y}`)
    if (onVisit) onVisit(`${current.x},${current.y}`)
    
    while (!(current.x === end.x && current.y === end.y)) {
      // 获取当前位置的所有可能移动方向
      let possibleMoves = this.getNeighbors(current, cols, rows, obstacles)
      
      // 过滤掉已访问的节点
      possibleMoves = possibleMoves.filter(move => 
        !visited.has(`${move.x},${move.y}`)
      )
      
      // 计算每个可能移动位置到终点的距离
      possibleMoves.forEach(move => {
        move.distance = Math.abs(move.x - end.x) + Math.abs(move.y - end.y)
      })
      
      if (possibleMoves.length > 0) {
        // 按距离排序，选择最近的
        possibleMoves.sort((a, b) => a.distance - b.distance)
        stack.push({ ...current, path: [...tempPath] })
        
        // 更新当前位置
        current = { x: possibleMoves[0].x, y: possibleMoves[0].y }
        const currentKey = `${current.x},${current.y}`
        visited.add(currentKey)
        if (onVisit) onVisit(currentKey)
        
        tempPath.push({ ...current })
        if (onExplore) onExplore([...tempPath])
        
        // 如果找到终点，保存路径
        if (current.x === end.x && current.y === end.y) {
          bestPath = [...tempPath]
        }
      } else if (stack.length > 0) {
        // 需要回溯
        const lastState = stack.pop()
        current = { x: lastState.x, y: lastState.y }
        tempPath = [...lastState.path]
        if (onExplore) onExplore([...tempPath])
      } else {
        // 无路可走
        break
      }
      
      // 延迟以便观察
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    
    return {
      path: bestPath || [],
      visited: Array.from(visited).map(key => {
        const [x, y] = key.split(',')
        return { x: parseInt(x), y: parseInt(y) }
      })
    }
  }

  /**
   * A*算法实现
   * @param {Object} start - 起点
   * @param {Object} end - 终点
   * @param {number} cols - 总列数
   * @param {number} rows - 总行数
   * @param {Array} obstacles - 障碍物数组
   * @param {Function} onVisit - 访问节点时的回调
   * @param {Function} onExplore - 探索路径时的回调
   * @returns {Object} 包含路径和访问记录的结果对象
   */
  static async findPathAstar(start, end, cols, rows, obstacles, onVisit, onExplore) {
    const openSet = new Set([`${start.x},${start.y}`])
    const closedSet = new Set()
    const cameFrom = new Map()
    
    const gScore = new Map()
    gScore.set(`${start.x},${start.y}`, 0)
    
    const fScore = new Map()
    fScore.set(`${start.x},${start.y}`, this.heuristic(start, end))
    
    while (openSet.size > 0) {
      // 找到 f 值最小的节点
      let current = null
      let lowestFScore = Infinity
      
      for (const pos of openSet) {
        const score = fScore.get(pos)
        if (score < lowestFScore) {
          lowestFScore = score
          const [x, y] = pos.split(',')
          current = { x: parseInt(x), y: parseInt(y) }
        }
      }
      
      if (current.x === end.x && current.y === end.y) {
        // 找到路径，重建路径
        const path = []
        let curr = `${current.x},${current.y}`
        while (cameFrom.has(curr)) {
          const [x, y] = curr.split(',')
          path.unshift({ x: parseInt(x), y: parseInt(y) })
          curr = cameFrom.get(curr)
        }
        path.unshift(start)
        
        return {
          path,
          visited: Array.from(closedSet).map(key => {
            const [x, y] = key.split(',')
            return { x: parseInt(x), y: parseInt(y) }
          })
        }
      }
      
      openSet.delete(`${current.x},${current.y}`)
      closedSet.add(`${current.x},${current.y}`)
      if (onVisit) onVisit(`${current.x},${current.y}`)
      
      const neighbors = this.getNeighbors(current, cols, rows, obstacles)
      
      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x},${neighbor.y}`
        
        if (closedSet.has(neighborKey)) {
          continue
        }
        
        const tentativeGScore = gScore.get(`${current.x},${current.y}`) + 1
        
        if (!openSet.has(neighborKey)) {
          openSet.add(neighborKey)
        } else if (tentativeGScore >= gScore.get(neighborKey)) {
          continue
        }
        
        cameFrom.set(neighborKey, `${current.x},${current.y}`)
        gScore.set(neighborKey, tentativeGScore)
        fScore.set(neighborKey, tentativeGScore + this.heuristic(neighbor, end))
        
        // 重建当前探索路径
        if (onExplore) {
          const explorePath = []
          let curr = neighborKey
          while (cameFrom.has(curr)) {
            const [x, y] = curr.split(',')
            explorePath.unshift({ x: parseInt(x), y: parseInt(y) })
            curr = cameFrom.get(curr)
          }
          explorePath.unshift(start)
          onExplore(explorePath)
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    
    return { path: [], visited: [] }
  }

  /**
   * 启发式函数 - 曼哈顿距离
   * @param {Object} a - 起点
   * @param {Object} b - 终点
   * @returns {number} 估计距离
   */
  static heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
  }

  /**
   * Dijkstra算法实现
   * @param {Object} start - 起点
   * @param {Object} end - 终点
   * @param {number} cols - 总列数
   * @param {number} rows - 总行数
   * @param {Array} obstacles - 障碍物数组
   * @param {Function} onVisit - 访问节点时的回调
   * @param {Function} onExplore - 探索路径时的回调
   * @returns {Object} 包含路径和访问记录的结果对象
   */
  static async findPathDijkstra(start, end, cols, rows, obstacles, onVisit, onExplore) {
    const distances = new Map()
    const previous = new Map()
    const unvisited = new Set()
    
    // 初始化距离
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        if (!obstacles.some(o => o.x === x && o.y === y)) {
          const key = `${x},${y}`
          distances.set(key, Infinity)
          unvisited.add(key)
        }
      }
    }
    
    distances.set(`${start.x},${start.y}`, 0)
    
    while (unvisited.size > 0) {
      // 找到距离最小的未访问节点
      let current = null
      let minDistance = Infinity
      
      for (const pos of unvisited) {
        const distance = distances.get(pos)
        if (distance < minDistance) {
          minDistance = distance
          const [x, y] = pos.split(',')
          current = { x: parseInt(x), y: parseInt(y) }
        }
      }
      
      if (!current || minDistance === Infinity) {
        break // 无法到达终点
      }
      
      const currentKey = `${current.x},${current.y}`
      unvisited.delete(currentKey)
      if (onVisit) onVisit(currentKey)
      
      if (current.x === end.x && current.y === end.y) {
        // 找到终点，重建路径
        const path = []
        let curr = currentKey
        while (previous.has(curr)) {
          const [x, y] = curr.split(',')
          path.unshift({ x: parseInt(x), y: parseInt(y) })
          curr = previous.get(curr)
        }
        path.unshift(start)
        
        return {
          path,
          visited: Array.from(distances.entries())
            .filter(([_, dist]) => dist !== Infinity)
            .map(([key, _]) => {
              const [x, y] = key.split(',')
              return { x: parseInt(x), y: parseInt(y) }
            })
        }
      }
      
      // 更新邻居节点的距离
      const neighbors = this.getNeighbors(current, cols, rows, obstacles)
      
      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x},${neighbor.y}`
        if (!unvisited.has(neighborKey)) continue
        
        const newDistance = distances.get(currentKey) + 1
        if (newDistance < distances.get(neighborKey)) {
          distances.set(neighborKey, newDistance)
          previous.set(neighborKey, currentKey)
          
          // 重建当前探索路径
          if (onExplore) {
            const explorePath = []
            let curr = neighborKey
            while (previous.has(curr)) {
              const [x, y] = curr.split(',')
              explorePath.unshift({ x: parseInt(x), y: parseInt(y) })
              curr = previous.get(curr)
            }
            explorePath.unshift(start)
            onExplore(explorePath)
          }
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    
    return { path: [], visited: [] }
  }

  /**
   * BFS算法实现
   * @param {Object} start - 起点
   * @param {Object} end - 终点
   * @param {number} cols - 总列数
   * @param {number} rows - 总行数
   * @param {Array} obstacles - 障碍物数组
   * @param {Function} onVisit - 访问节点时的回调
   * @param {Function} onExplore - 探索路径时的回调
   * @returns {Object} 包含路径和访问记录的结果对象
   */
  static async findPathBFS(start, end, cols, rows, obstacles, onVisit, onExplore) {
    const queue = [start]
    const visited = new Set([`${start.x},${start.y}`])
    const previous = new Map()
    
    while (queue.length > 0) {
      const current = queue.shift()
      const currentKey = `${current.x},${current.y}`
      
      if (onVisit) onVisit(currentKey)
      
      if (current.x === end.x && current.y === end.y) {
        // 找到终点，重建路径
        const path = []
        let curr = currentKey
        while (previous.has(curr)) {
          const [x, y] = curr.split(',')
          path.unshift({ x: parseInt(x), y: parseInt(y) })
          curr = previous.get(curr)
        }
        path.unshift(start)
        
        return {
          path,
          visited: Array.from(visited).map(key => {
            const [x, y] = key.split(',')
            return { x: parseInt(x), y: parseInt(y) }
          })
        }
      }
      
      const neighbors = this.getNeighbors(current, cols, rows, obstacles)
      
      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x},${neighbor.y}`
        if (!visited.has(neighborKey)) {
          queue.push(neighbor)
          visited.add(neighborKey)
          previous.set(neighborKey, currentKey)
          
          // 重建当前探索路径
          if (onExplore) {
            const explorePath = []
            let curr = neighborKey
            while (previous.has(curr)) {
              const [x, y] = curr.split(',')
              explorePath.unshift({ x: parseInt(x), y: parseInt(y) })
              curr = previous.get(curr)
            }
            explorePath.unshift(start)
            onExplore(explorePath)
          }
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    
    return { path: [], visited: [] }
  }
} 