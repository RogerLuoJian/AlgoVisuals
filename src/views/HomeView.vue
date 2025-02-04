<template>
  <div class="home">
    <h1>算法可视化</h1>
    <div class="algorithm-links">
      <router-link to="/pathfinding" class="algo-link">
        <div class="algo-card">
          <h2>寻路算法</h2>
          <p>包含贪心、A*、Dijkstra、BFS等算法的可视化演示</p>
        </div>
      </router-link>
      <router-link to="/sorting" class="algo-link">
        <div class="algo-card">
          <h2>排序算法</h2>
          <p>包含冒泡、快速、归并、堆排序等算法的可视化演示</p>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.home {
  padding: 2rem;
  text-align: center;
}

.algorithm-links {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  margin-top: 2rem;
  width: 100%;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.algo-card {
  width: 100%;
  padding: 1.5rem;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.algo-link {
  text-decoration: none;
  color: inherit;
  width: 100%;
}

.algo-card:hover {
  transform: translateY(-5px);
}

h1 {
  color: #2c3e50;
  margin-bottom: 2rem;
}

h2 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

p {
  color: #666;
  line-height: 1.6;
}
</style>
