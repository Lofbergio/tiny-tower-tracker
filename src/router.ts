import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from './views/Dashboard.vue'
import Missions from './views/Missions.vue'
import Residents from './views/Residents.vue'
import Stores from './views/Stores.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: Dashboard,
    },
    {
      path: '/missions',
      name: 'missions',
      component: Missions,
    },
    {
      path: '/residents',
      name: 'residents',
      component: Residents,
    },
    {
      path: '/stores',
      name: 'stores',
      component: Stores,
    },
  ],
})

export default router
