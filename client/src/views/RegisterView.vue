<template>
  <div class="auth-wrapper">
    <div class="auth-card">
      <h1 class="auth-title">Welcome!</h1>
      <p class="auth-subtitle">Create account to continue</p>

      <form @submit.prevent="register">
        <div class="form-group">
          <label class="form-label">Email</label>
          <input
            class="form-control"
            type="email"
            v-model="email"
            placeholder="name@example.com"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">Password</label>
          <input
            class="form-control"
            type="password"
            v-model="password"
            placeholder="••••••••"
            required
          />
        </div>

        <button class="btn btn-primary" style="width: 100%" type="submit" :disabled="loading">
          {{ loading ? 'Creating...' : 'Create account' }}
        </button>
      </form>

      <p class="auth-footer">
        Already registered?
        <router-link class="auth-link" to="/login">Login</router-link>
      </p>

      <p v-if="error" class="auth-error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const error = ref(null);
const loading = ref(false);
const router = useRouter();

const register = async () => {
  error.value = null;
  loading.value = true;

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email.value,
      password.value
    );

    const token = await userCredential.user.getIdToken();

    await fetch('http://localhost:5000/api/auth/sync', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    router.push('/');
  } catch (err) {
    error.value = 'Crearea contului a eșuat';
  } finally {
    loading.value = false;
  }
};
</script>
