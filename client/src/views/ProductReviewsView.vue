<template>
  <div class="container">
    <div class="page-header">
      <h1>Reviews</h1>
      <p class="subtitle">
        <RouterLink to="/">← Back to products</RouterLink>
      </p>
    </div>

    <section class="section">
      <div v-if="loading" class="state">Loading reviews...</div>

      <div v-else>
        <div class="product-head">
          <div class="product-title">{{ product?.name || 'Product' }}</div>
          <div class="product-meta">
            <span class="avg">
              Average rating: <strong>{{ averageRating }}</strong>/5
            </span>
            <span class="count">({{ reviews.length }} reviews)</span>
          </div>
        </div>

        <div v-if="reviews.length === 0" class="empty">
          No reviews yet.
        </div>

        <div v-else class="reviews-list">
          <article v-for="r in reviews" :key="r.id" class="review-card">
            <div class="review-head">
              <div class="rating">
                <span class="stars" aria-hidden="true">{{ stars(r.rating) }}</span>
                <span class="rating-num">{{ r.rating }}/5</span>
              </div>
              <div class="byline">
                <span class="author">{{ authorLabel(r) }}</span>
                <span class="dot">•</span>
                <span class="date">{{ formatDate(r.createdAt || r.updatedAt) }}</span>
              </div>
            </div>

            <p class="comment">{{ r.comment }}</p>
          </article>
        </div>
      </div>
    </section>

    <p class="hint">
      You can submit a review from your <RouterLink to="/profile">Profile</RouterLink> only after purchasing the game.
    </p>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { getProduct, getProductReviews } from '../services/api';

const route = useRoute();
const productId = computed(() => String(route.params.id));

const loading = ref(true);
const product = ref(null);
const reviews = ref([]);

const averageRating = computed(() => {
  if (!reviews.value.length) return 0;
  const sum = reviews.value.reduce((s, r) => s + Number(r.rating || 0), 0);
  return Number((sum / reviews.value.length).toFixed(2));
});

const stars = (rating) => {
  const r = Math.max(0, Math.min(5, Number(rating || 0)));
  return '★★★★★'.slice(0, r) + '☆☆☆☆☆'.slice(0, 5 - r);
};

const authorLabel = (r) => {
  const email = r?.userEmail;
  if (!email) return 'Anonymous';
  return String(email).split('@')[0];
};

const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const load = async () => {
  try {
    loading.value = true;
    product.value = await getProduct(productId.value);
    reviews.value = await getProductReviews(productId.value);
  } catch (e) {
    console.error(e);
    reviews.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(load);
</script>

<style scoped>
.page-header {
  margin-bottom: 1.5rem;
  text-align: center;
}

.subtitle a {
  color: var(--primary);
  text-decoration: none;
  font-weight: 600;
}

.subtitle a:hover {
  text-decoration: underline;
}

.section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: var(--shadow);
  border: 1px solid rgba(229, 231, 235, 0.5);
}

.state {
  text-align: center;
  color: var(--text-light);
}

.product-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(229, 231, 235, 0.8);
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.product-title {
  font-weight: 800;
  font-size: 1.25rem;
  color: var(--text);
}

.product-meta {
  color: var(--text-light);
  font-size: 0.95rem;
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.review-card {
  border: 1px solid rgba(229, 231, 235, 0.8);
  background: rgba(249, 250, 251, 0.9);
  border-radius: 0.75rem;
  padding: 1rem 1.25rem;
}

.review-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: baseline;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}

.rating {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
}

.stars {
  color: #f59e0b;
  letter-spacing: 1px;
}

.rating-num {
  color: var(--text-light);
  font-size: 0.9rem;
}

.byline {
  color: var(--text-light);
  font-size: 0.85rem;
  display: inline-flex;
  gap: 0.4rem;
  align-items: center;
}

.dot {
  opacity: 0.6;
}

.comment {
  margin: 0;
  color: var(--text);
  line-height: 1.4;
  white-space: pre-wrap;
}

.empty {
  text-align: center;
  color: var(--text-light);
  padding: 2rem 0;
}

.hint {
  margin-top: 1rem;
  text-align: center;
  color: var(--text-light);
}

.hint a {
  color: var(--primary);
  text-decoration: none;
  font-weight: 600;
}

.hint a:hover {
  text-decoration: underline;
}
</style>

