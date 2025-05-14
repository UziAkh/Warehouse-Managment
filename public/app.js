// DOM Elements
const productsTable = document.getElementById('productsTable');
const productsTableBody = document.getElementById('productsTableBody');
const loadingIndicator = document.getElementById('loadingIndicator');
const noProductsMessage = document.getElementById('noProducts');
const productModal = document.getElementById('productModal');
const deleteModal = document.getElementById('deleteModal');
const productForm = document.getElementById('productForm');
const modalTitle = document.getElementById('modalTitle');
const productClientSelect = document.getElementById('productClient');

// Stats Elements
const totalProductsEl = document.getElementById('totalProducts');
const totalQuantityEl = document.getElementById('totalQuantity');
const lowStockCountEl = document.getElementById('lowStockCount');

// Form Elements
const productIdInput = document.getElementById('productId');
const productNameInput = document.getElementById('productName');
const productSkuInput = document.getElementById('productSku');
const productDescriptionInput = document.getElementById('productDescription');
const productQuantityInput = document.getElementById('productQuantity');

// Buttons
const addProductBtn = document.getElementById('addProductBtn');
const emptyStateAddBtn = document.getElementById('emptyStateAddBtn');
const saveProductBtn = document.getElementById('saveProductBtn');
const cancelBtn = document.getElementById('cancelBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const closeDeleteBtn = document.getElementById('closeDeleteBtn');
const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');

// API base URL
const API_URL = '/api/products';
let products = [];
let currentProductId = null;

// Constants
const LOW_STOCK_THRESHOLD = 10;

// Event Listeners
document.addEventListener('DOMContentLoaded', fetchProducts);
addProductBtn.addEventListener('click', showAddProductModal);
if (emptyStateAddBtn) {
  emptyStateAddBtn.addEventListener('click', showAddProductModal);
}
productForm.addEventListener('submit', handleFormSubmit);
cancelBtn.addEventListener('click', closeProductModal);
document.querySelectorAll('.close-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    if (this.closest('#productModal')) {
      closeProductModal();
    } else if (this.closest('#deleteModal')) {
      closeDeleteModal();
    }
  });
});
confirmDeleteBtn.addEventListener('click', deleteProduct);
cancelDeleteBtn.addEventListener('click', closeDeleteModal);
closeDeleteBtn.addEventListener('click', closeDeleteModal);
searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keyup', function(e) {
  if (e.key === 'Enter') {
    handleSearch();
  }
});
saveProductBtn.addEventListener('click', function() {
  productForm.dispatchEvent(new Event('submit'));
});

// Functions
async function fetchProducts() {
  showLoading(true);
  try {
    const response = await fetch(PRODUCTS_API_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    products = await response.json();
    renderProducts(products);
    updateStats(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    showError('Failed to load products. Please try again later.');
  } finally {
    showLoading(false);
  }
}

// Add this to your initialize function
async function initialize() {
  await Promise.all([fetchProducts(), fetchClients()]);
}

// Add this new function
async function fetchClients() {
  try {
    const response = await fetch('/api/clients');
    if (!response.ok) {
      throw new Error('Failed to fetch clients');
    }
    const clients = await response.json();
    populateClientDropdown(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
  }
}

function populateClientDropdown(clients) {
  productClientSelect.innerHTML = '<option value="">Select a client</option>';
  
  // Sort clients by name
  clients.sort((a, b) => a.name.localeCompare(b.name));
  
  clients.forEach(client => {
    if (client.active) { // Only show active clients
      const option = document.createElement('option');
      option.value = client._id;
      option.textContent = `${client.name} (${client.code})`;
      productClientSelect.appendChild(option);
    }
  });
}

// Update the handleFormSubmit function to include client
async function handleFormSubmit(e) {
  e.preventDefault();
  
  const productData = {
    name: productNameInput.value,
    sku: productSkuInput.value,
    description: productDescriptionInput.value,
    quantity: parseInt(productQuantityInput.value),
    client: productClientSelect.value
  };
  
  if (!productData.name || !productData.sku || !productData.client) {
    showError('Please fill in all required fields');
    return;
  }
  
  const isEditing = productIdInput.value !== '';
  
  try {
    if (isEditing) {
      await updateProduct(productIdInput.value, productData);
    } else {
      await createProduct(productData);
    }
    closeProductModal();
    fetchProducts();
  } catch (error) {
    console.error('Error saving product:', error);
    showError('Failed to save product. Please try again.');
  }
}

// Update the showEditProductModal function
async function showEditProductModal(productId) {
  const product = products.find(p => p._id === productId);
  if (!product) return;
  
  productIdInput.value = product._id;
  productNameInput.value = product.name;
  productSkuInput.value = product.sku;
  productDescriptionInput.value = product.description || '';
  productQuantityInput.value = product.quantity;
  productClientSelect.value = product.client._id || product.client;
  
  modalTitle.textContent = 'Edit Product';
  productModal.classList.add('active');
}

function updateStats(productsData) {
  const totalProducts = productsData.length;
  const totalQuantity = productsData.reduce((sum, product) => sum + product.quantity, 0);
  const lowStockCount = productsData.filter(product => product.quantity <= LOW_STOCK_THRESHOLD).length;
  
  totalProductsEl.textContent = totalProducts;
  totalQuantityEl.textContent = totalQuantity;
  lowStockCountEl.textContent = lowStockCount;
}

function getStockStatus(quantity) {
  if (quantity <= 0) {
    return { class: 'out-of-stock', text: 'Out of Stock' };
  } else if (quantity <= LOW_STOCK_THRESHOLD) {
    return { class: 'low-stock', text: 'Low Stock' };
  } else {
    return { class: 'in-stock', text: 'In Stock' };
  }
}

function renderProducts(productsToRender) {
  productsTableBody.innerHTML = '';
  
  if (productsToRender.length === 0) {
    // Your existing code for empty state
    return;
  }
  
  // Your existing code
  
  productsToRender.forEach(product => {
    const row = document.createElement('tr');
    
    const updatedDate = new Date(product.updatedAt).toLocaleString();
    const stockStatus = getStockStatus(product.quantity);
    
    // Extract client information safely
    const clientName = product.client && product.client.name 
      ? product.client.name 
      : (typeof product.client === 'string' ? 'Unknown Client' : 'Unknown Client');
    
    const clientCode = product.client && product.client.code
      ? product.client.code
      : '';
    
    row.innerHTML = `
      <td><strong>${product.name}</strong></td>
      <td>${clientName} ${clientCode ? `<small>(${clientCode})</small>` : ''}</td>
      <td>${product.sku}</td>
      <td>${product.description || '-'}</td>
      <td class="quantity-cell">${product.quantity}</td>
      <td><span class="status-badge ${stockStatus.class}">${stockStatus.text}</span></td>
      <td>${updatedDate}</td>
      <td class="action-buttons">
        <button class="btn secondary icon-btn edit-btn" data-id="${product._id}" title="Edit Product">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
          </svg>
        </button>
        <button class="btn danger icon-btn delete-btn" data-id="${product._id}" title="Delete Product">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </td>
    `;
    
    productsTableBody.appendChild(row);
  });

  // Add event listeners to buttons
  // Your existing code
  
  // Add event listeners to edit and delete buttons
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => showEditProductModal(btn.dataset.id));
  });
  
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => showDeleteModal(btn.dataset.id));
  });
}

function showAddProductModal() {
  // Reset form
  productForm.reset();
  productIdInput.value = '';
  modalTitle.textContent = 'Add New Product';
  productModal.classList.add('active');
}

async function showEditProductModal(productId) {
  const product = products.find(p => p._id === productId);
  if (!product) return;
  
  productIdInput.value = product._id;
  productNameInput.value = product.name;
  productSkuInput.value = product.sku;
  productDescriptionInput.value = product.description || '';
  productQuantityInput.value = product.quantity;
  
  modalTitle.textContent = 'Edit Product';
  productModal.classList.add('active');
}

function closeProductModal() {
  productModal.classList.remove('active');
}

function showDeleteModal(productId) {
  currentProductId = productId;
  deleteModal.classList.add('active');
}

function closeDeleteModal() {
  deleteModal.classList.remove('active');
  currentProductId = null;
}

async function handleFormSubmit(e) {
  e.preventDefault();
  
  const productData = {
    name: productNameInput.value,
    sku: productSkuInput.value,
    description: productDescriptionInput.value,
    quantity: parseInt(productQuantityInput.value)
  };
  
  const isEditing = productIdInput.value !== '';
  
  try {
    if (isEditing) {
      await updateProduct(productIdInput.value, productData);
    } else {
      await createProduct(productData);
    }
    closeProductModal();
    fetchProducts();
  } catch (error) {
    console.error('Error saving product:', error);
    showError('Failed to save product. Please try again.');
  }
}

async function createProduct(productData) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(productData)
  });
  
  if (!response.ok) {
    throw new Error('Failed to create product');
  }
  
  return response.json();
}

async function updateProduct(productId, productData) {
  const response = await fetch(`${API_URL}/${productId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(productData)
  });
  
  if (!response.ok) {
    throw new Error('Failed to update product');
  }
  
  return response.json();
}

async function deleteProduct() {
  if (!currentProductId) return;
  
  try {
    const response = await fetch(`${API_URL}/${currentProductId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete product');
    }
    
    closeDeleteModal();
    fetchProducts();
  } catch (error) {
    console.error('Error deleting product:', error);
    showError('Failed to delete product. Please try again.');
  }
}

function handleSearch() {
  const searchTerm = searchInput.value.toLowerCase().trim();
  
  if (searchTerm === '') {
    renderProducts(products);
    return;
  }
  
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm) ||
    product.sku.toLowerCase().includes(searchTerm) ||
    (product.description && product.description.toLowerCase().includes(searchTerm))
  );
  
  renderProducts(filteredProducts);
}

function showLoading(isLoading) {
  if (isLoading) {
    loadingIndicator.classList.remove('hidden');
    productsTable.closest('.responsive-table').classList.add('hidden');
    noProductsMessage.classList.add('hidden');
  } else {
    loadingIndicator.classList.add('hidden');
  }
}

function showError(message) {
  // Could be improved with a toast notification system
  alert(message);
}

// Helper function to convert modal classes to active/hidden
function updateModals() {
  // Update all modals to use active class instead of hidden
  const modals = document.querySelectorAll('.modal');
  
  modals.forEach(modal => {
    if (modal.classList.contains('hidden')) {
      modal.classList.remove('hidden');
    }
  });

  // Add click handler to close modals when clicking outside content
  modals.forEach(modal => {
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        if (this.id === 'productModal') {
          closeProductModal();
        } else if (this.id === 'deleteModal') {
          closeDeleteModal();
        }
      }
    });
  });
}

// Call on page load
updateModals();