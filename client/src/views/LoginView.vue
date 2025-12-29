<template>
  <div>
    <h1>Login</h1>

    <form @submit.prevent="login">
      <input
        type="email"
        v-model="email"
        placeholder="Email"
        required
      />

      <input
        type="password"
        v-model="password"
        placeholder="Parolă"
        required
      />

      <button type="submit">Login</button>
    </form>

    <p v-if="error">{{ error }}</p>
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
const router = useRouter();
const userStore = useUserStore();

const login = async () => {
  error.value = null;

  try {
    const userCredential = await signInWithEmailAndPassword(
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

    const userData = await getCurrentUser(token);
    userStore.setUser(userData);

    router.push('/');
  } catch (err) {
    error.value = 'Autentificare eșuată';
  }
};

</script>
