<template>
  <div>
    <h1>Admin Panel</h1>
    <p>Doar administratorii pot vedea această pagină.</p>

    <h2>Produse</h2>

    <form @submit.prevent="addProduct">
      <input
        v-model="name"
        placeholder="Nume produs"
        required
      />

      <input
        v-model.number="price"
        type="number"
        placeholder="Preț"
        required
      />

      <select v-model="type">
        <option value="game">Game</option>
        <option value="peripheral">Peripheral</option>
      </select>

      <button type="submit">Adaugă</button>
    </form>

    <hr />

    <ul>
      <li v-for="product in products" :key="product.id">
        {{ product.name }} – {{ product.price }} lei
        <button @click="removeProduct(product.id)">Șterge</button>
      </li>
    </ul>

    <h2>Comenzi</h2>

    <ul>
      <li v-for="order in orders" :key="order.id">
        {{ order.userId }} – {{ order.status }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getProducts, createProduct, deleteProduct, getOrders } from '../services/api';
import { auth } from '../services/firebase';

const products = ref([]);
const orders = ref([]);
const name = ref('');
const price = ref('');
const type = ref('game');

const loadProducts = async () => {
  products.value = await getProducts();
};

const loadOrders = async () => {
  try {
    const token = await auth.currentUser.getIdToken();
    orders.value = await getOrders(token);
  } catch (error) {
    console.error('Eroare la încărcarea comenzilor:', error);
  }
};

const addProduct = async () => {
  const token = await auth.currentUser.getIdToken();

  await createProduct(
    {
      name: name.value,
      price: price.value,
      type: type.value
    },
    token
  );

  name.value = '';
  price.value = '';
  type.value = 'game';

  loadProducts();
};

const removeProduct = async (id) => {
  const token = await auth.currentUser.getIdToken();
  await deleteProduct(id, token);
  loadProducts();
};

onMounted(() => {
  loadProducts();
  loadOrders();
});
</script>
