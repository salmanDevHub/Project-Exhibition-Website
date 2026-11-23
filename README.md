# VSpark – Project Exhibition Platform

A web-based project exhibition platform designed to showcase university students' projects, encourage collaboration, and provide a centralized space for discovering innovative academic work.

## 🌐 Live Demo

Live Website:(https://project-exhibition-website-production.up.railway.app/)


### Homepage
<img width="938" height="418" alt="image" src="https://github.com/user-attachments/assets/ea4f8dff-ab47-46db-ab2f-20f17185499f" />


### Project Exhibition
<img width="941" height="356" alt="image" src="https://github.com/user-attachments/assets/e6d82bea-f53f-4202-8e4d-ea1e5ab98a63" />


## ✨ Features

- **User Authentication:** Secure registration and login system.
- **Project Showcase:** Students can publish and showcase their academic projects.
- **PDF Uploads:** Upload project documentation and supporting files.
- **Project Interaction:** Users can like and review projects.
- **University Support:** University-based project organization.
- **Admin Panel:** Administrative access and user management.
- **Secure Authentication:** JWT-based authentication and password hashing.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | Backend runtime |
| Express.js | Web framework |
| SQLite | Database |
| Better-SQLite3 | Database integration |
| JavaScript | Application logic |
| JWT | Authentication |
| bcryptjs | Password hashing |
| Multer | File uploads |

## 🚀 Run Locally

### 1. Clone the Repository

```bash
git clone https://github.com/salmanDevHub/Project-Exhibition-Website.git
```

### 2. Navigate to Project Directory

```bash
cd Project-Exhibition-Website
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file if your application is configured to load environment variables, and configure the required values:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your_secure_secret
ADMIN_EMAIL=your_admin_email
ADMIN_PASSWORD=your_secure_password
```

### 5. Start the Application

```bash
npm start
```

Open your browser at:

```text
http://localhost:3000
```

## 📁 Project Structure

```text
Project-Exhibition-Website/
│
├── server.js
├── db.js
├── package.json
├── package-lock.json
├── uploads/
├── screenshots/
└── README.md
```

## ☁️ Deployment

The application is deployed using **Railway**, making it accessible online through a public URL.

## 🔐 Security

- Password hashing using bcryptjs.
- JWT-based authentication.
- Secure cookie configuration for production.
- Role-based administrative access.

## 👨‍💻 Developer

**Salman Shahid**

BS Software Engineering  
