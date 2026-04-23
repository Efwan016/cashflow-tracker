<p align="center">💰 Cashflow Tracker & 

📦 Inventory Management System </p>

<p align="center">
<img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
<img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
<img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS" />
<img src="https://img.shields.io/badge/Supabase-1C1C1C?style=for-the-badge&logo=supabase&logoColor=3ECF8E" alt="Supabase" />
<img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</p>
<p align="center">
<img src="https://img.shields.io/github/stars/Efwan016/cashflow-tracker?style=social" alt="Stars" />
<img src="https://img.shields.io/github/forks/Efwan016/cashflow-tracker?style=social" alt="Forks" />
<img src="https://img.shields.io/github/issues/Efwan016/cashflow-tracker?style=social" alt="Issues" />
</p>

A modern, full-stack financial application designed to simplify money management for small businesses and individuals. It seamlessly combines real-time financial tracking with robust inventory management.

🎨 Visual Preview
<p align="center">
<img src="./public/images/Login.png" alt="Main Dashboard" width="100%" />


<em>Figure 1: High-level financial overview.</em>
</p>

<p align="center">
<img src="./public/images/Dashboard.png" alt="Dashboard Management" width="49%" />


<img src="./public/images/Reports.png" alt="Reports Management" width="49%" />
<em>Figure 2:Repots Management.</em>
</p>

✨ Key Features
📊 Financial Intelligence Dashboard: Real-time visibility into Net Profit, Revenue, and Expenses with dynamic breakdown charts.

🛒 Comprehensive Inventory System: Manage product catalogs with cost price tracking to ensure accurate profit calculation.

📑 Audit-Ready Stock Logs: Detailed history of In/Out stock movements to prevent data discrepancies.

💸 Smart Transactions: Record sales with automatically updated inventory levels and precise profit margin reporting.

🔍 Advanced Financial Reporting: Robust filtering by date ranges (Today, Last 7 Days, Monthly, etc.) for better decision making.

🔐 Enterprise-Grade Security: Seamless Google Auth integration and Row Level Security (RLS) via Supabase.

📱 Modern, Responsive Design: A beautiful dark-themed interface built with Tailwind CSS, optimized for all devices.

🛠️ Tech Stack & Architecture
This project uses a modern, high-performance tech stack:

Frontend: React.js & TypeScript for a type-safe UI.

Styling: Tailwind CSS with advanced visual effects.

State: Zustand for clean, performant state management.

Backend: Supabase (PostgreSQL + Auth + RLS) for a scalable database solution.

Routing: React Router v6 for seamless navigation.

<details>
<summary>📂 Project Structure</summary>

Bash
/src
├── /components
│   ├── /layout      # Topbar, Sidebar, Footer
│   └── /pages       # Main view logic (Dashboard, Stock, Transaction)
├── /hooks           # Custom hooks for business logic
├── /lib             # API configuration (Supabase)
└── /types           # TypeScript interfaces
</details>

🚀 Getting Started
To run this project locally, follow these steps:

📋 Prerequisites
Node.js (v18 or higher)

A free Supabase account

🔧 Installation
Clone the repository:

Bash
git clone https://github.com/Efwan016/cashflow-tracker.git
cd cashflow-tracker
Install dependencies:

Bash
npm install
Setup Environment Variables:
Create a .env file in the root directory and add your credentials:

Cuplikan kode
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
Run the development server:

Bash
npm run dev
📄 License
This project is licensed under the MIT License. See LICENSE for details.

🤝 Contact
Developed by Efwan Rizaldi

<p align="left">
<a href="mailto:efwanrizaldi@gmail.com"><img src="https://img.shields.io/badge/Gmail-D14836?style=for-the-badge&logo=gmail&logoColor=white" alt="Email" /></a>
<a href="https://www.linkedin.com/in/efwan-rizaldi-7a9801265/"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" /></a>
<a href="https://efwan-portfolio.vercel.app/"><img src="https://img.shields.io/badge/Portfolio-252525?style=for-the-badge&logo=polywork&logoColor=white" alt="Portfolio" /></a>
</p>