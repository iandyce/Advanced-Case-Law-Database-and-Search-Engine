# Advanced Case Law Database & Search Engine

A legal research tool designed to make Kenyan case law more accessible.  
This project provides a **backend**, **frontend**, and **database schema** for efficient and secure case law retrieval.

---

## 🚀 Features
- **Optimized Search**: Full-text and Boolean search for legal cases.
- **County-based Filtering**: View and filter cases by Kenyan regions (CAP-style map interface).
- **Role-based Access**: Secure login with role-based authorization.
- **Case Management**: CRUD operations for adding, updating, and deleting case records.
- **Database Security**: Encrypted authentication and compliance with data protection standards.

---

## 🛠️ Tech Stack
- **Backend**: Node.js + Express.js  
- **Frontend**: HTML, CSS, JavaScript (CAP-inspired UI)  
- **Database**: MySQL (dump included in db/)  
- **Authentication**: JWT, role-based authorization  

---

## 📂 Repository Structure
\\\
/Backend    → Node.js + Express backend
/Frontend   → CAP-style frontend
/db         → MySQL dump (case_law_db.sql)
\\\

---

## ⚙️ Setup Instructions

### 1. Clone Repository
\\\ash
git clone https://github.com/iandyce/Advanced-Case-Law-Database-and-Search-Engine.git
cd Advanced-Case-Law-Database-and-Search-Engine
\\\

### 2. Backend Setup
\\\ash
cd Backend
npm install
cp ../.env.example .env   # update with your DB credentials
npm start
\\\

### 3. Database Setup
- Import the dump into MySQL:
\\\ash
mysql -u root -p case_law_db < db/case_law_db.sql
\\\

### 4. Frontend
Open \/Frontend/index.html\ in your browser.  
The map interface lets you browse cases by county.

---

## 🤝 Contributing
Pull requests are welcome.  
For major changes, please open an issue first to discuss what you’d like to change.

---

## 📜 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
