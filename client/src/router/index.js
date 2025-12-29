import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '../stores/user';

import LoginView from '../views/LoginView.vue';
import ProductsView from '../views/ProductsView.vue';
import AdminView from '../views/AdminView.vue';

const routes = [
  {
    path: '/',
    name: 'products',
    component: ProductsView
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView
  },
  {
    path: '/admin',
    name: 'admin',
    component: AdminView
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const userStore = useUserStore();

  if (to.name === 'admin' && userStore.user?.role !== 'admin') {
    next('/');
  } else {
    next();
  }
});

export default router;
