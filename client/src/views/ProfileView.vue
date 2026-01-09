<template>
  <div class="container">
    <div class="page-header">
      <h1>My Profile</h1>
      <p class="subtitle">
        Signed in as
        <span class="email">{{ user?.email }}</span>
      </p>
    </div>

    <section class="section">
      <div class="section-header">
        <h2>My Orders</h2>
        <p class="section-description">
          See all tickets you have purchased with this account.
        </p>
      </div>

      <div v-if="loading" class="state">
        Loading your orders...
      </div>

      <div v-else-if="orders.length === 0" class="state">
        <p>You have not placed any orders yet.</p>
      </div>

      <div v-else class="orders-grid">
        <div
          v-for="order in orders"
          :key="order.id"
          class="order-card"
        >
          <div class="order-header">
            <div class="order-id">Order #{{ order.id.slice(0, 8) }}</div>
          </div>

          <div class="order-meta">
            <span>{{ formatDate(order.createdAt) }}</span>
            <span>Total: {{ orderTotal(order) }} RON</span>
          </div>

          <ul class="order-products">
            <li v-for="(item, index) in order.products" :key="index">
              <div class="product-main">
                <span class="product-name">{{ item.name }}</span>
                <span class="product-meta">
                  {{ item.priceAtPurchase }} RON × {{ item.quantity }}
                </span>
              </div>
              <div
                v-if="item.activationCodes && item.activationCodes.length"
                class="product-codes"
              >
                <span class="codes-label">Codes:</span>
                <div class="codes-list">
                  <button
                    v-for="(code, codeIndex) in item.activationCodes"
                    :key="code"
                    type="button"
                    class="code-chip"
                    @click="toggleCodeVisibility(order.id, index, codeIndex)"
                  >
                    <span class="code-dot" />
                    <span class="code-text">
                      {{
                        isCodeVisible(order.id, index, codeIndex)
                          ? code
                          : 'Click to reveal'
                      }}
                    </span>
                  </button>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { auth } from '../services/firebase';
import { getMyOrders } from '../services/api';
import { useUserStore } from '../stores/user';
import { storeToRefs } from 'pinia';

const loading = ref(true);
const orders = ref([]);
const visibleCodes = ref(new Set());

const userStore = useUserStore();
const { user } = storeToRefs(userStore);

const loadOrders = async () => {
  try {
    if (!auth.currentUser) {
      loading.value = false;
      return;
    }

    const token = await auth.currentUser.getIdToken();
    orders.value = await getMyOrders(token);
  } catch (error) {
    console.error('Error loading user orders:', error);
  } finally {
    loading.value = false;
  }
};

const formatDate = (isoString) => {
  if (!isoString) return '';
  return new Date(isoString).toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const orderTotal = (order) => {
  if (!order?.products) return 0;
  return order.products.reduce(
    (sum, item) => sum + Number(item.priceAtPurchase || 0) * Number(item.quantity || 1),
    0
  );
};

const codeKey = (orderId, productIndex, codeIndex) =>
  `${orderId}:${productIndex}:${codeIndex}`;

const isCodeVisible = (orderId, productIndex, codeIndex) => {
  return visibleCodes.value.has(codeKey(orderId, productIndex, codeIndex));
};

const toggleCodeVisibility = (orderId, productIndex, codeIndex) => {
  const key = codeKey(orderId, productIndex, codeIndex);
  const next = new Set(visibleCodes.value);

  if (next.has(key)) {
    next.delete(key);
  } else {
    next.add(key);
  }

  visibleCodes.value = next;
};

onMounted(loadOrders);
</script>

<style scoped>
.page-header {
  margin-bottom: 2rem;
  text-align: center;
}

.page-header h1 {
  font-size: 2.5rem;
  color: var(--text);
  margin-bottom: 0.25rem;
}

.subtitle {
  color: var(--text-light);
  font-size: 0.95rem;
}

.subtitle .email {
  font-weight: 600;
  color: var(--primary);
}

.section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: var(--shadow);
  border: 1px solid rgba(229, 231, 235, 0.5);
}

.section-header {
  margin-bottom: 1.5rem;
}

.section-header h2 {
  font-size: 1.5rem;
  color: var(--text);
}

.section-description {
  color: var(--text-light);
  font-size: 0.9rem;
}

.state {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--text-light);
}

.orders-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.order-card {
  padding: 1.25rem 1.5rem;
  border-radius: 0.75rem;
  background: rgba(249, 250, 251, 0.9);
  border: 1px solid rgba(229, 231, 235, 0.8);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.order-id {
  font-family: monospace;
  font-size: 0.9rem;
  color: var(--text-light);
}

.status-badge {
  padding: 0.15rem 0.8rem;
  border-radius: 999px;
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 600;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.completed {
  background: #d1fae5;
  color: #065f46;
}

.order-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--text-light);
  margin-bottom: 0.75rem;
}

.order-products {
  list-style: none;
  padding: 0;
  margin: 0;
  border-top: 1px solid var(--border);
  padding-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.order-products li {
  display: flex;
  flex-direction: column;
  font-size: 0.9rem;
}

.product-name {
  font-weight: 500;
}

.product-meta {
  color: var(--text-light);
}

.product-main {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.product-codes {
  margin-top: 0.25rem;
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  flex-wrap: wrap;
}

.codes-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text);
}

.codes-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.code-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  background: #eef2ff;
  color: #3730a3;
  font-size: 0.8rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  border: none;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.1s ease;
}

.code-chip:hover {
  background: #e0e7ff;
  transform: translateY(-1px);
}

.code-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #4f46e5;
}

.code-text {
  white-space: nowrap;
}
</style>

