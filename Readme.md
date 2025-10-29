# StreamLine - Real-Time Collaborative Document Editor

A modern, real-time collaborative document editing platform built with microservices architecture.

![StreamLine Demo](docs/demo.gif)

## 🚀 Features

- ✅ **Real-Time Collaboration** - Multiple users can edit documents simultaneously
- ✅ **Rich Text Editor** - TipTap-powered editor with formatting options
- ✅ **Workspaces** - Organize documents into team workspaces
- ✅ **Role-Based Access** - Admin, Editor, and Viewer roles
- ✅ **Version History** - Track all document changes
- ✅ **Presence Indicators** - See who's online and editing
- ✅ **Auto-Save** - Changes saved every 2 seconds
- ✅ **Secure** - JWT authentication, rate limiting, input validation
- ✅ **Fast** - Redis caching, optimized queries, CDN-ready

## 🏗️ Architecture
```
Frontend (Next.js 14)
    ↓
Auth Service (3001) → MySQL
    ↓
Workspace Service (3002) → MySQL
    ↓
Document Service (3003) → MongoDB + Socket.io + Redis
```

### Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui
- TipTap (Rich Text Editor)
- Socket.io Client

**Backend:**
- Node.js + Express
- TypeScript
- MySQL (Users, Workspaces)
- MongoDB (Documents)
- Redis (Caching, Rate Limiting, Socket.io Adapter)
- Socket.io (Real-Time)
- RabbitMQ (Message Queue - Planned)

**DevOps:**
- Docker & Docker Compose
- GitHub Actions (CI/CD - Planned)

## 📦 Installation

### Prerequisites

- Node.js 20+
- Docker Desktop
- Git

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/streamline.git
cd streamline
```

2. **Start Docker services**
```bash
docker-compose -f docker/docker-compose.dev.yml up -d
```

3. **Install dependencies**
```bash
npm install
```

4. **Setup environment variables**
```bash
cp services/auth/.env.example services/auth/.env
cp services/workspace/.env.example services/workspace/.env
cp services/document/.env.example services/document/.env
cp apps/frontend/.env.local.example apps/frontend/.env.local
```

5. **Start all services**
```bash
npm run dev:all
```

6. **Open browser**
- Frontend: http://localhost:3000
- Auth API: http://localhost:3001
- Workspace API: http://localhost:3002
- Document API: http://localhost:3003

## 🧪 Testing

Run end-to-end tests:
```bash
./test-e2e.sh
```

Run unit tests:
```bash
npm test
```

## 📁 Project Structure
```
streamline/
├── apps/
│   └── frontend/          # Next.js frontend
├── services/
│   ├── auth/             # Authentication service
│   ├── workspace/        # Workspace management service
│   ├── document/         # Document service with Socket.io
│   ├── notification/     # Notification service (planned)
│   └── file/            # File upload service (planned)
├── shared/              # Shared types and utilities
├── docker/              # Docker configuration
└── docs/                # Documentation
```

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting (100 req/15min)
- Input validation and sanitization
- XSS protection
- NoSQL injection prevention
- CORS configuration
- Security headers (Helmet)

## 🎨 Screenshots

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)

### Document Editor
![Editor](docs/screenshots/editor.png)

### Real-Time Collaboration
![Collaboration](docs/screenshots/collaboration.png)

## 🚧 Roadmap

- [ ] File uploads (images, PDFs)
- [ ] Comments and mentions
- [ ] Advanced permissions
- [ ] Email notifications
- [ ] Mobile apps
- [ ] AI writing assistant
- [ ] Analytics dashboard

## 👨‍💻 Author

**Your Name**
- Portfolio: [yourwebsite.com](https://yourwebsite.com)
- LinkedIn: [linkedin.com/in/yourprofile](https://linkedin.com/in/yourprofile)
- Email: your.email@example.com

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🙏 Acknowledgments

- TipTap for the rich text editor
- Socket.io for real-time functionality
- shadcn/ui for beautiful components