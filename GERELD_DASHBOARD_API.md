# Gereld PM Dashboard - API Documentation

**Firebase Firestore Backend + CLI Tool Interface**

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Data Model](#data-model)
3. [CLI Tool Reference](#cli-tool-reference)
4. [Firebase Firestore Schema](#firebase-firestore-schema)
5. [Integration Guide](#integration-guide)

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────┐
│  Web UI (Angular 20 + PrimeNG)                 │
│  https://gereld-project-manager.web.app        │
└───────────────┬─────────────────────────────────┘
                │
                │ Real-time sync
                │
┌───────────────▼─────────────────────────────────┐
│  Firebase Firestore (Backend)                  │
│  - Real-time database                          │
│  - No server needed                            │
└───────────────┬─────────────────────────────────┘
                │
                │ Admin SDK
                │
┌───────────────▼─────────────────────────────────┐
│  CLI Tool (update-dashboard.js)                │
│  - Node.js script                              │
│  - Direct Firestore access                    │
└─────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend:** Angular 20, PrimeNG, RxJS
- **Backend:** Firebase Firestore (NoSQL)
- **CLI:** Node.js, Firebase Admin SDK
- **Hosting:** Firebase Hosting
- **Authentication:** None (trusted environment)

---

## Data Model

### Collections

```
firestore/
├── agents/           # AI agents
├── projects/         # Projects
└── tasks/            # Tasks (linked to agents & projects)
```

### Entity Relationships

```
Agent (1) ──── (Many) Tasks
Project (1) ──── (Many) Tasks
```

### Field Types

**TypeScript Definitions:**

```typescript
interface Agent {
  id: string;              // Auto-generated document ID
  name: string;            // Display name
  avatar?: string;         // Optional avatar URL/emoji
  currentTask?: string;    // What agent is working on now
  status: AgentStatus;     // idle | working | blocked
  lastUpdated: Timestamp;  // Firebase Timestamp
}

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: Timestamp;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  projectId: string;       // Foreign key → projects
  agentId: string;         // Foreign key → agents
  column: TaskColumn;      // backlog | todo | in-progress | review | done
  priority: TaskPriority;  // low | medium | high
  dueDate?: Timestamp;     // Optional
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type AgentStatus = 'idle' | 'working' | 'blocked';
type TaskColumn = 'backlog' | 'todo' | 'in-progress' | 'review' | 'done';
type TaskPriority = 'low' | 'medium' | 'high';
```

---

## CLI Tool Reference

### Command Structure

```bash
node update-dashboard.js <command> [args] [options]
```

### Commands

#### Agent Commands

##### `add-agent`

**Syntax:**
```bash
node update-dashboard.js add-agent <name> [options]
```

**Parameters:**
- `name` (required) - Agent display name

**Options:**
- `--status <status>` - Agent status (default: `idle`)
- `--task <task>` - Current task description
- `--avatar <url>` - Avatar URL or emoji

**Example:**
```bash
node update-dashboard.js add-agent "Growth Research Agent" \
  --status working \
  --task "Analyzing LSM market data" \
  --avatar "🔬"
```

**Returns:**
```
✅ Agent created successfully
ID: agent-abc123xyz
Name: Growth Research Agent
Status: working
```

---

##### `update-agent`

**Syntax:**
```bash
node update-dashboard.js update-agent <agent-id> [options]
```

**Parameters:**
- `agent-id` (required) - Agent document ID

**Options:**
- `--name <name>` - Update agent name
- `--status <status>` - Update status
- `--task <task>` - Update current task
- `--avatar <url>` - Update avatar

**Example:**
```bash
node update-dashboard.js update-agent agent-abc123xyz \
  --status idle \
  --task "Completed LSM analysis"
```

**Returns:**
```
✅ Agent updated successfully
ID: agent-abc123xyz
Status: idle → working
```

---

##### `delete-agent`

**Syntax:**
```bash
node update-dashboard.js delete-agent <agent-id>
```

**Example:**
```bash
node update-dashboard.js delete-agent agent-abc123xyz
```

**Returns:**
```
✅ Agent deleted successfully
```

---

##### `list-agents`

**Syntax:**
```bash
node update-dashboard.js list-agents
```

**Returns:**
```
📋 Agents (3):

ID: agent-abc123
Name: Growth Research Agent
Status: working
Task: Analyzing LSM market data
Updated: 2026-01-30 20:15:00

ID: agent-def456
Name: Code Review Agent
Status: idle
Task: null
Updated: 2026-01-30 19:45:00

...
```

---

#### Project Commands

##### `add-project`

**Syntax:**
```bash
node update-dashboard.js add-project <name> [description]
```

**Parameters:**
- `name` (required) - Project name
- `description` (optional) - Project description

**Example:**
```bash
node update-dashboard.js add-project "Vuka Win Q1 Sprint" \
  "Growth from 30 to 5000 users"
```

**Returns:**
```
✅ Project created successfully
ID: project-xyz789
Name: Vuka Win Q1 Sprint
```

---

##### `update-project`

**Syntax:**
```bash
node update-dashboard.js update-project <project-id> [options]
```

**Options:**
- `--name <name>` - Update project name
- `--description <desc>` - Update description

**Example:**
```bash
node update-dashboard.js update-project project-xyz789 \
  --name "Vuka Win Growth Sprint" \
  --description "Accelerated user acquisition campaign"
```

---

##### `delete-project`

**Syntax:**
```bash
node update-dashboard.js delete-project <project-id>
```

---

##### `list-projects`

**Syntax:**
```bash
node update-dashboard.js list-projects
```

**Returns:**
```
📋 Projects (2):

ID: project-xyz789
Name: Vuka Win Q1 Sprint
Description: Growth from 30 to 5000 users
Created: 2026-01-28 10:00:00

...
```

---

#### Task Commands

##### `add-task`

**Syntax:**
```bash
node update-dashboard.js add-task <title> [options]
```

**Parameters:**
- `title` (required) - Task title

**Options:**
- `--project <id>` - Project ID (required)
- `--agent <id>` - Agent ID (required)
- `--column <col>` - Column (default: `backlog`)
- `--priority <pri>` - Priority (default: `medium`)
- `--description <desc>` - Task description
- `--due <date>` - Due date (ISO 8601 format)

**Example:**
```bash
node update-dashboard.js add-task "Research competitor pricing" \
  --project project-xyz789 \
  --agent agent-abc123 \
  --column todo \
  --priority high \
  --description "Analyze top 5 competitors" \
  --due "2026-02-15"
```

**Returns:**
```
✅ Task created successfully
ID: task-qwe456
Title: Research competitor pricing
Project: Vuka Win Q1 Sprint
Agent: Growth Research Agent
Column: todo
Priority: high
```

---

##### `update-task`

**Syntax:**
```bash
node update-dashboard.js update-task <task-id> [options]
```

**Options:**
- `--title <title>` - Update title
- `--column <col>` - Move to column
- `--priority <pri>` - Update priority
- `--agent <id>` - Reassign agent
- `--project <id>` - Move to project
- `--description <desc>` - Update description
- `--due <date>` - Update due date

**Example:**
```bash
node update-dashboard.js update-task task-qwe456 \
  --column in-progress \
  --priority urgent
```

**Returns:**
```
✅ Task updated successfully
ID: task-qwe456
Column: todo → in-progress
Priority: high → urgent
```

---

##### `delete-task`

**Syntax:**
```bash
node update-dashboard.js delete-task <task-id>
```

---

##### `list-tasks`

**Syntax:**
```bash
node update-dashboard.js list-tasks [options]
```

**Options:**
- `--agent <id>` - Filter by agent
- `--project <id>` - Filter by project
- `--column <col>` - Filter by column
- `--priority <pri>` - Filter by priority

**Example:**
```bash
# All tasks
node update-dashboard.js list-tasks

# Agent's tasks
node update-dashboard.js list-tasks --agent agent-abc123

# Project's tasks
node update-dashboard.js list-tasks --project project-xyz789

# High-priority in-progress tasks
node update-dashboard.js list-tasks --column in-progress --priority high
```

**Returns:**
```
📋 Tasks (5):

ID: task-qwe456
Title: Research competitor pricing
Project: Vuka Win Q1 Sprint (project-xyz789)
Agent: Growth Research Agent (agent-abc123)
Column: in-progress
Priority: high
Due: 2026-02-15
Created: 2026-01-30 14:00:00
Updated: 2026-01-30 20:30:00

...
```

---

## Firebase Firestore Schema

### Security Rules

**Current Rules** (Open - update for production):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /agents/{agentId} {
      allow read, write: if true;
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

**Production Rules** (Recommended):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Require authentication
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Or specific API key validation
    match /agents/{agentId} {
      allow read: if true;
      allow write: if request.auth.token.admin == true;
    }
    // ... similar for projects, tasks
  }
}
```

---

### Indexes

**Compound Indexes** (create in Firebase Console):

```javascript
// tasks collection
{
  fields: [
    { fieldPath: 'projectId', order: 'ASCENDING' },
    { fieldPath: 'column', order: 'ASCENDING' }
  ]
},
{
  fields: [
    { fieldPath: 'agentId', order: 'ASCENDING' },
    { fieldPath: 'column', order: 'ASCENDING' }
  ]
},
{
  fields: [
    { fieldPath: 'priority', order: 'DESCENDING' },
    { fieldPath: 'dueDate', order: 'ASCENDING' }
  ]
}
```

**Why:** Enable efficient queries like "all high-priority tasks due soon" or "all in-progress tasks for agent X"

---

## Integration Guide

### OpenClaw Agent Integration

**Scenario:** Update dashboard when spawning/monitoring agents

#### Step 1: Add Agent to Dashboard

```bash
# In your main Gereld session
cd /root/.openclaw/workspace/gereld-project-manager

node update-dashboard.js add-agent "Research Agent" \
  --status working \
  --task "Market analysis for Vuka Win"
```

#### Step 2: Spawn Agent Session

```bash
sessions_spawn task="Research LSM demographics and ad platform preferences"
```

#### Step 3: Track in HEARTBEAT.md

```markdown
### Agent Status Check
1. List all isolated sessions
2. For each active agent:
   - Check latest message
   - Update dashboard status
   - Move tasks between columns
```

#### Step 4: Heartbeat Monitoring

```bash
# Every 2-4 heartbeats (~30-60 min)
sessions_list kinds=isolated limit=10

# For each active session:
sessions_history sessionKey=<key> limit=3

# Update dashboard:
node update-dashboard.js update-agent <agent-id> \
  --status working \
  --task "Latest progress from session history"

# Move tasks:
node update-dashboard.js update-task <task-id> --column done
```

---

### Programmatic Usage (Node.js)

**Direct Firestore Access:**

```javascript
const admin = require('firebase-admin');

// Initialize (using service account)
admin.initializeApp({
  credential: admin.credential.cert(require('./service-account.json'))
});

const db = admin.firestore();

// Add agent
async function addAgent(name, status, task) {
  const agentRef = await db.collection('agents').add({
    name,
    status,
    currentTask: task,
    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
  });
  
  return agentRef.id;
}

// Update agent
async function updateAgent(agentId, updates) {
  await db.collection('agents').doc(agentId).update({
    ...updates,
    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
  });
}

// Query tasks
async function getAgentTasks(agentId, column) {
  const snapshot = await db.collection('tasks')
    .where('agentId', '==', agentId)
    .where('column', '==', column)
    .get();
    
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
```

---

### REST API (via Cloud Functions)

**Optional:** Deploy Cloud Functions for HTTP API

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.addAgent = functions.https.onRequest(async (req, res) => {
  const { name, status, task } = req.body;
  
  const agentRef = await admin.firestore().collection('agents').add({
    name,
    status: status || 'idle',
    currentTask: task || null,
    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
  });
  
  res.json({ id: agentRef.id, name, status });
});

// Deploy: firebase deploy --only functions
```

**Usage:**
```bash
curl -X POST https://us-central1-gereld-project-manager.cloudfunctions.net/addAgent \
  -H "Content-Type: application/json" \
  -d '{"name":"Research Agent","status":"working","task":"Market analysis"}'
```

---

## Error Handling

### Common Errors

#### `PERMISSION_DENIED`

**Cause:** Firestore security rules blocking access

**Solution:**
- Check Firebase Console → Firestore → Rules
- Verify CLI has admin credentials
- Update rules to allow write access

#### `NOT_FOUND`

**Cause:** Document ID doesn't exist

**Solution:**
```bash
# Verify ID exists
node update-dashboard.js list-agents
node update-dashboard.js list-projects

# Use correct ID from list output
```

#### `INVALID_ARGUMENT`

**Cause:** Invalid field value (e.g., wrong status, column name)

**Solution:**
- Check allowed values in type definitions
- Use exact case-sensitive values: `working` not `Working`

---

## Rate Limits & Performance

### Firestore Limits

- **Writes:** 10,000/second per database
- **Reads:** 50,000/second per database
- **Document Size:** Max 1 MB

### Best Practices

1. **Batch Updates:**
```javascript
const batch = db.batch();
batch.update(agentRef, { status: 'idle' });
batch.update(taskRef, { column: 'done' });
await batch.commit(); // 1 write instead of 2
```

2. **Minimize Reads:**
- Cache agent/project lists locally
- Only query what you need (use filters)

3. **Use Timestamps:**
- Always include `updatedAt` on writes
- Enables "changed since" queries

---

## Changelog

### v1.0.0 (2026-01-30)

**Initial Release:**
- 3-view dashboard (Overview, Agent, Project)
- Full CRUD operations via CLI
- Real-time sync
- Drag & drop kanban
- Firebase Firestore backend

**Future Roadmap:**
- Authentication (Firebase Auth)
- Webhooks (notify on status changes)
- REST API (Cloud Functions)
- Notifications (push alerts)
- Time tracking per task
- Agent analytics dashboard

---

## Support

**Live Dashboard:** https://gereld-project-manager.web.app

**GitHub:** https://github.com/GeraldsCreations/gereld-project-manager

**Built by:** Gereld 🍆 for managing AI agent workflows

---

*Last updated: 2026-01-30*
