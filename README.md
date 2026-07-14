# Warehouse Management System

A role-based bilingual Warehouse Management System developed for government-sector inventory operations. The system manages two independent divisional stores, inventory receiving, stock requests, approval workflows, stock issuing, movement tracking, reporting, and user administration.

The application is designed for the operational requirements of a District Secretariat Office and supports both **English and Sinhala**.

---

## 📌 Project Overview

The Warehouse Management System provides a centralized platform for managing inventory across two independent divisions:

* Social Services Division
* Child Services Division

Each division has its own warehouse and stock records. Users can only access inventory related to their assigned division, while the Commissioner has access to both divisions.

The system replaces manual stock management processes with a structured digital workflow for:

* Stock receiving
* Inventory management
* Monthly item requests
* Recommendation and approval
* Stock issuing
* Stock movement tracking
* Reporting
* User management

---

## ✨ Main Features

### 🔐 Authentication and Account Management

* Secure user login
* Role-based access control
* New account registration
* Commissioner account approval before login
* Account status management
* Division-based access restrictions

---

### 🏢 Multi-Division Warehouse Management

The system contains two independent stores:

1. Social Services Division Store
2. Child Services Division Store

Users normally access only their assigned division.

The Commissioner has access to both divisions.

---

### 📦 Inventory Management

* Add and manage inventory items
* View available stock
* Track current quantities
* Set reorder levels
* Manage item categories
* Search and filter inventory
* Track stock by division

Only authorized warehouse staff can directly manage stock.

---

### 🚚 Goods Receiving

The Goods Received Note (GRN) module allows authorized users to:

* Record incoming stock
* Select suppliers
* Add multiple items to a GRN
* Record received quantities
* Store batch information where required
* Update inventory automatically
* View previous GRN records

---

### 📝 Monthly Item Request System

Authorized users can request goods from their assigned warehouse.

Features include:

* Create a new stock request
* Add multiple requested items
* View submitted requests
* Track request status
* Restrict requests according to monthly request policies

---

### ✅ Recommendation and Approval Workflow

The system supports a structured approval process based on the user's role.

Example workflow:

```text
User Request
     ↓
Recommendation
     ↓
Approval
     ↓
Stock Issuance
     ↓
Completed
```

Different users follow different workflows depending on their position.

#### Development Officers

```text
Request
   ↓
Recommendation by designated higher officer
   ↓
Approval
   ↓
Stock Issuance
```

#### Higher-Level Officers

```text
Request
   ↓
Commissioner Approval
   ↓
Stock Issuance
```

#### Commissioner

The Commissioner can access both stores and perform actions according to the configured administrative workflow.

---

### 📤 Stock Issuing

Authorized warehouse users can:

* View approved requests
* Verify available quantities
* Issue requested items
* Record issued quantities
* Prevent issuing quantities greater than available stock
* Automatically update inventory balances

---

### 📊 Stock Movement Tracking

Every inventory transaction can be recorded for auditing purposes.

Examples:

* Stock received
* Stock issued
* Quantity adjustments
* Returns
* Other inventory movements

Each record can contain:

* Item
* Movement type
* Quantity
* Previous stock
* New stock
* Division
* Reference
* User
* Date and time

---

### 📈 Reports

The system provides reports such as:

* Current stock report
* Low-stock report
* Stock receiving report
* Stock issuing report
* Stock movement report
* Request report
* Division-wise inventory report

Reports can be filtered using relevant criteria such as:

* Date range
* Division
* Item
* Request status
* Transaction type

---

### 👥 User and Role Management

The system includes multiple user roles.

Examples:

* Commissioner
* Admin
* Store Keeper
* Development Officer
* Administrative Officer
* Assistant Commissioner
* Assistant Director
* Accountant
* Section Head
* Other Officers

Each role receives access only to the features required for its responsibilities.

---

### 🌐 Bilingual Interface

The application supports:

* English
* Sinhala

Users can switch between languages through the interface.

---

## 🧑‍💻 Technology Stack

### Backend

* PHP
* Laravel
* Laravel REST API
* MySQL

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS

### Development Tools

* Git
* GitHub
* Postman
* Composer
* npm
* XAMPP / MySQL

---

## 📁 Project Structure

```text
warehouse-management-system/
│
├── backend/
│   ├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   │   ├── factories/
│   │   ├── migrations/
│   │   └── seeders/
│   ├── routes/
│   ├── storage/
│   └── tests/
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── layouts/
│       ├── pages/
│       ├── services/
│       ├── types/
│       └── utils/
│
└── README.md
```

> The exact folder structure may vary depending on the final project configuration.

---

## ⚙️ Installation

### Prerequisites

Install the following before running the application:

* PHP
* Composer
* Node.js
* npm
* MySQL
* Git

---

## 🚀 Backend Setup

Clone the repository:

```bash
git clone <repository-url>
```

Move into the backend directory:

```bash
cd backend
```

Install PHP dependencies:

```bash
composer install
```

Create the environment file:

```bash
cp .env.example .env
```

Generate the Laravel application key:

```bash
php artisan key:generate
```

Configure the database inside `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=wms
DB_USERNAME=root
DB_PASSWORD=
```

Run database migrations:

```bash
php artisan migrate
```

Run database seeders:

```bash
php artisan db:seed
```

Or run migrations and seeders together:

```bash
php artisan migrate:fresh --seed
```

Start the Laravel development server:

```bash
php artisan serve
```

The backend will normally be available at:

```text
http://127.0.0.1:8000
```

---

## 💻 Frontend Setup

Move into the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

---

## 🗄️ Database Design

The system contains entities such as:

* Users
* Roles
* Divisions
* Sections
* Staff Profiles
* Organizations
* Items
* Categories
* Suppliers
* GRNs
* GRN Items
* Stock Requests
* Request Items
* Recommendations
* Approvals
* Stock Issues
* Stock Movements

The database uses relational mappings to maintain:

* User and role relationships
* User and division relationships
* Inventory ownership by division
* Request workflow history
* Stock transaction history

---

## 🔄 System Workflow

```text
Account Registration
        ↓
Commissioner Verification
        ↓
User Login
        ↓
Create Monthly Stock Request
        ↓
Recommendation (when required)
        ↓
Approval
        ↓
Stock Issuance
        ↓
Inventory Quantity Updated
        ↓
Movement Record Created
```

---

## 🔒 Access Control

Access to system features depends on:

* User role
* Assigned division
* Assigned section
* Account status
* Workflow permissions

For example:

```text
Store Keeper
├── Manage inventory
├── Receive stock
├── Issue stock
└── View stock movements

Development Officer
├── Create requests
├── View own requests
└── Track request status

Commissioner
├── Access both divisions
├── Approve accounts
├── Approve high-level requests
├── View reports
└── Manage administrative workflows
```

---

## 🧪 API Testing

The backend API can be tested using Postman.

Main API areas include:

```text
/api/auth
/api/staff
/api/organizations
/api/divisions
/api/items
/api/suppliers
/api/grns
/api/requests
/api/approvals
/api/issues
/api/reports
```

Exact endpoints may vary as development continues.

---

## 🛡️ Security Considerations

The application is designed with:

* Password hashing
* Authentication protection
* Role-based authorization
* Division-based data restrictions
* Backend input validation
* Protected API routes
* Controlled administrative access

Frontend restrictions alone should not be considered security. All critical permissions must also be enforced by the Laravel backend.

---

## 🗺️ Future Improvements

Possible future enhancements include:

* QR code and barcode scanning
* Email notifications
* Real-time dashboard updates
* Advanced analytics
* Export reports to PDF and Excel
* Digital approval signatures
* Automated reorder alerts
* Audit log dashboard
* Backup and restore system
* Mobile application support

---

## 🎯 Project Objective

The main objective of this project is to create a reliable digital inventory platform that improves:

* Transparency
* Accuracy
* Accountability
* Stock visibility
* Approval efficiency
* Record keeping
* Inventory auditing

for government warehouse operations.

---

## 👨‍💻 Developer

**Sasi Jay**

Computer Science Undergraduate
University of Ruhuna

---

## 📄 License

This project was developed for educational and organizational purposes.

All rights reserved unless otherwise specified.

---

## ⭐ Support

If you find this project useful, consider giving the repository a star.

  
