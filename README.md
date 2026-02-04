# 🔬 CodeAutoSpy Frontend Dashboard

<div align="center">

![CodeAutoSpy](https://img.shields.io/badge/CodeAutoSpy-Dashboard-blueviolet?style=for-the-badge)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

**Modern dashboard for monitoring AI-powered CI/CD failure auto-fixes** 🚀

</div>

---

## 📋 Overview

This is the frontend dashboard for **CodeAutoSpy** - an AI-powered CI/CD failure auto-fix agent. It provides real-time monitoring of GitHub Actions failures and AI-generated code fixes.

## ✨ Features

- 📊 **Dashboard** - Real-time stats, charts, and recent activity
- 📋 **Events** - Browse all CI/CD failure events with filtering
- 🔧 **Fixes** - View AI-generated code fixes with diff highlighting
- 📦 **Queue** - Monitor job queue status and manage failed jobs
- ⚙️ **Settings** - Server status and configuration

## 🛠️ Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **React Router** - Navigation
- **TanStack Query** - Data fetching
- **Recharts** - Charts and graphs
- **Lucide React** - Icons

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/hariharan-r06/FrontendCodeAutoSpy.git

# Navigate to project
cd FrontendCodeAutoSpy

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:3000
```

## 📁 Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── ui/          # shadcn/ui components
│   └── layout/      # Layout components
├── pages/           # Page components
├── hooks/           # Custom React hooks
├── lib/             # Utility functions
└── services/        # API service layer
```

## 🔗 API Integration

The dashboard connects to the CodeAutoSpy backend API:

| Endpoint | Description |
|----------|-------------|
| `GET /api/stats` | Dashboard statistics |
| `GET /api/events` | Failure events list |
| `GET /api/events/:id` | Event details |
| `GET /api/fixes` | Fix attempts list |
| `GET /api/queue` | Queue status |

## 📦 Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📝 License

MIT License

---

<div align="center">

**Built with ❤️ by Hariharan R**

</div>
