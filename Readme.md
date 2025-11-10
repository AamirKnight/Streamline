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

## Architecture

```
┌─────────────┐
│   Next.js   │
│  Frontend   │
└──────┬──────┘
       │
       ├──────┬──────────┬──────────┬──────────┐
       │      │          │          │          │
   ┌───▼──┐ ┌▼────────┐ ┌▼───────┐ ┌▼──────┐  ┌▼──────┐
   │ Auth │ │Workspace│ │Document│ │  AI   │  │ File  │
   └───┬──┘ └┬────────┘ └┬───────┘ └┬──────┘  └───────┘
       │     │           │          │
   ┌───▼─────▼───────────▼──────────▼──────────┐
   │  MySQL  │ MongoDB │ PostgreSQL │  Redis   │
   └─────────┴─────────┴────────────┴──────────┘
```

## Tech Stack
### Backend
- **Auth Service**: Node.js + Express + MySQL + JWT
- **Workspace Service**: Node.js + Express + MySQL + Redis
- **Document Service**: Node.js + MongoDB + Socket.io
- **AI Service**: Node.js + PostgreSQL (pgvector) + Gemini + HuggingFace

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Editor**: TipTap
- **Styling**: Tailwind CSS + shadcn/ui
- **Real-time**: Socket.io-client

### Infrastructure
- **Databases**: MySQL, MongoDB, PostgreSQL (pgvector)
- **Cache**: Redis
- **Message Queue**: RabbitMQ
- **AI**: Google Gemini + HuggingFace

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
- Portfolio: [yourwebsite.com](https://portfolio-aamirs-projects-da06cbac.vercel.app/)
- LinkedIn: [linkedin.com/in/yourprofile](https://www.linkedin.com/in/aamir-arshad-developer/)
- Email: arshadaamir09@gmail.com

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🙏 Acknowledgments

- TipTap for the rich text editor
- Socket.io for real-time functionality
- shadcn/ui for beautiful components