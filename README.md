Inventory and Data Management System

Web Dev III – Lab Assignment 3 (Unit 3, CO3)

A RESTful backend built with Node.js, Express.js, MongoDB (Mongoose) and dotenv to manage a store/warehouse product catalogue: CRUD, filtering, sorting, pagination, safe stock adjustment, and aggregation-based inventory reports.

Features
Mongoose schema with field-level validation (required, min, unique SKU, integer quantity)
Virtual field stockValue (price × quantity)
Full CRUD for products
Filtering, sorting and pagination using query strings
Stock restock / sale using atomic $inc (sale is rejected if stock is insufficient)
Low-stock alert report (quantity <= reorderLevel)
Category-wise inventory summary using an aggregation pipeline
Centralized error handling and ObjectId validation middleware
Environment variables via dotenv
Project Structure
inventory-system/
├── controllers/productController.js
├── middleware/
│   ├── asyncHandler.js
│   ├── errorHandler.js
│   └── validateObjectId.js
├── models/Product.js
├── routes/productRoutes.js
├── screenshots/
├── .env.example
├── package.json
└── server.js
Setup and Run
bash
git clone <your-repo-link>
cd <repo-folder>
npm install

Create a .env file (see .env.example):

PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/inventory_db

Start the server:

bash
npm start
API Endpoints
Method	Endpoint	Description
POST	/api/products	Create a product
GET	/api/products	Get all products (filter, sort, paginate)
GET	/api/products/:id	Get a single product
PUT	/api/products/:id	Update product details
PATCH	/api/products/:id/stock	Adjust stock ({"change": 10} or {"change": -3})
DELETE	/api/products/:id	Delete a product
GET	/api/products/low-stock	Low-stock alert report
GET	/api/products/summary	Category-wise inventory summary

Query params for GET /api/products: category, supplier, search, minPrice, maxPrice, inStock=true, sort (e.g. -price,name), page, limit.

Postman Output Screenshots
1. Create Product (POST)

Create Product

2. Get All Products (GET)

Get All Products

3. Filtering, Sorting and Pagination (GET)

Filter Sort Pagination

4. Get Single Product (GET)

Get Single Product

5. Update Product (PUT)

Update Product

6. Stock Adjustment (PATCH)

Stock Adjustment

7. Delete Product (DELETE)

Delete Product

8. Low-Stock Report (GET)

Low Stock

9. Category-wise Summary (GET)

Summary

10. Validation Error (POST with empty body)

Validation Error