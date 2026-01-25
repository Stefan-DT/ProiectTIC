const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

export const syncUser = async (token) => {
  const response = await fetch(`${API_BASE_URL}/auth/sync`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Error syncing user');
  }

  return response.json();
};

export const getProducts = async () => {
  const response = await fetch(`${API_BASE_URL}/products`);

  if (!response.ok) {
    throw new Error('Error fetching products');
  }

  return response.json();
};

export const getProduct = async (productId) => {
  const response = await fetch(`${API_BASE_URL}/products/${productId}`);
  if (!response.ok) {
    throw new Error('Error fetching product');
  }
  return response.json();
};

export const getProductReviews = async (productId) => {
  const response = await fetch(`${API_BASE_URL}/products/${productId}/reviews`);
  if (!response.ok) {
    throw new Error('Error fetching reviews');
  }
  return response.json();
};

export const getMyProductReview = async (productId, token) => {
  const response = await fetch(`${API_BASE_URL}/products/${productId}/reviews/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Error fetching your review');
  }

  return response.json();
};

export const upsertMyProductReview = async (productId, { rating, comment }, token) => {
  const response = await fetch(`${API_BASE_URL}/products/${productId}/reviews/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ rating, comment })
  });

  if (!response.ok) {
    let body = null;
    try {
      body = await response.json();
    } catch (_) {
      body = null;
    }
    throw new Error(body?.message || 'Error submitting review');
  }

  return response.json();
};

export const getCurrentUser = async (token) => {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Could not get user');
  }

  return response.json();
};

export const updateBudget = async (budget, token) => {
  const response = await fetch(`${API_BASE_URL}/auth/me/budget`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ budget })
  });

  if (!response.ok) {
    throw new Error('Error updating budget');
  }

  return response.json(); 
};

export const createProduct = async (product, token) => {
  const response = await fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(product)
  });

  if (!response.ok) {
    throw new Error('Error creating product');
  }

  return response.json();
};

export const updateProduct = async (id, product, token) => {
  const response = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(product)
  });

  if (!response.ok) {
    throw new Error('Error updating product');
  }

  return response.json();
};

export const deleteProduct = async (id, token) => {
  const response = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Error deleting product');
  }
};

export const createOrder = async (orderData, token) => {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(orderData)
  });

  if (!response.ok) {
    let body = null;
    try {
      body = await response.json();
    } catch (_) {
      body = null;
    }

    const err = new Error(body?.message || 'Error creating order');
    if (body?.details) err.details = body.details;
    err.status = response.status;
    throw err;
  }

  return response.json();
};

export const getOrders = async (token) => {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Error fetching orders');
  }

  return response.json();
};

export const updateOrderStatus = async (orderId, status, token) => {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });

  if (!response.ok) {
    throw new Error('Error updating order status');
  }

  return response.json();
};

export const getMyOrders = async (token) => {
  const response = await fetch(`${API_BASE_URL}/orders/my`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Error fetching user orders');
  }

  return response.json();
};