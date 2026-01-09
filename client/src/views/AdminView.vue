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
          <h3>Add New Product</h3>
          <form @submit.prevent="addProduct" class="product-form">
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
                <label>Type</label>
                <select v-model="type">
                  <option value="game">Game</option>
                  <option value="peripheral">Peripheral</option>
                </select>
              </div>
            </div>
            <div
              v-if="type === 'game'"
              class="form-group"
            >
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
            <button type="submit" class="btn btn-primary" :disabled="uploading">
              {{ uploading ? 'Uploading...' : 'Add Product' }}
            </button>
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
              <button
                @click="removeProduct(product.id)"
                class="btn btn-danger btn-sm"
              >
                Delete
              </button>
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
            </div>
            <div class="order-details">
              <div class="order-info">
                <strong>User ID:</strong> {{ order.userId }}
              </div>
              <div class="order-info">
                <strong>Date:</strong> {{ new Date(order.createdAt).toLocaleDateString('en-US') }}
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
import { getProducts, createProduct, deleteProduct, getOrders } from '../services/api';
import { auth, storage } from '../services/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

const products = ref([]);
const orders = ref([]);
const name = ref('');
const price = ref('');
const type = ref('game');
const quantity = ref(0);
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
    orders.value = await getOrders(token);
  } catch (error) {
    console.error('Error loading orders:', error);
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

const addProduct = async () => {
  try {
    uploading.value = true;
    const token = await auth.currentUser.getIdToken();

    if (quantity.value < 0) {
      alert('Quantity cannot be negative');
      uploading.value = false;
      return;
    }

    let activationCodes = [];
    if (type.value === 'game') {
      activationCodes = codesText.value
        .split('\n')
        .map(code => code.trim())
        .filter(Boolean);

      if (activationCodes.length < quantity.value) {
        alert('You must provide at least as many activation codes as the quantity.');
        uploading.value = false;
        return;
      }
    }

    let imageUrl = null;
    if (selectedImage.value) {
      imageUrl = await uploadImage(selectedImage.value);
    }

    await createProduct(
      {
        name: name.value,
        price: price.value,
        type: type.value,
        imageUrl: imageUrl,
        stock: {
          total: quantity.value
        },
        activationCodes
      },
      token
    );

    name.value = '';
    price.value = '';
    type.value = 'game';
    quantity.value = 0;
    codesText.value = '';
    clearImage();

    await loadProducts();
    alert('Product added successfully!');
  } catch (error) {
    alert('Error adding product');
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
