// At the beginning of the file, make sure this function is defined:
function showError(message) {
  // Create a simple modal for errors
  const errorContainer = document.createElement('div');
  errorContainer.className = 'error-modal';
  errorContainer.innerHTML = `
    <div class="error-content">
      <p>${message}</p>
      <button class="btn secondary" id="closeErrorBtn">Close</button>
    </div>
  `;
  document.body.appendChild(errorContainer);
  
  document.getElementById('closeErrorBtn').addEventListener('click', function() {
    errorContainer.remove();
  });
  
  // Auto close after 5 seconds
  setTimeout(() => {
    if (document.body.contains(errorContainer)) {
      errorContainer.remove();
    }
  }, 5000);
}

// Add this CSS to styles.css
/*
.error-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  padding: 1.5rem;
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  z-index: 1000;
}

.error-content {
  text-align: center;
}

.error-content p {
  margin-bottom: 1rem;
  color: var(--danger-color);
}
*/
// DOM Elements
const transactionsTable = document.getElementById('transactionsTable');
const transactionsTableBody = document.getElementById('transactionsTableBody');
const loadingIndicator = document.getElementById('loadingIndicator');
const noTransactionsMessage = document.getElementById('noTransactions');
const transactionModal = document.getElementById('transactionModal');
const transactionForm = document.getElementById('transactionForm');

// Stats Elements
const totalInboundEl = document.getElementById('totalInbound');
const totalOutboundEl = document.getElementById('totalOutbound');
const recentTransactionsEl = document.getElementById('recentTransactions');

// Form Elements
const transactionTypeInput = document.getElementById('transactionType');
const productSelect = document.getElementById('productSelect');
const quantityInput = document.getElementById('quantityInput');
const referenceInput = document.getElementById('referenceInput');
const notesInput = document.getElementById('notesInput');
const modalTitle = document.getElementById('modalTitle');

// Buttons
const createInboundBtn = document.getElementById('createInboundBtn');
const createOutboundBtn = document.getElementById('createOutboundBtn');
const emptyInboundBtn = document.getElementById('emptyInboundBtn');
const emptyOutboundBtn = document.getElementById('emptyOutboundBtn');
const saveTransactionBtn = document.getElementById('saveTransactionBtn');
const cancelTransactionBtn = document.getElementById('cancelTransactionBtn');
const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');
const typeFilter = document.getElementById('typeFilter');

// API URLs
const TRANSACTIONS_API_URL = '/api/transactions';
const PRODUCTS_API_URL = '/api/products';
let transactions = [];
let products = [];

// Event Listeners
document.addEventListener('DOMContentLoaded', initialize);
createInboundBtn.addEventListener('click', () => showTransactionModal('inbound'));
createOutboundBtn.addEventListener('click', () => showTransactionModal('outbound'));
if (emptyInboundBtn) emptyInboundBtn.addEventListener('click', () => showTransactionModal('inbound'));
if (emptyOutboundBtn) emptyOutboundBtn.addEventListener('click', () => showTransactionModal('outbound'));
transactionForm.addEventListener('submit', handleFormSubmit);
cancelTransactionBtn.addEventListener('click', closeTransactionModal);
document.querySelector('.close-btn').addEventListener('click', closeTransactionModal);
searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keyup', function(e) {
  if (e.key === 'Enter') {
    handleSearch();
  }
});
typeFilter.addEventListener('change', filterTransactions);
saveTransactionBtn.addEventListener('click', function() {
  transactionForm.dispatchEvent(new Event('submit'));
});

// Functions
async function initialize() {
  await Promise.all([fetchTransactions(), fetchProducts()]);
  
  // Add event handler to close modal when clicking outside
  transactionModal.addEventListener('click', function(e) {
    if (e.target === this) {
      closeTransactionModal();
    }
  });
}

async function fetchTransactions() {
  showLoading(true);
  try {
    const response = await fetch(TRANSACTIONS_API_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }
    transactions = await response.json();
    renderTransactions(transactions);
    updateStats(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    showError('Failed to load transactions. Please try again later.');
  } finally {
    showLoading(false);
  }
}

async function fetchProducts() {
  try {
    const response = await fetch(PRODUCTS_API_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    products = await response.json();
    populateProductSelect();
  } catch (error) {
    console.error('Error fetching products:', error);
    showError('Failed to load products. Please try again later.');
  }
}

function populateProductSelect() {
  productSelect.innerHTML = '<option value="">Select a product</option>';
  
  products.forEach(product => {
    const option = document.createElement('option');
    option.value = product._id;
    option.textContent = `${product.name} (${product.sku}) - ${product.quantity} in stock`;
    productSelect.appendChild(option);
  });
}

function updateStats(transactionsData) {
  const inboundTransactions = transactionsData.filter(t => t.type === 'inbound');
  const outboundTransactions = transactionsData.filter(t => t.type === 'outbound');
  const recentTransactions = transactionsData.length > 0 ? 
    transactionsData.filter(t => {
      const transactionDate = new Date(t.createdAt);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return transactionDate >= oneWeekAgo;
    }).length : 0;
  
  totalInboundEl.textContent = inboundTransactions.length;
  totalOutboundEl.textContent = outboundTransactions.length;
  recentTransactionsEl.textContent = recentTransactions;
}

function renderTransactions(transactionsToRender) {
  transactionsTableBody.innerHTML = '';
  
  if (transactionsToRender.length === 0) {
    transactionsTable.closest('.responsive-table').classList.add('hidden');
    noTransactionsMessage.classList.remove('hidden');
    return;
  }
  
  transactionsTable.closest('.responsive-table').classList.remove('hidden');
  noTransactionsMessage.classList.add('hidden');
  
  transactionsToRender.forEach(transaction => {
    const row = document.createElement('tr');
    
    const date = new Date(transaction.createdAt).toLocaleString();
    
    row.innerHTML = `
      <td>${date}</td>
      <td>
        <span class="transaction-badge ${transaction.type}">
          ${transaction.type === 'inbound' ? 'Inbound' : 'Outbound'}
        </span>
      </td>
      <td><strong>${transaction.product.name}</strong> (${transaction.product.sku})</td>
      <td class="quantity-cell">${transaction.quantity}</td>
      <td class="quantity-before">${transaction.previousQuantity}</td>
      <td class="quantity-after">${transaction.newQuantity}</td>
      <td>${transaction.reference || '-'}</td>
      <td>${transaction.notes || '-'}</td>
    `;
    
    transactionsTableBody.appendChild(row);
  });
}

function showTransactionModal(type) {
  // Reset form
  transactionForm.reset();
  transactionTypeInput.value = type;
  
  modalTitle.textContent = type === 'inbound' ? 'Record Inbound Transaction' : 'Record Outbound Transaction';
  
  // Change button color based on type
  saveTransactionBtn.className = type === 'inbound' ? 'btn primary' : 'btn danger';
  saveTransactionBtn.textContent = type === 'inbound' ? 'Record Inbound' : 'Record Outbound';
  
  transactionModal.classList.add('active');
}

function closeTransactionModal() {
  transactionModal.classList.remove('active');
}

async function handleFormSubmit(e) {
  e.preventDefault();
  
  const transactionType = transactionTypeInput.value;
  const productId = productSelect.value;
  const quantity = parseInt(quantityInput.value);
  const reference = referenceInput.value;
  const notes = notesInput.value;
  
  if (!productId || !quantity || quantity <= 0) {
    showError('Please select a product and enter a valid quantity.');
    return;
  }
  
  const transactionData = {
    productId,
    quantity,
    reference,
    notes
  };
  
  try {
    const endpoint = `${TRANSACTIONS_API_URL}/${transactionType}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(transactionData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create transaction');
    }
    
    closeTransactionModal();
    
    // Refresh data
    await Promise.all([fetchTransactions(), fetchProducts()]);
    
  } catch (error) {
    console.error('Error creating transaction:', error);
    showError(error.message || 'Failed to create transaction. Please try again.');
  }
}

function handleSearch() {
  const searchTerm = searchInput.value.toLowerCase().trim();
  
  if (searchTerm === '') {
    filterTransactions(); // Just apply type filter
    return;
  }
  
  // Apply both search and type filter
  let filteredTransactions = transactions;
  
  // First apply type filter
  const selectedType = typeFilter.value;
  if (selectedType !== 'all') {
    filteredTransactions = filteredTransactions.filter(t => t.type === selectedType);
  }
  
  // Then apply search
  filteredTransactions = filteredTransactions.filter(transaction => 
    (transaction.product.name && transaction.product.name.toLowerCase().includes(searchTerm)) ||
    (transaction.product.sku && transaction.product.sku.toLowerCase().includes(searchTerm)) ||
    (transaction.reference && transaction.reference.toLowerCase().includes(searchTerm)) ||
    (transaction.notes && transaction.notes.toLowerCase().includes(searchTerm))
  );
  
  renderTransactions(filteredTransactions);
}

function filterTransactions() {
  const selectedType = typeFilter.value;
  
  if (selectedType === 'all') {
    // If there's a search term, re-apply search
    if (searchInput.value.trim() !== '') {
      handleSearch();
      return;
    }
    renderTransactions(transactions);
    return;
  }
  
  const filteredTransactions = transactions.filter(t => t.type === selectedType);
  
  // If there's a search term, apply search to filtered results
  if (searchInput.value.trim() !== '') {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const searchFilteredTransactions = filteredTransactions.filter(transaction => 
      (transaction.product.name && transaction.product.name.toLowerCase().includes(searchTerm)) ||
      (transaction.product.sku && transaction.product.sku.toLowerCase().includes(searchTerm)) ||
      (transaction.reference && transaction.reference.toLowerCase().includes(searchTerm)) ||
      (transaction.notes && transaction.notes.toLowerCase().includes(searchTerm))
    );
    renderTransactions(searchFilteredTransactions);
    return;
  }
  
  renderTransactions(filteredTransactions);
}

function showLoading(isLoading) {
  if (isLoading) {
    loadingIndicator.classList.remove('hidden');
    transactionsTable.closest('.responsive-table').classList.add('hidden');
    noTransactionsMessage.classList.add('hidden');
  } else {
    loadingIndicator.classList.add('hidden');
  }
}

function showError(message) {
  alert(message);
}