import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '../stores/user';
import RegisterView from '../views/RegisterView.vue';
import LoginView from '../views/LoginView.vue';
import ProductsView from '../views/ProductsView.vue';
import AdminView from '../views/AdminView.vue';
import ProfileView from '../views/ProfileView.vue';

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
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView
  },
  { path: '/register', 
    name: 'register', 
    component: RegisterView }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const userStore = useUserStore();

  if (to.name === 'admin' && userStore.user?.role !== 'admin') {
    next('/');
  } else if (to.name === 'profile' && !userStore.user) {
    next('/login');
  } else {
    next();
  }
});

export default router;
