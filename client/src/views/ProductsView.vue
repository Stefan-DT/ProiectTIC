<template>
  <div class="container">
    <div class="page-header">
      <h1>Products</h1>
      <p v-if="!user" class="login-prompt">
        <RouterLink to="/login">Log in</RouterLink> to purchase products
      </p>
    </div>

    <div v-if="products.length === 0" class="empty-state">
      <p>No products available at the moment.</p>
    </div>

    <div v-else class="products-grid">
      <div
        v-for="product in products"
        :key="product.id"
        class="product-card"
      >
        <div v-if="product.imageUrl" class="product-image-container">
          <img :src="product.imageUrl" :alt="product.name" class="product-image" />
        </div>
        <div v-else class="product-placeholder">
          <span>No image</span>
        </div>
        <h3 class="product-name">{{ product.name }}</h3>
        <div class="product-price">{{ product.price }} RON</div>
        <button
          v-if="user"
          @click="orderProduct(product)"
          class="btn btn-primary"
          :disabled="loading"
        >
          {{ loading ? 'Processing...' : 'Buy' }}
        </button>
        <p v-else class="login-required">Log in to purchase</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { getProducts, createOrder } from '../services/api';
import { auth } from '../services/firebase';
import { useUserStore } from '../stores/user';
import { storeToRefs } from 'pinia';

const products = ref([]);
const loading = ref(false);
const userStore = useUserStore();
const { user } = storeToRefs(userStore);

const loadProducts = async () => {
  try {
    products.value = await getProducts();
  } catch (error) {
    console.error('Error loading products:', error);
  }
};

const orderProduct = async (product) => {
  try {
    if (!auth.currentUser) {
      alert('You must be logged in to place an order');
      return;
    }

    loading.value = true;
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

    alert('Order placed successfully!');
  } catch (error) {
    alert('Error placing order');
    console.error(error);
  } finally {
    loading.value = false;
  }
};

onMounted(loadProducts);
</script>

<style scoped>
.page-header {
  margin-bottom: 2rem;
  text-align: center;
}

.page-header h1 {
  font-size: 2.5rem;
  color: var(--text);
  margin-bottom: 0.5rem;
}

.login-prompt {
  color: var(--text-light);
  font-size: 1rem;
}

.login-prompt a {
  color: var(--primary);
  text-decoration: none;
  font-weight: 600;
}

.login-prompt a:hover {
  text-decoration: underline;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-light);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.product-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: var(--shadow);
  transition: all 0.3s ease;
  border: 1px solid rgba(229, 231, 235, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.product-image-container {
  width: 100%;
  height: 200px;
  margin-bottom: 1rem;
  border-radius: 0.5rem;
  overflow: hidden;
  background: rgba(249, 250, 251, 0.8);
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-placeholder {
  width: 100%;
  height: 200px;
  margin-bottom: 1rem;
  border-radius: 0.5rem;
  background: rgba(249, 250, 251, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-light);
  border: 2px dashed rgba(229, 231, 235, 0.5);
}

.product-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.5rem;
}

.product-price {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 1rem;
}

.btn {
  width: 100%;
}

.login-required {
  color: var(--text-light);
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

@media (max-width: 768px) {
  .products-grid {
    grid-template-columns: 1fr;
  }
}
</style>
