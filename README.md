<div align="center">
  <img src="https://via.placeholder.com/150x150?text=Trimax+Logo" alt="Trimax Logo" width="120" />

  # 🌟 Trimax Portal
  
  **A Comprehensive Enterprise Management System (EMS, CRM & ERP)**
  
  An all-in-one robust web application designed for seamless employee management, lead tracking, quotation generation, and administrative control.

  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

</div>

---

## 📖 Table of Contents
- [📸 Screenshots](#-screenshots)
- [✨ Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [🏗️ Project Architecture](#️-project-architecture)
- [📂 Folder Structure](#-folder-structure)
- [🚀 Installation & Setup](#-installation--setup)
- [🔐 Environment Variables](#-environment-variables)
- [🌍 Deployment](#-deployment)
- [🔮 Future Scope & Enhancements](#-future-scope--enhancements)
- [🤝 Contribution Guidelines](#-contribution-guidelines)
- [👨‍💻 Author](#-author)

---

## 📸 Screenshots

| Home Page | Admin Dashboard |
| :---: | :---: |
| <img src="https://via.placeholder.com/600x350?text=Home+Page" alt="Home Page"> | <img src="https://via.placeholder.com/600x350?text=Admin+Dashboard" alt="Admin Dashboard"> |

| Leads Management | Quotations |
| :---: | :---: |
| <img src="https://via.placeholder.com/600x350?text=Leads+Management" alt="Leads Management"> | <img src="https://via.placeholder.com/600x350?text=Quotations" alt="Quotations"> |

| User Management | Leave Management |
| :---: | :---: |
| <img src="https://via.placeholder.com/600x350?text=User+Management" alt="User Management"> | <img src="https://via.placeholder.com/600x350?text=Leave+Management" alt="Leave Management"> |

| Settings | About / Services Page |
| :---: | :---: |
| <img src="https://via.placeholder.com/600x350?text=Settings" alt="Settings"> | <img src="https://via.placeholder.com/600x350?text=About+Services+Page" alt="About Services Page"> |

| Contact Page |
| :---: |
| <img src="https://via.placeholder.com/600x350?text=Contact+Page" alt="Contact Page"> |

> **Note:** Actual screenshots to be added manually. Simply replace the `https://via.placeholder.com/...` links above with the relative path to your screenshots (e.g., `./screenshots/home.png`).

---

## ✨ Features

🚀 **Comprehensive Dashboard**  
Provides a bird's-eye view of organizational metrics, active leads, employee statistics, and recent system activities.

👥 **Employee Management System (EMS)**  
- End-to-end user and employee lifecycle management.
- Leave request workflow, attendance tracking, and internal communications.

🎯 **Customer Relationship Management (CRM)**  
- Lead lifecycle tracking from inception to conversion via interactive Kanban boards.
- Client interaction history and structured follow-up scheduling.

📄 **Quotation & Proposal Engine**  
- Dynamic, automated generation of highly professional PDF quotations using PDFKit and Mammoth.
- Streamlined approval workflows and templating.

💬 **Integrated Communications**  
- Robust built-in email functionality via Nodemailer for seamless client engagement.

🔒 **Enterprise-Grade Security**  
- JWT-based authentication and secure Role-Based Access Control (RBAC).

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React.js (v19)
- **Styling:** Tailwind CSS, Framer Motion for micro-animations
- **Routing:** React Router DOM
- **Data Visualization:** Recharts
- **Icons:** Lucide React

### Backend
- **Framework:** Node.js, Express.js
- **Database:** MongoDB (with Mongoose ORM)
- **Authentication:** JSON Web Tokens (JWT), bcryptjs
- **File Processing:** PDFKit, Multer, ExcelJS
- **Communication:** Nodemailer
- **Task Scheduling:** Node-Cron

---

## 🏗️ Project Architecture

Trimax Portal adopts a modern **Client-Server Architecture**:

1. **Presentation Layer (Admin Frontend):** A highly responsive, SPA-based React interface optimized for performance and an aesthetic, premium user experience.
2. **Application Layer (Node.js/Express Backend):** RESTful APIs handling core business logic, background jobs (cron), and complex operations like document generation.
3. **Data Layer (MongoDB):** Highly scalable NoSQL database optimized for complex, relational-like queries required by ERP solutions.
4. **Integration Layer:** Interfaces with SMTP servers for robust email delivery and communication.

---

## 📂 Folder Structure

```text
Trimax-Portal/
├── admin-frontend/         # React Frontend
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Full page views
│   │   ├── context/        # React Context (Auth, etc.)
│   │   ├── utils/          # Helper functions
│   │   ├── App.js          # App routing
│   │   └── index.css       # Tailwind entry and global styles
│   └── package.json        # Frontend dependencies
│
└── backend/                # Node.js/Express Backend
    ├── src/
    │   ├── controllers/    # API Request handlers
    │   ├── models/         # Mongoose schemas
    │   ├── routes/         # Express API routes
    │   ├── middleware/     # Auth & Validation middlewares
    │   ├── utils/          # Mailers, PDF generators, Cron jobs
    │   └── server.js       # Entry point
    ├── .env                  # Environment variables
    └── package.json        # Backend dependencies
```

---

## 🚀 Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas)
- Git

### 1. Clone the repository
```bash
git clone https://github.com/BhaveshThakur-57/Trimax-Portal.git
cd Trimax-Portal
```

### 2. Backend Setup
```bash
cd backend
npm install
```
- Create a `.env` file in the backend directory based on the environment variables table below.
- Start the development server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd admin-frontend
npm install
```
- Start the development server:
```bash
npm start
```

The application should now be running on `http://localhost:3000` with the API on `http://localhost:5000`.

---

## 🔐 Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

| Variable | Description |
| :--- | :--- |
| `PORT` | API Server port (e.g., 5000) |
| `NODE_ENV` | `development` or `production` |
| `MONGODB_URI` | MongoDB Connection String |
| `JWT_SECRET` | Secret key for JWT signing |
| `JWT_EXPIRE` | Expiration time for JWT (e.g., 7d) |
| `FRONTEND_URL` | URL of the frontend app (for CORS) |
| `ADMIN_EMAIL` | Default admin email for seeding |
| `ADMIN_PASSWORD` | Default admin password |
| `EMAIL_USER` | SMTP Email username/address |
| `EMAIL_PASS` | SMTP Email app password |

---

## 🌍 Deployment

### Deploying the Backend (Render / Heroku)
1. Push your repository to GitHub.
2. Connect the repository to your chosen PaaS (e.g., Render).
3. Set the Root Directory to `backend`.
4. Add all environment variables from `.env` to the service configuration.
5. Deploy.

### Deploying the Frontend (Vercel / Netlify)
1. Import the repository into Vercel.
2. Set the Framework Preset to **Create React App**.
3. Set the Root Directory to `admin-frontend`.
4. Add necessary frontend environment variables.
5. Ensure the API base URL in the frontend is pointing to your newly deployed backend URL.
6. Deploy.

---

## 🔮 Future Scope & Enhancements

- [ ] **Advanced Analytics:** Integrating AI-driven insights for lead conversion probability.
- [ ] **Mobile Application:** Dedicated React Native apps for field employees.
- [ ] **Payment Gateway Integration:** Direct invoicing and online payment collection (Stripe/Razorpay).
- [ ] **Third-Party Integrations:** Seamlessly connect with Slack, Jira, and Google Calendar.
- [ ] **Multi-Tenant Architecture:** Upgrading the system to support a SaaS model for multiple businesses.

---

## 🤝 Contribution Guidelines

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 👨‍💻 Author

**Bhavesh Thakur**

- GitHub: [@BhaveshThakur-57](https://github.com/BhaveshThakur-57)

---

<div align="center">
  <p>Built with ❤️ for better business management.</p>
</div>
