<template>
  <div>
    <h1>Produse</h1>

    <p v-if="loading">Se încarcă produsele...</p>
    <p v-if="error">{{ error }}</p>

    <ul v-if="products.length">
      <li v-for="product in products" :key="product.id">
        <strong>{{ product.name }}</strong> – {{ product.price }} lei
      </li>
    </ul>

    <p v-if="!products.length && !loading">
      Nu există produse.
    </p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getProducts } from '../services/api';

const products = ref([]);
const loading = ref(true);
const error = ref(null);

onMounted(async () => {
  try {
    products.value = await getProducts();
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});
</script>
