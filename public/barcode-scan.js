// DOM Elements
const startSessionBtn = document.getElementById('startSessionBtn');
const endSessionBtn = document.getElementById('endSessionBtn');
const upcInput = document.getElementById('upcInput');
const scannerStatus = document.querySelector('.scanner-status');
const scannedItemsTable = document.getElementById('scannedItemsTable');
const scannedItemsTableBody = document.getElementById('scannedItemsTableBody');
const noItemsScanned = document.getElementById('noItemsScanned');
const sessionStatus = document.getElementById('sessionStatus');
const itemsScannedCount = document.getElementById('itemsScanned');
const totalQuantityCount = document.getElementById('totalQuantity');
const clearItemsBtn = document.getElementById('clearItemsBtn');
const saveAllBtn = document.getElementById('saveAllBtn');

// New Product Modal Elements
const newProductModal = document.getElementById('newProductModal');
const newUpcDisplay = document.getElementById('newUpcDisplay');
const newProductName = document.getElementById('newProductName');
const newProductSku = document.getElementById('newProductSku');
const newProductDescription = document.getElementById('newProductDescription');
const saveNewProductBtn = document.getElementById('saveNewProductBtn');
const cancelNewProductBtn = document.getElementById('cancelNewProductBtn');
const closeModalBtn = document.querySelector('#newProductModal .close-btn');

// API URLs
const PRODUCTS_API_URL = '/api/products';
const TRANSACTIONS_API_URL = '/api/transactions/inbound';

// Variables
let isSessionActive = false;
let scannedItems = {};
let currentUpc = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', initialize);
startSessionBtn.addEventListener('click', startSession);
endSessionBtn.addEventListener('click', endSession);
upcInput.addEventListener('keydown', handleUpcInput);
clearItemsBtn.addEventListener('click', clearItems);
saveAllBtn.addEventListener('click', saveAllItems);
saveNewProductBtn.addEventListener('click', saveNewProduct);
cancelNewProductBtn.addEventListener('click', cancelNewProduct);
closeModalBtn.addEventListener('click', closeNewProductModal);

// Initialize
function initialize() {
  updateSessionUI();
  updateScannedItemsTable();
}

// Session Management
function startSession() {
  isSessionActive = true;
  updateSessionUI();
  upcInput.focus();
}

function endSession() {
  // If items were scanned but not saved, show confirmation
  if (Object.keys(scannedItems).length > 0) {
    if (!confirm('End session? Any unsaved items will be lost.')) {
      return;
    }
  }
  
  isSessionActive = false;
  scannedItems = {};
  updateSessionUI();
  updateScannedItemsTable();
}

function updateSessionUI() {
  // Update buttons
  startSessionBtn.disabled = isSessionActive;
  endSessionBtn.disabled = !isSessionActive;
  clearItemsBtn.disabled = !isSessionActive || Object.keys(scannedItems).length === 0;
  saveAllBtn.disabled = !isSessionActive || Object.keys(scannedItems).length === 0;
  
  // Update input
  upcInput.disabled = !isSessionActive;
  upcInput.value = '';
  
  // Update status
  sessionStatus.textContent = isSessionActive ? 'Active' : 'Not Started';
  scannerStatus.textContent = isSessionActive ? 'Ready to scan' : 'Session not started';
  
  // Update container styling
  const scannerContainer = document.querySelector('.scanner-container');
  if (isSessionActive) {
    scannerContainer.classList.add('session-active');
  } else {
    scannerContainer.classList.remove('session-active');
  }
}

// UPC Handling
async function handleUpcInput(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    
    const scannedUpc = upcInput.value.trim();
    if (!scannedUpc) return;
    
    currentUpc = scannedUpc; // Store UPC in global variable
    console.log("Scanned UPC:", scannedUpc); // Debug log
    
    upcInput.disabled = true;
    scannerStatus.textContent = 'Processing...';
    
    try {
      // First, check if we already have this UPC in our scanned items
      let found = false;
      for (const id in scannedItems) {
        if (scannedItems[id].upc === scannedUpc) {
          // We already have this item, just increment quantity
          scannedItems[id].quantity += 1;
          found = true;
          updateScannedItemsTable();
          scannerStatus.textContent = `Added: ${scannedItems[id].name}`;
          break;
        }
      }
      
      if (!found) {
        // Try to find product by UPC in database
        try {
          const response = await fetch(`${PRODUCTS_API_URL}/upc/${scannedUpc}`);
          
          if (response.ok) {
            const product = await response.json();
            addScannedProduct(product, scannedUpc);
          } else if (response.status === 404) {
            // Product not found - show modal to add new product
            showNewProductModal(scannedUpc);
          } else {
            throw new Error('Failed to lookup product');
          }
        } catch (error) {
          console.error('Error finding product:', error);
          showNewProductModal(scannedUpc); // Fallback to new product modal
        }
      }
    } catch (error) {
      console.error('Error processing UPC:', error);
      scannerStatus.textContent = 'Error: ' + error.message;
    } finally {
      upcInput.disabled = false;
      upcInput.value = '';
      upcInput.focus();
    }
  }
}

function addScannedProduct(product, scannedUpc) {
  // Flash the input to indicate successful scan
  upcInput.classList.add('flash');
  setTimeout(() => upcInput.classList.remove('flash'), 500);
  
  // Store the actual scanned UPC to ensure we have it
  const upcToUse = scannedUpc || product.upc || "Unknown";
  
  // Add to scanned items
  scannedItems[product._id] = {
    _id: product._id,
    name: product.name,
    sku: product.sku,
    upc: upcToUse,
    quantity: 1
  };
  
  console.log("Added product with UPC:", upcToUse); // Debug log
  
  // Update UI
  updateScannedItemsTable();
  scannerStatus.textContent = `Added: ${product.name}`;
}

// New Product Modal
function showNewProductModal(upc) {
  newUpcDisplay.textContent = upc;
  newProductName.value = '';
  newProductSku.value = '';
  newProductDescription.value = '';
  
  newProductModal.classList.add('active');
  newProductName.focus();
}

function closeNewProductModal() {
  newProductModal.classList.remove('active');
  scannerStatus.textContent = 'Ready to scan';
}

async function saveNewProduct() {
  const upcToSave = currentUpc; // Capture the current UPC
  
  const productData = {
    name: newProductName.value,
    sku: newProductSku.value,
    upc: upcToSave, // Use the captured UPC
    description: newProductDescription.value,
    quantity: 0 // Start with zero quantity since we'll increment it via transaction
  };
  
  console.log("Saving new product with UPC:", upcToSave); // Debug log
  
  if (!productData.name || !productData.sku) {
    alert('Please enter product name and SKU');
    return;
  }
  
  try {
    const response = await fetch(PRODUCTS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to create product');
    }
    
    const newProduct = await response.json();
    closeNewProductModal();
    
    // Make sure we have the UPC when we add the product
    newProduct.upc = upcToSave;
    addScannedProduct(newProduct, upcToSave);
    
  } catch (error) {
    console.error('Error creating product:', error);
    alert('Error creating product: ' + error.message);
  }
}

function cancelNewProduct() {
  closeNewProductModal();
}

// Scanned Items Table
function updateScannedItemsTable() {
  scannedItemsTableBody.innerHTML = '';
  
  const itemsArray = Object.values(scannedItems);
  
  if (itemsArray.length === 0) {
    if (scannedItemsTable) {
      scannedItemsTable.classList.add('hidden');
    }
    if (noItemsScanned) {
      noItemsScanned.classList.remove('hidden');
    }
    itemsScannedCount.textContent = '0';
    totalQuantityCount.textContent = '0';
    return;
  }
  
  if (scannedItemsTable) {
    scannedItemsTable.classList.remove('hidden');
  }
  if (noItemsScanned) {
    noItemsScanned.classList.add('hidden');
  }
  
  let totalItems = 0;
  let totalQuantity = 0;
  
  itemsArray.forEach(item => {
    const row = document.createElement('tr');
    
    // Debug log for UPC
    console.log("Rendering item:", item.name, "UPC:", item.upc);
    
    row.innerHTML = `
      <td>${item.upc || 'N/A'}</td>
      <td><strong>${item.name}</strong></td>
      <td>${item.sku}</td>
      <td>
        <div class="quantity-controls">
          <button class="quantity-btn decrease-btn" data-id="${item._id}">-</button>
          <span class="quantity-display">${item.quantity}</span>
          <button class="quantity-btn increase-btn" data-id="${item._id}">+</button>
        </div>
      </td>
      <td>
        <button class="btn danger icon-btn remove-btn" data-id="${item._id}" title="Remove Item">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </td>
    `;
    
    scannedItemsTableBody.appendChild(row);
    
    totalItems++;
    totalQuantity += item.quantity;
  });
  
  // Add event listeners to buttons
  document.querySelectorAll('.decrease-btn').forEach(btn => {
    btn.addEventListener('click', () => decreaseQuantity(btn.dataset.id));
  });
  
  document.querySelectorAll('.increase-btn').forEach(btn => {
    btn.addEventListener('click', () => increaseQuantity(btn.dataset.id));
  });
  
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => removeItem(btn.dataset.id));
  });
  
  // Update counters
  itemsScannedCount.textContent = totalItems;
  totalQuantityCount.textContent = totalQuantity;
  
  // Update button states
  clearItemsBtn.disabled = totalItems === 0;
  saveAllBtn.disabled = totalItems === 0;
}

function increaseQuantity(productId) {
  if (scannedItems[productId]) {
    scannedItems[productId].quantity += 1;
    updateScannedItemsTable();
  }
}

function decreaseQuantity(productId) {
  if (scannedItems[productId] && scannedItems[productId].quantity > 1) {
    scannedItems[productId].quantity -= 1;
    updateScannedItemsTable();
  }
}

function removeItem(productId) {
  if (confirm('Remove this item?')) {
    delete scannedItems[productId];
    updateScannedItemsTable();
  }
}

function clearItems() {
  if (confirm('Are you sure you want to clear all scanned items?')) {
    scannedItems = {};
    updateScannedItemsTable();
  }
}

// Save Transactions
async function saveAllItems() {
  const itemsArray = Object.values(scannedItems);
  
  if (itemsArray.length === 0) {
    return;
  }
  
  if (!confirm(`Save ${itemsArray.length} items to inventory?`)) {
    return;
  }
  
  let successCount = 0;
  let failCount = 0;
  
  for (const item of itemsArray) {
    try {
      const response = await fetch(TRANSACTIONS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId: item._id,
          quantity: item.quantity,
          reference: 'Barcode Scanner Import',
          notes: `Scanned ${item.quantity} units of ${item.name} (UPC: ${item.upc || 'N/A'})`
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create transaction for ${item.name}`);
      }
      
      successCount++;
    } catch (error) {
      console.error('Error creating transaction:', error);
      failCount++;
    }
  }
  
  if (failCount === 0) {
    alert(`Success! ${successCount} items have been added to inventory.`);
    scannedItems = {};
    updateScannedItemsTable();
  } else {
    alert(`Completed with issues. ${successCount} items were added successfully, but ${failCount} items failed. Please check the console for details.`);
  }
}