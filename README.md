# Warehouse-Managment
3PL Project
Best practices for future changes

Start fresh when working on new features
git checkout main
git pull
git checkout -b feature/new-feature-name
This creates a new branch based on the latest main
Commit frequently with clear messages
git add .
git commit -m "Descriptive message about what changed"

Push regularly to back up your work
git push origin feature/new-feature-name

Create pull requests to merge changes
This allows for code review and maintains a clear history
Keep your local main up to date
git checkout main
git pull


warehouse-inventory/
├── .env                    # Environment variables
├── .gitignore              # Git ignore file
├── models/                 # MongoDB models
│   ├── client.js           # Client model
│   ├── product.js          # Product model
│   └── transaction.js      # Transaction model
├── public/                 # Static files
│   ├── index.html          # Dashboard page
│   ├── clients.html        # Clients management page
│   ├── transactions.html   # Transactions page
│   ├── barcode-scan.html   # Barcode scanner page
│   ├── update-upcs.html    # UPC management page
│   ├── styles.css          # Main styles
│   ├── app.js              # Main frontend JavaScript
│   └── [other JS/CSS files]
├── routes/                 # API routes
│   ├── clientRoutes.js     # Client API endpoints
│   ├── productRoutes.js    # Product API endpoints  
│   └── transactionRoutes.js # Transaction API endpoints
├── package.json            # Project dependencies
├── README.md               # Project documentation
└── server.js               # Main server file
