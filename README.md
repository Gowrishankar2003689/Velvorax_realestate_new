# Velvorax Full-Stack Platform

A high-performance Business Automation, CRM, and Business Scaling Platform built with Node.js, Express, MongoDB, and a modern responsive frontend.

---

## 🚀 Features

### Marketing Website
- Modern Dark & Gold UI
- Glassmorphism Design
- Responsive Layout
- Home Page
- Features Page
- Services
- Pricing
- Contact

### CRM Dashboard
- User Authentication
- Super Admin Dashboard
- Employee Management
- Lead Management
- Deal Management
- Company Management
- Task Management
- Ticket Management
- Case Management
- Partner Management
- Account Management
- Blog Management
- Reports & Analytics
- AI Email Integration
- Chat Module
- Dashboard Metrics
- Charts & Analytics
- Role-Based Access Control

---

## 🛠 Tech Stack

### Frontend
- HTML5
- CSS3
- Tailwind CSS
- JavaScript (Vanilla)
- Chart.js
- Mermaid.js

### Backend
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT Authentication
- CORS
- Dotenv

### Deployment
- PM2
- Git
- GitHub
- Linux Server

---

## 📁 Project Structure

```
Velvorax/
│
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── uploads/
│   ├── server.js
│   ├── seed.js
│   └── package.json
│
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── css/
│   ├── js/
│   └── assets/
│
├── README.md
└── .gitignore
```

---

# ⚙ Backend Setup

Clone the repository

```bash
git clone https://github.com/infovelvorax/Velvorax.git
```

Go to the project

```bash
cd Velvorax
```

Install backend dependencies

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` directory.

Example:

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

EMAIL_USER=your_email

EMAIL_PASS=your_email_password
```

Populate the database

```bash
node seed.js
```

Start the backend

```bash
node server.js
```

The server runs on:

```
http://localhost:5000
```

---

# 💻 Frontend Setup

Open the frontend folder.

```text
frontend/
```

Open

```
index.html
```

using your browser or VS Code Live Server.

---

# 🔑 Default Login

```
Email:
info.velvorax@gmail.com

Password:
Admin@123
```

---

# 🚀 Deployment

## Push Code

```bash
git add .
git commit -m "Updated project"
git push origin main
```

## Server Deployment

Login

```bash
ssh developer@<SERVER_IP>
```

Navigate to the project

```bash
cd /var/www/app
```

Update code

```bash
git fetch origin
git reset --hard origin/main
```

Install dependencies

```bash
cd backend
npm install
```

Restart application

```bash
pm2 restart all
```

View logs

```bash
pm2 logs server
```

---

# 🌐 Production URL

```
https://crm.velvorax.tech
```

---

# 📂 Repository

```
https://github.com/infovelvorax/Velvorax
```

---

# 📦 Environment Variables

Example:

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_secret_key

EMAIL_USER=your_email

EMAIL_PASS=your_password
```

---

# 📊 Technologies Used

- HTML5
- CSS3
- Tailwind CSS
- JavaScript
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT
- Chart.js
- Mermaid.js
- PM2
- Git
- GitHub

---

# 📝 Notes

- Ensure MongoDB Atlas is accessible before starting the backend.
- The backend must be running for login and dashboard features.
- Keep the `.env` file out of Git for security.
- Use PM2 for production deployments.
- Restart PM2 after updating the project or environment variables.

---

# 📄 License

This project is developed for **Velvorax**.

**© Velvorax. All Rights Reserved.**
