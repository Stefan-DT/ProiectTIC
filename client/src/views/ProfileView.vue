<template>
  <div class="container">
    <div class="page-header">
      <h1>My Profile</h1>
      <p class="subtitle">
        Signed in as
        <span class="email">{{ user?.email }}</span>
      </p>
    </div>

    <section class="section budget-section">
      <div class="section-header">
        <h2>Budget</h2>
        <p class="section-description">
          Set your budget. It will be decreased automatically when you purchase games.
        </p>
      </div>

      <div class="budget-row">
        <div class="budget-current">
          Current budget:
          <strong>{{ displayBudget }} RON</strong>
        </div>

        <form class="budget-form" @submit.prevent="saveBudget">
          <input
            v-model.number="budgetInput"
            type="number"
            min="0"
            step="0.01"
            class="budget-input"
            placeholder="e.g. 500"
            :disabled="budgetSaving"
          />
          <button type="submit" class="btn btn-primary" :disabled="budgetSaving">
            {{ budgetSaving ? 'Saving...' : 'Save budget' }}
          </button>
        </form>
      </div>
    </section>

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
                <div class="product-left">
                  <span class="product-name">{{ item.name }}</span>
                  <button
                    type="button"
                    class="btn btn-secondary btn-xs"
                    :disabled="reviewSaving"
                    @click="openFeedback(item)"
                  >
                    Submit feedback
                  </button>
                </div>
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

    <div v-if="feedbackOpen" class="modal-overlay" @click.self="closeFeedback">
      <div class="modal">
        <div class="modal-head">
          <div class="modal-title">Submit feedback</div>
          <button type="button" class="modal-close" @click="closeFeedback" aria-label="Close">
            ✕
          </button>
        </div>

        <div class="modal-subtitle">
          Game: <strong>{{ feedbackProductName }}</strong>
        </div>

        <div class="modal-row">
          <div class="form-group">
            <label class="form-label">Rating</label>
            <select class="form-control" v-model.number="reviewRating" :disabled="reviewSaving">
              <option :value="5">5</option>
              <option :value="4">4</option>
              <option :value="3">3</option>
              <option :value="2">2</option>
              <option :value="1">1</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Comment</label>
          <textarea
            class="form-control"
            rows="4"
            v-model="reviewComment"
            placeholder="Write your feedback..."
            :disabled="reviewSaving"
          />
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" :disabled="reviewSaving" @click="closeFeedback">
            Cancel
          </button>
          <button type="button" class="btn btn-primary" :disabled="reviewSaving" @click="submitReview">
            {{ reviewSaving ? 'Submitting...' : 'Submit' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { auth } from '../services/firebase';
import { getMyOrders, getCurrentUser, updateBudget, upsertMyProductReview, getMyProductReview } from '../services/api';
import { useUserStore } from '../stores/user';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';

const loading = ref(true);
const orders = ref([]);
const visibleCodes = ref(new Set());
const budgetInput = ref(0);
const budgetSaving = ref(false);
const router = useRouter();

// Reviews (opened from orders list)
const feedbackOpen = ref(false);
const feedbackProductId = ref('');
const feedbackProductName = ref('');
const reviewRating = ref(5);
const reviewComment = ref('');
const reviewSaving = ref(false);

const userStore = useUserStore();
const { user } = storeToRefs(userStore);

watch(
  () => user.value?.budget,
  (b) => {
    const num = Number(b ?? 0);
    budgetInput.value = Number.isFinite(num) ? num : 0;
  },
  { immediate: true }
);

const displayBudget = computed(() => {
  const b = Number(user.value?.budget ?? 0);
  return Number.isFinite(b) ? b : 0;
});

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

const openFeedback = async (item) => {
  try {
    if (!auth.currentUser) return;
    feedbackProductId.value = String(item?.productId ?? '');
    feedbackProductName.value = String(item?.name ?? 'Game');
    reviewRating.value = 5;
    reviewComment.value = '';
    feedbackOpen.value = true;

    // Prefill if user already has a review
    const token = await auth.currentUser.getIdToken();
    const existing = await getMyProductReview(feedbackProductId.value, token);
    if (existing) {
      reviewRating.value = Number(existing.rating ?? 5);
      reviewComment.value = String(existing.comment ?? '');
    }
  } catch (e) {
    console.error(e);
  }
};

const closeFeedback = () => {
  if (reviewSaving.value) return;
  feedbackOpen.value = false;
};

const submitReview = async () => {
  try {
    if (!auth.currentUser) return;
    if (!feedbackProductId.value) return;

    const rating = Number(reviewRating.value);
    const comment = String(reviewComment.value || '').trim();
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      alert('Rating must be between 1 and 5.');
      return;
    }
    if (comment.length < 3) {
      alert('Please write at least 3 characters.');
      return;
    }

    reviewSaving.value = true;
    const token = await auth.currentUser.getIdToken();
    await upsertMyProductReview(feedbackProductId.value, { rating, comment }, token);

    const go = confirm('Feedback submitted!\n\nDo you want to open the reviews page for this game?');
    if (go) {
      router.push(`/products/${feedbackProductId.value}/reviews`);
    } else {
      reviewComment.value = '';
    }
    feedbackOpen.value = false;
  } catch (e) {
    console.error(e);
    alert(e?.message || 'Error submitting review');
  } finally {
    reviewSaving.value = false;
  }
};

const saveBudget = async () => {
  try {
    if (!auth.currentUser) return;

    const nextBudget = Number(budgetInput.value);
    if (!Number.isFinite(nextBudget) || nextBudget < 0) {
      alert('Budget must be a positive number');
      return;
    }

    budgetSaving.value = true;
    const token = await auth.currentUser.getIdToken();
    const { budget } = await updateBudget(nextBudget, token);

    // Refresh/store user so navbar/admin checks stay consistent.
    const userData = await getCurrentUser(token);
    userStore.setUser({ ...userData, budget });
    alert('Budget updated!');
  } catch (error) {
    console.error('Error updating budget:', error);
    alert('Error updating budget');
  } finally {
    budgetSaving.value = false;
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

.budget-section {
  margin-bottom: 1.5rem;
}

.budget-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.budget-current {
  color: var(--text);
}

.budget-form {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.budget-input {
  width: 180px;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid var(--border);
  font-size: 1rem;
  background: var(--bg);
}

.budget-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 600;
  color: var(--text);
  font-size: 0.9rem;
}

.form-control {
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid var(--border);
  font-size: 1rem;
  background: var(--bg);
}

.form-control:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

/* Submit feedback button in orders */
.product-left {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  align-items: flex-start;
}

.btn-xs {
  padding: 0.35rem 0.6rem;
  font-size: 0.85rem;
  border-radius: 0.5rem;
}

.btn-secondary {
  background: rgba(148, 163, 184, 0.25);
  color: var(--text);
  border: 1px solid rgba(148, 163, 184, 0.45);
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(148, 163, 184, 0.35);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 50;
}

.modal {
  width: min(640px, 100%);
  background: rgba(255, 255, 255, 0.98);
  border-radius: 1rem;
  border: 1px solid rgba(229, 231, 235, 0.8);
  box-shadow: 0 25px 60px rgba(15, 23, 42, 0.25);
  padding: 1.25rem;
}

.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.modal-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text);
}

.modal-close {
  border: none;
  background: transparent;
  font-size: 1.1rem;
  cursor: pointer;
  color: var(--text-light);
}

.modal-subtitle {
  color: var(--text-light);
  margin-bottom: 1rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .modal-actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }
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

