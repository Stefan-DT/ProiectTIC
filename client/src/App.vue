<script setup>
import { RouterLink, RouterView } from 'vue-router';
import { useUserStore } from './stores/user';
import { storeToRefs } from 'pinia';

const userStore = useUserStore();
const { user } = storeToRefs(userStore);
</script>

<template>
  <nav class="navbar">
    <div class="nav-container">
      <div class="nav-brand">
        <RouterLink to="/">Game Store</RouterLink>
      </div>
      <div class="nav-links">
        <RouterLink to="/">Products</RouterLink>
        <RouterLink v-if="!user" to="/login">Login</RouterLink>
        <RouterLink
          v-if="user?.role === 'admin'"
          to="/admin"
          class="admin-link"
        >
          Admin
        </RouterLink>
        <span v-if="user" class="user-badge">{{ user.email }}</span>
      </div>
    </div>
  </nav>

  <main class="main-content">
    <RouterView />
  </main>
</template>

<style scoped>
.navbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: var(--shadow);
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid rgba(229, 231, 235, 0.5);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-brand a {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary);
  text-decoration: none;
  transition: color 0.2s;
}

.nav-brand a:hover {
  color: var(--primary-dark);
}

.nav-links {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.nav-links a {
  text-decoration: none;
  color: var(--text);
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.nav-links a:hover {
  background: var(--bg);
  color: var(--primary);
}

.nav-links a.router-link-exact-active {
  background: var(--primary);
  color: white;
}

.admin-link {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%) !important;
  color: white !important;
  box-shadow: 0 4px 6px -1px rgba(139, 92, 246, 0.3);
  font-weight: 600;
}

.admin-link:hover {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%) !important;
  box-shadow: 0 6px 8px -1px rgba(139, 92, 246, 0.4);
  transform: translateY(-1px);
}

.user-badge {
  padding: 0.5rem 1rem;
  background: var(--bg);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-light);
}

.main-content {
  flex: 1;
  padding: 2rem 0;
}
</style>
