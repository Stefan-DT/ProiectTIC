<template>
  <div class="container">
 

    <div class="toolbar">
      <div class="search-wrap">
        <input
          v-model="searchQuery"
          type="search"
          class="search-input"
          placeholder="Search products..."
          aria-label="Search products"
        />
      </div>
      <div class="sort-wrap">
        <label class="sort-label" for="sortPrice">Sort by price</label>
        <select id="sortPrice" v-model="priceSort" class="sort-select">
          <option value="none">None</option>
          <option value="asc">Price: Low → High</option>
          <option value="desc">Price: High → Low</option>
        </select>
      </div>
    </div>

    <div v-if="products.length === 0" class="empty-state">
      <p>No products available at the moment.</p>
    </div>

    <div v-else class="products-grid">
      <div
        v-for="product in visibleProducts"
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
        <div v-if="product.stock && product.stock.total !== undefined" class="product-stock">
          In stock: <strong>{{ product.stock.total }}</strong>
        </div>
        <div v-if="user" class="purchase-row">
          <input
            v-model.number="quantities[product.id]"
            type="number"
            min="1"
            :max="product.stock?.total ?? undefined"
            class="qty-input"
            :disabled="loading || (product.stock && product.stock.total === 0)"
          />
          <button
            @click="orderProduct(product)"
            class="btn btn-primary"
            :disabled="loading || product.stock?.total === 0"
          >
            {{ product.stock?.total === 0 ? 'Out of stock' : (loading ? 'Processing...' : 'Buy') }}
          </button>
        </div>
        <p v-else class="login-required">Log in to purchase</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import { RouterLink } from 'vue-router';
import { getProducts, createOrder } from '../services/api';
import { auth } from '../services/firebase';
import { useUserStore } from '../stores/user';
import { storeToRefs } from 'pinia';

const products = ref([]);
const loading = ref(false);
const quantities = reactive({});
const searchQuery = ref('');
const priceSort = ref('none'); // 'none' | 'asc' | 'desc'
const userStore = useUserStore();
const { user } = storeToRefs(userStore);

const visibleProducts = computed(() => {
  const q = (searchQuery.value || '').trim().toLowerCase();
  let list = Array.isArray(products.value) ? [...products.value] : [];

  if (q) {
    list = list.filter((p) => String(p?.name ?? '').toLowerCase().includes(q));
  }

  if (priceSort.value === 'asc' || priceSort.value === 'desc') {
    const dir = priceSort.value === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      const pa = Number(a?.price ?? 0);
      const pb = Number(b?.price ?? 0);
      if (Number.isNaN(pa) && Number.isNaN(pb)) return 0;
      if (Number.isNaN(pa)) return 1;
      if (Number.isNaN(pb)) return -1;
      return (pa - pb) * dir;
    });
  }

  return list;
});

const loadProducts = async () => {
  try {
    products.value = await getProducts();
    // initialize default quantity to 1 for each product
    products.value.forEach((product) => {
      if (quantities[product.id] === undefined) {
        quantities[product.id] = 1;
      }
    });
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

    const available = product.stock?.total ?? null;
    const requested = quantities[product.id] || 1;

    if (requested < 1) {
      alert('Quantity must be at least 1');
      return;
    }

    if (available !== null && requested > available) {
      alert('Not enough stock available for this product');
      return;
    }

    loading.value = true;
    const token = await auth.currentUser.getIdToken();

    const result = await createOrder(
      {
        products: [
          {
            productId: product.id,
            name: product.name,
            priceAtPurchase: product.price,
            quantity: requested
          }
        ]
      },
      token
    );

    // Backend returns remainingBudget after purchase; keep UI/store in sync.
    if (result && typeof result.remainingBudget === 'number') {
      const current = userStore.user || {};
      userStore.setUser({ ...current, budget: result.remainingBudget });
    }

    alert('Order placed successfully!');
  } catch (error) {
    if (error?.details?.reason === 'insufficient_budget') {
      const budget = Number(error.details.budget ?? 0);
      const total = Number(error.details.total ?? 0);
      const missing = Number(error.details.missing ?? Math.max(0, total - budget));

      alert(
        `Buget insuficient.\n\nBuget: ${budget} RON\nTotal comandă: ${total} RON\nÎți mai lipsesc: ${missing} RON\n\nPoți modifica bugetul din Profile.`
      );
    } else {
      const msg = error?.message || 'Error placing order';
      alert(msg);
    }
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

.header-card {
  display: inline-flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.5rem 2rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(229, 231, 235, 0.6);
  box-shadow: var(--shadow);
  backdrop-filter: blur(10px);
  max-width: 720px;
  width: min(720px, 100%);
}

.page-header h1 {
  font-size: 2.5rem;
  color: var(--text);
  margin-bottom: 0.5rem;
}

.login-prompt {
  color: var(--text-light);
  font-size: 1rem;
  margin: 0;
}

.login-prompt a {
  color: var(--primary);
  text-decoration: none;
  font-weight: 600;
}

.login-prompt a:hover {
  text-decoration: underline;
}

.toolbar {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  margin: 0 auto 1.5rem;
  max-width: 980px;
}

.search-wrap {
  flex: 1;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(229, 231, 235, 0.8);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: var(--shadow);
  backdrop-filter: blur(10px);
  font-size: 1rem;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12), var(--shadow);
}

.sort-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(229, 231, 235, 0.8);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: var(--shadow);
  backdrop-filter: blur(10px);
}

.sort-label {
  font-size: 0.9rem;
  color: var(--text-light);
  white-space: nowrap;
}

.sort-select {
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border);
  background: var(--bg);
  font-size: 0.95rem;
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

.product-stock {
  font-size: 0.9rem;
  color: var(--text-light);
  margin-bottom: 0.75rem;
}

.purchase-row {
  display: flex;
  gap: 0.75rem;
  width: 100%;
  align-items: center;
}

.qty-input {
  width: 90px;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border);
  font-size: 0.9rem;
}

.btn {
  flex: 1;
}

.login-required {
  color: var(--text-light);
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .sort-wrap {
    justify-content: space-between;
  }

  .products-grid {
    grid-template-columns: 1fr;
  }
}
</style>
