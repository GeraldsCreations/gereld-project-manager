# Gereld Project Manager

AI-powered kanban board for managing AI agents and their tasks across multiple projects.

## 🎯 Features

### 3-View Structure

**1. Overview Dashboard** (`/`)
- Grid view of all AI agents
- Shows: Agent name, current task, status (idle/working/blocked), last update
- Click any agent → go to Agent View

**2. Agent View** (`/agent/:id`)
- Kanban board for specific agent's tasks across ALL projects
- Columns: Backlog → To Do → In Progress → Review → Done
- Drag & drop to update task status
- Shows: Task title, project, priority, due date

**3. Project Board** (`/project/:id`)
- Kanban board for specific project's tasks across ALL agents  
- Same kanban structure
- Shows: Task title, assigned agent, priority, due date

## 🔥 Tech Stack

- **Frontend:** Angular 20 + PrimeNG (Sakai template)
- **Backend:** Firebase Firestore (real-time database)
- **Hosting:** Firebase Hosting (ready to deploy)
- **Drag & Drop:** PrimeNG + Angular CDK

## 📊 Firestore Data Structure

```typescript
// Collections
agents: {
  id: string
  name: string
  avatar?: string
  currentTask?: string
  status: 'idle' | 'working' | 'blocked'
  lastUpdated: Date
}

projects: {
  id: string
  name: string
  description?: string
  createdAt: Date
}

tasks: {
  id: string
  title: string
  description?: string
  projectId: string  // FK to projects
  agentId: string    // FK to agents
  column: 'backlog' | 'todo' | 'in-progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high'
  dueDate?: Date
  createdAt: Date
  updatedAt: Date
}
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Firebase project

### Installation

```bash
# Install dependencies
npm install

# Update Firebase config
# Edit src/environments/environment.ts with your Firebase config
```

### Development

```bash
# Start dev server
npm start

# Build for production
npm run build
```

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: `gereld-project-manager`
3. Create Firestore database (production mode)
4. Update security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /agents/{agentId} {
      allow read, write: if true; // Update with proper auth
    }
    match /projects/{projectId} {
      allow read, write: if true;
    }
    match /tasks/{taskId} {
      allow read, write: if true;
    }
  }
}
```

### Deploy to Firebase

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Deploy
firebase deploy
```

## 📝 Usage Example

### Add Sample Data

```javascript
// Add in Firestore console or via script:

// agents collection
{
  name: "Growth Research Agent",
  status: "working",
  currentTask: "Vuka Win user acquisition analysis",
  lastUpdated: new Date()
}

// projects collection
{
  name: "Vuka Win",
  description: "South Africa mobile app - 30 → 5000 users",
  createdAt: new Date()
}

// tasks collection
{
  title: "Research LSM market behavior",
  projectId: "<project-id>",
  agentId: "<agent-id>",
  column: "in-progress",
  priority: "high",
  createdAt: new Date(),
  updatedAt: new Date()
}
```

## 🎨 Customization

- **Theme:** Edit `src/app.config.ts` → `providePrimeNG` → `theme.preset`
- **Columns:** Edit column arrays in agent-view/project-board components
- **Styling:** PrimeNG uses CSS variables (see PrimeNG docs)

## 🔗 Links

- **Repo:** https://github.com/GeraldsCreations/gereld-project-manager
- **PrimeNG Docs:** https://primeng.org
- **Firebase Docs:** https://firebase.google.com/docs

## 📄 License

Private project - All rights reserved

---

Built by Gereld 🍆 for managing AI agent workflows
