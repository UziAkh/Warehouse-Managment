// DOM Elements
const clientsTable = document.getElementById('clientsTable');
const clientsTableBody = document.getElementById('clientsTableBody');
const loadingIndicator = document.getElementById('loadingIndicator');
const noClientsMessage = document.getElementById('noClients');
const clientModal = document.getElementById('clientModal');
const clientProductsModal = document.getElementById('clientProductsModal');
const deleteModal = document.getElementById('deleteModal');
const clientForm = document.getElementById('clientForm');
const modalTitle = document.getElementById('modalTitle');
const clientProductsTitle = document.getElementById('clientProductsTitle');
const clientProductsTableBody = document.getElementById('clientProductsTableBody');
const noClientProducts = document.getElementById('noClientProducts');

// Stats Elements
const totalClientsEl = document.getElementById('totalClients');
const activeClientsEl = document.getElementById('activeClients');
const totalProductsEl = document.getElementById('totalProducts');

// Form Elements
const clientIdInput = document.getElementById('clientId');
const clientNameInput = document.getElementById('clientName');
const clientCodeInput = document.getElementById('clientCode');
const contactNameInput = document.getElementById('contactName');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const streetInput = document.getElementById('street');
const cityInput = document.getElementById('city');
const stateInput = document.getElementById('state');
const zipCodeInput = document.getElementById('zipCode');
const countryInput = document.getElementById('country');
const notesInput = document.getElementById('notes');
const activeInput = document.getElementById('active');

// Buttons
const addClientBtn = document.getElementById('addClientBtn');
const emptyStateAddBtn = document.getElementById('emptyStateAddBtn');
const saveClientBtn = document.getElementById('saveClientBtn');
const cancelBtn = document.getElementById('cancelBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const closeProductsBtn = document.getElementById('closeProductsBtn');
const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');

// API URLs
const CLIENTS_API_URL = '/api/clients';
const PRODUCTS_API_URL = '/api/products';

// Variables
let clients = [];
let currentClientId = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', initialize);
addClientBtn.addEventListener('click', showAddClientModal);
if (emptyStateAddBtn) {
  emptyStateAddBtn.addEventListener('click', showAddClientModal);
}
clientForm.addEventListener('submit', handleFormSubmit);
cancelBtn.addEventListener('click', closeClientModal);
document.querySelectorAll('.close-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    if (this.closest('#clientModal')) {
      closeClientModal();
    } else if (this.closest('#clientProductsModal')) {
      closeClientProductsModal();
    } else if (this.closest('#deleteModal')) {
      closeDeleteModal();
    }
  });
});
confirmDeleteBtn.addEventListener('click', deleteClient);
cancelDeleteBtn.addEventListener('click', closeDeleteModal);
closeProductsBtn.addEventListener('click', closeClientProductsModal);
searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keyup', function(e) {
  if (e.key === 'Enter') {
    handleSearch();
  }
});
saveClientBtn.addEventListener('click', function() {
  clientForm.dispatchEvent(new Event('submit'));
});

// Initialize
async function initialize() {
  await Promise.all([fetchClients(), fetchProductStats()]);
}

// API Functions
async function fetchClients() {
  showLoading(true);
  try {
    const response = await fetch(CLIENTS_API_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch clients');
    }
    clients = await response.json();
    renderClients(clients);
    updateClientStats(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    showError('Failed to load clients. Please try again later.');
  } finally {
    showLoading(false);
  }
}

async function fetchProductStats() {
  try {
    const response = await fetch(PRODUCTS_API_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    const products = await response.json();
    totalProductsEl.textContent = products.length;
  } catch (error) {
    console.error('Error fetching product stats:', error);
    totalProductsEl.textContent = '?';
  }
}

async function fetchClientProducts(clientId) {
  try {
    // Assuming your API supports filtering products by client
    const response = await fetch(`${PRODUCTS_API_URL}?client=${clientId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch client products');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching client products:', error);
    showError('Failed to load client products.');
    return [];
  }
}

// UI Functions
function updateClientStats(clientsData) {
  const totalClients = clientsData.length;
  const activeClients = clientsData.filter(client => client.active).length;
  
  totalClientsEl.textContent = totalClients;
  activeClientsEl.textContent = activeClients;
}

function renderClients(clientsToRender) {
  clientsTableBody.innerHTML = '';
  
  if (clientsToRender.length === 0) {
    clientsTable.closest('.responsive-table').classList.add('hidden');
    noClientsMessage.classList.remove('hidden');
    return;
  }
  
  clientsTable.closest('.responsive-table').classList.remove('hidden');
  noClientsMessage.classList.add('hidden');
  
  clientsToRender.forEach(client => {
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td><strong>${client.name}</strong></td>
      <td>${client.code}</td>
      <td>${client.contactName || '-'}</td>
      <td>
        ${client.email ? `<div>${client.email}</div>` : ''}
        ${client.phone ? `<div>${client.phone}</div>` : ''}
        ${!client.email && !client.phone ? '-' : ''}
      </td>
      <td>
        <span class="client-status ${client.active ? 'status-active' : 'status-inactive'}">
          ${client.active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td>
        <button class="btn secondary view-products-btn" data-id="${client._id}" data-name="${client.name}">
          <span class="product-count" id="productCount-${client._id}">0</span>
        </button>
      </td>
      <td class="client-action-btns">
        <button class="btn secondary icon-btn edit-btn" data-id="${client._id}" title="Edit Client">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
          </svg>
        </button>
        <button class="btn danger icon-btn delete-btn" data-id="${client._id}" title="Delete Client">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </td>
    `;
    
    clientsTableBody.appendChild(row);
    
    // Fetch product count for this client
    fetchClientProductCount(client._id);
  });
  
  // Add event listeners to buttons
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => showEditClientModal(btn.dataset.id));
  });
  
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => showDeleteModal(btn.dataset.id));
  });
  
  document.querySelectorAll('.view-products-btn').forEach(btn => {
    btn.addEventListener('click', () => showClientProducts(btn.dataset.id, btn.dataset.name));
  });
}

async function fetchClientProductCount(clientId) {
  try {
    const products = await fetchClientProducts(clientId);
    const countElement = document.getElementById(`productCount-${clientId}`);
    if (countElement) {
      countElement.textContent = products.length;
      if (products.length > 0) {
        countElement.classList.add('has-products');
      }
    }
  } catch (error) {
    console.error('Error fetching product count:', error);
  }
}

function showAddClientModal() {
  // Reset form
  clientForm.reset();
  clientIdInput.value = '';
  countryInput.value = 'USA'; // Default country
  activeInput.checked = true; // Default to active
  
  modalTitle.textContent = 'Add New Client';
  clientModal.classList.add('active');
}

async function showEditClientModal(clientId) {
  const client = clients.find(c => c._id === clientId);
  if (!client) return;
  
  clientIdInput.value = client._id;
  clientNameInput.value = client.name;
  clientCodeInput.value = client.code;
  contactNameInput.value = client.contactName || '';
  emailInput.value = client.email || '';
  phoneInput.value = client.phone || '';
  
  // Address fields
  if (client.address) {
    streetInput.value = client.address.street || '';
    cityInput.value = client.address.city || '';
    stateInput.value = client.address.state || '';
    zipCodeInput.value = client.address.zipCode || '';
    countryInput.value = client.address.country || 'USA';
  } else {
    streetInput.value = '';
    cityInput.value = '';
    stateInput.value = '';
    zipCodeInput.value = '';
    countryInput.value = 'USA';
  }
  
  notesInput.value = client.notes || '';
  activeInput.checked = client.active !== false;
  
  modalTitle.textContent = 'Edit Client';
  clientModal.classList.add('active');
}

function closeClientModal() {
  clientModal.classList.remove('active');
}

async function showClientProducts(clientId, clientName) {
  clientProductsTitle.textContent = `${clientName} - Products`;
  
  // Show loading state
  clientProductsTableBody.innerHTML = '<tr><td colspan="5">Loading products...</td></tr>';
  clientProductsModal.classList.add('active');
  
  try {
    const products = await fetchClientProducts(clientId);
    
    if (products.length === 0) {
      clientProductsTableBody.innerHTML = '';
      document.getElementById('clientProductsTable').classList.add('hidden');
      document.getElementById('noClientProducts').classList.remove('hidden');
      return;
    }
    
    document.getElementById('clientProductsTable').classList.remove('hidden');
    document.getElementById('noClientProducts').classList.add('hidden');
    
    clientProductsTableBody.innerHTML = '';
    
    products.forEach(product => {
      const row = document.createElement('tr');
      
      // Determine stock status
      const stockStatus = getStockStatus(product.quantity);
      
      row.innerHTML = `
        <td><strong>${product.name}</strong></td>
        <td>${product.sku}</td>
        <td>${product.upc || '-'}</td>
        <td>${product.quantity}</td>
        <td><span class="status-badge ${stockStatus.class}">${stockStatus.text}</span></td>
      `;
      
      clientProductsTableBody.appendChild(row);
    });
    
  } catch (error) {
    console.error('Error loading client products:', error);
    clientProductsTableBody.innerHTML = '<tr><td colspan="5">Error loading products</td></tr>';
  }
}

function getStockStatus(quantity) {
  if (quantity <= 0) {
    return { class: 'out-of-stock', text: 'Out of Stock' };
  } else if (quantity <= 10) {
    return { class: 'low-stock', text: 'Low Stock' };
  } else {
    return { class: 'in-stock', text: 'In Stock' };
  }
}

function closeClientProductsModal() {
  clientProductsModal.classList.remove('active');
}

function showDeleteModal(clientId) {
  currentClientId = clientId;
  deleteModal.classList.add('active');
}

function closeDeleteModal() {
  deleteModal.classList.remove('active');
  currentClientId = null;
}

async function handleFormSubmit(e) {
  e.preventDefault();
  
  const clientData = {
    name: clientNameInput.value,
    code: clientCodeInput.value.toUpperCase(),
    contactName: contactNameInput.value,
    email: emailInput.value,
    phone: phoneInput.value,
    address: {
      street: streetInput.value,
      city: cityInput.value,
      state: stateInput.value,
      zipCode: zipCodeInput.value,
      country: countryInput.value
    },
    notes: notesInput.value,
    active: activeInput.checked
  };
  
  if (!clientData.name || !clientData.code) {
    showError('Client name and code are required');
    return;
  }
  
  const isEditing = clientIdInput.value !== '';
  
  try {
    if (isEditing) {
      await updateClient(clientIdInput.value, clientData);
    } else {
      await createClient(clientData);
    }
    closeClientModal();
    await fetchClients();
  } catch (error) {
    console.error('Error saving client:', error);
    showError('Failed to save client. ' + error.message);
  }
}

async function createClient(clientData) {
  const response = await fetch(CLIENTS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(clientData)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create client');
  }
  
  return response.json();
}

async function updateClient(clientId, clientData) {
  const response = await fetch(`${CLIENTS_API_URL}/${clientId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(clientData)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update client');
  }
  
  return response.json();
}

async function deleteClient() {
  if (!currentClientId) return;
  
  try {
    const response = await fetch(`${CLIENTS_API_URL}/${currentClientId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete client');
    }
    
    closeDeleteModal();
    await fetchClients();
  } catch (error) {
    console.error('Error deleting client:', error);
    showError('Failed to delete client. ' + error.message);
  }
}

function handleSearch() {
  const searchTerm = searchInput.value.toLowerCase().trim();
  
  if (searchTerm === '') {
    renderClients(clients);
    return;
  }
  
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm) ||
    client.code.toLowerCase().includes(searchTerm) ||
    (client.contactName && client.contactName.toLowerCase().includes(searchTerm)) ||
    (client.email && client.email.toLowerCase().includes(searchTerm)) ||
    (client.phone && client.phone.toLowerCase().includes(searchTerm))
  );
  
  renderClients(filteredClients);
}

function showLoading(isLoading) {
  if (isLoading) {
    loadingIndicator.classList.remove('hidden');
    clientsTable.closest('.responsive-table').classList.add('hidden');
    noClientsMessage.classList.add('hidden');
  } else {
    loadingIndicator.classList.add('hidden');
  }
}

function showError(message) {
  alert(message);
}