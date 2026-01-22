<template>
  <div class="container">
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1>Welcome!</h1>
          <p>Log in to continue</p>
        </div>

        <form @submit.prevent="login" class="login-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              type="email"
              v-model="email"
              placeholder="name@example.com"
              required
              :disabled="loading"
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              type="password"
              v-model="password"
              placeholder="••••••••"
              required
              :disabled="loading"
            />
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
            {{ loading ? 'Connecting...' : 'Login' }}
          </button>
        </form>
        <p>
                Not registered yet?
          <router-link to="/register">Create account</router-link>
        </p>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';
import { getCurrentUser } from '../services/api';

const email = ref('');
const password = ref('');
const error = ref(null);
const loading = ref(false);
const router = useRouter();
const userStore = useUserStore();

const login = async () => {
  error.value = null;
  loading.value = true;

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email.value,
      password.value
    );

    const token = await userCredential.user.getIdToken();

    await fetch('http://localhost:5001/api/auth/sync', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const userData = await getCurrentUser(token);
    userStore.setUser(userData);

    router.push('/');
  } catch (err) {
    error.value = 'Authentication failed. Please check your email and password.';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  padding: 2.5rem;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  border: 1px solid rgba(229, 231, 235, 0.5);
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-header h1 {
  font-size: 2rem;
  color: var(--text);
  margin-bottom: 0.5rem;
}

.login-header p {
  color: var(--text-light);
  font-size: 0.875rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: var(--text);
  font-size: 0.875rem;
}

.form-group input {
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s;
  background: var(--bg);
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-group input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  background: #fee2e2;
  color: var(--danger);
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  text-align: center;
}

.btn-block {
  width: 100%;
  margin-top: 0.5rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.3);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--primary-dark) 0%, #4338ca 100%);
  box-shadow: 0 6px 8px -1px rgba(99, 102, 241, 0.4);
  transform: translateY(-1px);
}
</style>
