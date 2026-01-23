<template>
  <div class="container">
    <div class="admin-header">
      <h1>Admin Panel</h1>
      <p class="admin-subtitle">Administration Dashboard</p>
    </div>

    <div class="admin-sections">
      <section class="admin-section">
        <div class="section-header">
          <h2>Product Management</h2>
        </div>

        <div class="add-product-card">
          <h3>{{ editingId ? 'Edit Product' : 'Add New Product' }}</h3>
          <form @submit.prevent="submitProduct" class="product-form">
            <div class="form-row">
              <div class="form-group">
                <label>Product Name</label>
                <input
                  v-model="name"
                  placeholder="Ex: Call of Duty"
                  required
                />
              </div>
              <div class="form-group">
                <label>Price (RON)</label>
                <input
                  v-model.number="price"
                  type="number"
                  step="0.01"
                  placeholder="99.99"
                  required
                />
              </div>
              <div class="form-group">
                <label>Quantity</label>
                <input
                  v-model.number="quantity"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="10"
                  required
                />
              </div>
              <div class="form-group">
                <label>Genre</label>
                <select v-model="genre">
                  <option v-for="g in GENRES" :key="g" :value="g">
                    {{ g }}
                  </option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>Activation Codes (one per line)</label>
              <textarea
                v-model="codesText"
                rows="4"
                placeholder="CODE-1234-ABCD&#10;CODE-5678-EFGH"
              />
              <small class="help-text">
                You must provide at least as many codes as the quantity set above.
              </small>
            </div>
            <div class="form-group">
              <label>Product Image</label>
              <input
                type="file"
                accept="image/*"
                @change="handleImageSelect"
                ref="fileInput"
              />
              <div v-if="imagePreview" class="image-preview">
                <img :src="imagePreview" alt="Preview" />
                <button type="button" @click="clearImage" class="btn btn-danger btn-sm">Remove image</button>
              </div>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="uploading">
                {{
                  uploading
                    ? 'Uploading...'
                    : (editingId ? 'Update Product' : 'Add Product')
                }}
              </button>
              <button
                v-if="editingId"
                type="button"
                class="btn btn-secondary"
                :disabled="uploading"
                @click="cancelEdit"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        <div class="products-list">
          <h3>Existing Products ({{ products.length }})</h3>
          <div v-if="products.length === 0" class="empty-state">
            <p>No products available.</p>
          </div>
          <div v-else class="products-grid">
            <div
              v-for="product in products"
              :key="product.id"
              class="product-item"
            >
              <div class="product-info">
                <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" class="product-thumbnail" />
                <div class="product-details">
                  <div class="product-name">{{ product.name }}</div>
                  <div class="product-price">{{ product.price }} RON</div>
                  <div v-if="product.stock?.total !== undefined" class="product-stock">
                    In stock: {{ product.stock.total }}
                  </div>
                </div>
              </div>
              <div class="product-actions">
                <button
                  type="button"
                  class="btn btn-secondary btn-sm"
                  @click="startEdit(product)"
                >
                  Edit
                </button>
                <button
                  type="button"
                  @click="removeProduct(product.id)"
                  class="btn btn-danger btn-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="admin-section">
        <div class="section-header">
          <h2>Orders ({{ orders.length }})</h2>
        </div>

        <div v-if="orders.length === 0" class="empty-state">
          <p>No orders available.</p>
        </div>
        <div v-else class="orders-list">
          <div
            v-for="order in orders"
            :key="order.id"
            class="order-card"
          >
            <div class="order-header">
              <div class="order-id">#{{ order.id.slice(0, 8) }}</div>
              <div class="order-status">
                <span class="status-badge" :class="(order.status || 'pending')">
                  {{ order.status || 'pending' }}
                </span>
                <select
                  v-model="order.status"
                  class="status-select"
                  :disabled="statusSavingId === order.id"
                >
                  <option value="pending">pending</option>
                  <option value="processing">processing</option>
                  <option value="completed">completed</option>
                  <option value="cancelled">cancelled</option>
                </select>
                <button
                  type="button"
                  class="btn btn-primary btn-sm"
                  :disabled="statusSavingId === order.id"
                  @click="saveOrderStatus(order)"
                >
                  {{ statusSavingId === order.id ? 'Saving...' : 'Save' }}
                </button>
              </div>
            </div>
            <div class="order-details">
              <div class="order-info">
                <strong>User ID:</strong> {{ order.userId }}
              </div>
              <div class="order-info">
                <strong>Date:</strong> {{ new Date(order.createdAt).toLocaleDateString('en-US') }}
              </div>
              <div v-if="order.total !== undefined" class="order-info">
                <strong>Total:</strong> {{ order.total }} RON
              </div>
              <div class="order-products">
                <strong>Products:</strong>
                <ul>
                  <li v-for="(item, idx) in order.products" :key="idx">
                    {{ item.name }} - {{ item.priceAtPurchase }} RON (x{{ item.quantity }})
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getProducts, createProduct, updateProduct, deleteProduct, getOrders, updateOrderStatus } from '../services/api';
import { auth, storage } from '../services/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

const GENRES = [
  'Action',
  'Adventure',
  'RPG',
  'Shooter',
  'Strategy',
  'Simulation',
  'Racing',
  'Sports',
  'Indie',
  'Open World',
  'Horror',
  'Multiplayer'
];

const products = ref([]);
const orders = ref([]);
const statusSavingId = ref(null);
const editingId = ref(null);
const name = ref('');
const price = ref('');
const quantity = ref(0);
const genre = ref(GENRES[0]);
const codesText = ref('');
const uploading = ref(false);
const selectedImage = ref(null);
const imagePreview = ref(null);
const fileInput = ref(null);

const loadProducts = async () => {
  try {
    products.value = await getProducts();
  } catch (error) {
    console.error('Error loading products:', error);
  }
};

const loadOrders = async () => {
  try {
    const token = await auth.currentUser.getIdToken();
    const data = await getOrders(token);
    // newest first
    orders.value = (Array.isArray(data) ? data : []).sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
  } catch (error) {
    console.error('Error loading orders:', error);
  }
};

const saveOrderStatus = async (order) => {
  try {
    if (!auth.currentUser) return;
    statusSavingId.value = order.id;
    const token = await auth.currentUser.getIdToken();
    await updateOrderStatus(order.id, order.status || 'pending', token);
    await loadOrders();
  } catch (error) {
    console.error('Error updating order status:', error);
    alert('Error updating order status');
  } finally {
    statusSavingId.value = null;
  }
};

const handleImageSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      alert('Image is too large. Maximum 5MB.');
      return;
    }
    selectedImage.value = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

const clearImage = () => {
  selectedImage.value = null;
  imagePreview.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const uploadImage = async (file) => {
  if (!auth.currentUser) {
    throw new Error('User is not authenticated');
  }

  try {
    console.log('Authenticated user:', auth.currentUser.uid);
    console.log('File type:', file.type);
    console.log('File size:', file.size);
    
    const fileName = `products/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    console.log('File name:', fileName);
    
    const imageRef = storageRef(storage, fileName);
    
    const metadata = {
      contentType: file.type || 'image/jpeg',
    };
    
    console.log('Starting upload...');
    await uploadBytes(imageRef, file, metadata);
    console.log('Upload successful, getting URL...');
    
    const downloadURL = await getDownloadURL(imageRef);
    console.log('URL obtained:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

const resetForm = () => {
  editingId.value = null;
  name.value = '';
  price.value = '';
  quantity.value = 0;
  genre.value = GENRES[0];
  codesText.value = '';
  clearImage();
};

const startEdit = (product) => {
  editingId.value = product.id;
  name.value = product.name ?? '';
  price.value = product.price ?? '';
  quantity.value = product.stock?.total ?? 0;
  genre.value = product.category?.name || GENRES[0];

  const codes = Array.isArray(product.activationCodes)
    ? product.activationCodes
    : [];
  codesText.value = codes.join('\n');

  // show existing image (optional); user can upload a new one to replace
  imagePreview.value = product.imageUrl || null;
  selectedImage.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const cancelEdit = () => {
  resetForm();
};

const submitProduct = async () => {
  try {
    uploading.value = true;
    const token = await auth.currentUser.getIdToken();

    if (quantity.value < 0) {
      alert('Quantity cannot be negative');
      uploading.value = false;
      return;
    }

    const activationCodes = codesText.value
      .split('\n')
      .map((code) => code.trim())
      .filter(Boolean);

    // Since we only sell virtual games, codes are required at least for "add".
    // For edit mode you might have fewer codes left after sales, so we keep it strict only on add.
    if (!editingId.value && activationCodes.length < quantity.value) {
      alert('You must provide at least as many activation codes as the quantity.');
      uploading.value = false;
      return;
    }

    let imageUrl = null;
    if (selectedImage.value) {
      imageUrl = await uploadImage(selectedImage.value);
    } else if (editingId.value) {
      // keep existing image if user didn't pick a new one
      imageUrl = imagePreview.value || null;
    }

    const payload = {
      name: name.value,
      price: price.value,
      type: 'game',
      category: {
        id: `genre_${String(genre.value || 'general')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')}`,
        name: genre.value || 'General'
      },
      imageUrl,
      stock: { total: quantity.value },
      activationCodes
    };

    if (editingId.value) {
      await updateProduct(editingId.value, payload, token);
      alert('Product updated successfully!');
    } else {
      await createProduct(payload, token);
      alert('Product added successfully!');
    }

    resetForm();

    await loadProducts();
  } catch (error) {
    alert(editingId.value ? 'Error updating product' : 'Error adding product');
    console.error(error);
  } finally {
    uploading.value = false;
  }
};

const removeProduct = async (id) => {
  if (!confirm('Are you sure you want to delete this product?')) {
    return;
  }

  try {
    const token = await auth.currentUser.getIdToken();
    await deleteProduct(id, token);
    await loadProducts();
    alert('Product deleted successfully!');
  } catch (error) {
    alert('Error deleting product');
    console.error(error);
  }
};

onMounted(() => {
  loadProducts();
  loadOrders();
});
</script>

<style scoped>
.admin-header {
  text-align: center;
  margin-bottom: 3rem;
}

.admin-header h1 {
  font-size: 2.75rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #ffffff;
  margin-bottom: 0.25rem;
  text-shadow: 0 18px 45px rgba(15, 23, 42, 0.6);
}

.admin-subtitle {
  color: rgba(241, 245, 249, 0.9);
  font-size: 1.05rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.admin-sections {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.admin-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: var(--shadow);
  border: 1px solid rgba(229, 231, 235, 0.5);
}

.section-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--border);
}

.section-header h2 {
  font-size: 1.5rem;
  color: var(--text);
}

.add-product-card {
  background: rgba(249, 250, 251, 0.8);
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.add-product-card h3 {
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: var(--text);
}

.product-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--text);
}

.form-group input,
.form-group select {
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  font-size: 1rem;
  background: var(--bg-card);
  transition: all 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.products-list h3 {
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: var(--text);
}

.products-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.product-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(249, 250, 251, 0.8);
  border-radius: 0.5rem;
  border: 1px solid rgba(229, 231, 235, 0.5);
}

.product-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.btn-secondary {
  background: rgba(148, 163, 184, 0.25);
  color: var(--text);
  border: 1px solid rgba(148, 163, 184, 0.45);
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(148, 163, 184, 0.35);
}

.product-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.product-thumbnail {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 0.5rem;
}

.product-details {
  display: flex;
  flex-direction: column;
}

.image-preview {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-start;
}

.image-preview img {
  max-width: 200px;
  max-height: 200px;
  border-radius: 0.5rem;
  border: 1px solid var(--border);
}

.product-name {
  font-weight: 600;
  color: var(--text);
}

.product-price {
  color: var(--primary);
  font-weight: 600;
}


.orders-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.order-card {
  background: rgba(249, 250, 251, 0.8);
  border-radius: 0.75rem;
  padding: 1.5rem;
  border: 1px solid rgba(229, 231, 235, 0.5);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border);
}

.order-id {
  font-family: monospace;
  font-weight: 600;
  color: var(--text-light);
}

.order-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.status-select {
  padding: 0.35rem 0.6rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border);
  background: var(--bg);
  font-size: 0.9rem;
}

.status-badge.cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge.processing {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.completed {
  background: #d1fae5;
  color: #065f46;
}

.order-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.order-info {
  color: var(--text);
  font-size: 0.875rem;
}

.order-products {
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border);
}

.order-products ul {
  margin-top: 0.5rem;
  margin-left: 1.5rem;
  color: var(--text-light);
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-light);
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
