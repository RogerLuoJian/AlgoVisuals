import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import PathFindingView from '../views/PathFindingView.vue'
import SortingView from '../views/SortingView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/pathfinding',
      name: 'pathfinding',
      component: PathFindingView
    },
    {
      path: '/sorting',
      name: 'sorting',
      component: SortingView
    }
  ]
})

export default router
