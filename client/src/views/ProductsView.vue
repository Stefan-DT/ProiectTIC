<template>
  <div>
    <h1>Produse</h1>

    <ul>
      <li v-for="product in products" :key="product.id">
        {{ product.name }} – {{ product.price }} lei
        <button
          v-if="user"
          @click="orderProduct(product)"
        >
          Cumpără
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getProducts, createOrder } from '../services/api';
import { auth } from '../services/firebase';
import { useUserStore } from '../stores/user';
import { storeToRefs } from 'pinia';

const products = ref([]);
const userStore = useUserStore();
const { user } = storeToRefs(userStore);

const loadProducts = async () => {
  products.value = await getProducts();
};

const orderProduct = async (product) => {
  try {
    if (!auth.currentUser) {
      alert('Trebuie să fii logat pentru a plasa o comandă');
      return;
    }

    const token = await auth.currentUser.getIdToken();

    await createOrder(
      {
        products: [
          {
            productId: product.id,
            name: product.name,
            priceAtPurchase: product.price,
            quantity: 1
          }
        ]
      },
      token
    );

    alert('Comandă plasată!');
  } catch (error) {
    alert('Eroare la plasarea comenzii');
  }
};

onMounted(loadProducts);
</script>
