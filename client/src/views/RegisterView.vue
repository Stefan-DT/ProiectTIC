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
            @blur="validateEmail"
          />
          <small v-if="emailError" class="field-error">{{ emailError }}</small>
        </div>

        <div class="form-group">
          <label class="form-label">Password</label>
          <input
            class="form-control"
            type="password"
            v-model="password"
            placeholder="••••••••"
            required
            @blur="validatePassword"
            @input="checkPasswordStrength"
          />
          <small class="password-hints">
            Password must contain
            <span :class="{ 'hint-valid': hasCapital }">• Capital letter</span>
            <span :class="{ 'hint-valid': hasNumber }">• Number</span>
            <span :class="{ 'hint-valid': hasSpecial }">• Special character</span>
            <span :class="{ 'hint-valid': hasMinLength }">• Minimum 6 characters</span>
          </small>
          <small v-if="passwordError" class="field-error">{{ passwordError }}</small>
        </div>

        <button class="btn btn-primary" style="width: 100%" type="submit" :disabled="loading || !isFormValid">
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
import { ref, computed } from 'vue';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useRouter } from 'vue-router';
import { syncUser } from '../services/api';

const email = ref('');
const password = ref('');
const error = ref(null);
const emailError = ref(null);
const passwordError = ref(null);
const loading = ref(false);
const router = useRouter();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const hasCapital = computed(() => /[A-Z]/.test(password.value));
const hasNumber = computed(() => /\d/.test(password.value));
const hasSpecial = computed(() => /[!@#$%^&*(),.?":{}|<>]/.test(password.value));
const hasMinLength = computed(() => password.value.length >= 6);

const isFormValid = computed(() => {
  return email.value && 
         password.value && 
         !emailError.value && 
         !passwordError.value &&
         hasCapital.value &&
         hasNumber.value &&
         hasSpecial.value &&
         hasMinLength.value;
});

const validateEmail = () => {
  emailError.value = null;
  if (!email.value) return;
  
  if (!emailRegex.test(email.value)) {
    emailError.value = 'Format email invalid. example: nume@domeniu.com';
    return false;
  }
  return true;
};

const validatePassword = () => {
  passwordError.value = null;
  if (!password.value) return;
  
  const errors = [];

if (password.value.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  if (!hasCapital.value) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!hasNumber.value) {
    errors.push('Password must contain at least one number');
  }
  if (!hasSpecial.value) {
    errors.push('Password must contain at least one special character (!@#$%^&* etc.)');
  }
  
  if (errors.length > 0) {
    passwordError.value = errors[0];
    return false;
  }
  return true;
};

const checkPasswordStrength = () => {
  if (password.value) {
    validatePassword();
  }
};

const getFirebaseErrorMessage = (errorCode) => {
  const messages = {
      'auth/email-already-in-use': 'This email is already registered. Please log in instead.',
      'auth/invalid-email': 'Invalid email format. Please enter a valid email address.',
      'auth/weak-password': 'Password is too weak. It must be at least 6 characters long and include an uppercase letter, a number, and a special character.',
      'auth/operation-not-allowed': 'This operation is not allowed. Please contact support.',
      'auth/network-request-failed': 'Network error. Please check your internet connection.'
    };
  
  return messages[errorCode] || 'Create account failed. try again';
};

const register = async () => {
  error.value = null;
  emailError.value = null;
  passwordError.value = null;
  
  if (!validateEmail() || !validatePassword()) {
    return;
  }
  
  loading.value = true;

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email.value,
      password.value
    );

    const token = await userCredential.user.getIdToken();

    await syncUser(token);

    router.push('/');
  } catch (err) {
    const errorMsg = getFirebaseErrorMessage(err.code);
    error.value = errorMsg;
    
    if (err.code === 'auth/invalid-email') {
      emailError.value = 'Format email invalid';
    } else if (err.code === 'auth/weak-password') {
      passwordError.value = 'Password too weak';
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.field-error {
  display: block;
  color: #dc2626;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.password-hints {
  display: block;
  font-size: 0.8rem;
  color: #6b7280;
  margin-top: 0.5rem;
  line-height: 1.6;
}

.password-hints span {
  display: inline-block;
  margin-right: 0.75rem;
  color: #9ca3af;
}

.password-hints .hint-valid {
  color: #10b981;
  font-weight: 600;
}

.form-control:invalid {
  border-color: #dc2626;
}

.form-control:valid:not(:placeholder-shown) {
  border-color: #10b981;
}
</style>
