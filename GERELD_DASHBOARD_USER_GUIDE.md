# Gereld PM Dashboard - User Guide 🍆

**AI Agent Workforce Management System**

Live URL: https://gereld-project-manager.web.app

---

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Dashboard Views](#dashboard-views)
4. [CLI Tool](#cli-tool)
5. [Workflow Examples](#workflow-examples)
6. [Best Practices](#best-practices)

---

## Overview

The Gereld PM Dashboard is a real-time kanban board system designed to manage AI agents, their tasks, and projects. It provides visibility into what your AI workforce is doing at any moment.

### Key Features

- **Real-time Updates** - See changes instantly across all views
- **3-View System** - Overview → Agent → Project perspectives
- **Drag & Drop Kanban** - Move tasks between columns visually
- **CLI Management** - Update from command line (perfect for AI agents)
- **Multi-Project Support** - Track work across multiple initiatives

---

## Getting Started

### Accessing the Dashboard

**Web Interface:** https://gereld-project-manager.web.app

**CLI Tool Location:** `/root/.openclaw/workspace/gereld-project-manager/update-dashboard.js`

### Quick Setup

```bash
cd /root/.openclaw/workspace/gereld-project-manager

# List everything to see current state
node update-dashboard.js list-agents
node update-dashboard.js list-projects
node update-dashboard.js list-tasks
```

---

## Dashboard Views

### 1. Overview Dashboard (`/`)

**Purpose:** High-level view of all AI agents

**Shows:**
- Agent name & avatar
- Current task (what they're working on right now)
- Status badge (idle/working/blocked)
- Last update timestamp

**Actions:**
- Click any agent card → Jump to Agent View

**When to Use:**
- Quick status check: "What are all my agents doing?"
- Finding idle agents for new work
- Monitoring overall workforce activity

---

### 2. Agent View (`/agent/:id`)

**Purpose:** See all tasks for a specific agent across ALL projects

**Layout:** Kanban board with 5 columns
- **Backlog** - Future tasks, not yet scheduled
- **To Do** - Ready to start
- **In Progress** - Currently working on
- **Review** - Awaiting review/approval
- **Done** - Completed

**Task Card Shows:**
- Task title
- Project name (badge)
- Priority (high/medium/low)
- Due date (if set)

**Actions:**
- Drag & drop tasks between columns
- Click task to edit details
- Filter by project

**When to Use:**
- Managing a specific agent's workload
- Seeing what projects one agent is involved in
- Prioritizing tasks for an agent

---

### 3. Project Board (`/project/:id`)

**Purpose:** See all tasks for a specific project across ALL agents

**Layout:** Same 5-column kanban structure

**Task Card Shows:**
- Task title
- Assigned agent (badge)
- Priority
- Due date

**Actions:**
- Drag & drop tasks between columns
- Click task to edit details
- See which agents are working on the project

**When to Use:**
- Managing a project's progress
- Seeing workload distribution across agents
- Sprint planning for a specific initiative

---

## CLI Tool

### Location

```bash
/root/.openclaw/workspace/gereld-project-manager/update-dashboard.js
```

### Common Commands

#### List Commands

```bash
# List all agents
node update-dashboard.js list-agents

# List all projects
node update-dashboard.js list-projects

# List all tasks
node update-dashboard.js list-tasks

# List tasks for specific agent
node update-dashboard.js list-tasks --agent <agent-id>

# List tasks for specific project
node update-dashboard.js list-tasks --project <project-id>
```

#### Agent Commands

```bash
# Add new agent
node update-dashboard.js add-agent "Agent Name" \
  --status working \
  --task "Current task description"

# Update agent status
node update-dashboard.js update-agent <agent-id> \
  --status idle \
  --task "Completed XYZ"

# Delete agent
node update-dashboard.js delete-agent <agent-id>
```

**Agent Status Values:**
- `idle` - Not currently working
- `working` - Actively on a task
- `blocked` - Waiting on something

#### Project Commands

```bash
# Add new project
node update-dashboard.js add-project "Project Name" "Optional description"

# Update project
node update-dashboard.js update-project <project-id> \
  --name "New Name" \
  --description "New description"

# Delete project
node update-dashboard.js delete-project <project-id>
```

#### Task Commands

```bash
# Add new task
node update-dashboard.js add-task "Task Title" \
  --project <project-id> \
  --agent <agent-id> \
  --column backlog \
  --priority medium

# Update task
node update-dashboard.js update-task <task-id> \
  --column in-progress \
  --priority high

# Delete task
node update-dashboard.js delete-task <task-id>
```

**Task Columns:**
- `backlog`, `todo`, `in-progress`, `review`, `done`

**Priority Levels:**
- `low`, `medium`, `high`

---

## Workflow Examples

### Example 1: Spawning a New Agent

**Scenario:** You spawn an isolated agent session to work on user growth research.

**Steps:**

1. **Create the agent in dashboard FIRST:**
```bash
node update-dashboard.js add-agent "Growth Research Agent" \
  --status working \
  --task "Vuka Win user acquisition analysis"
```

2. **Spawn the agent session:**
```bash
sessions_spawn task="Research LSM market behavior for Vuka Win"
```

3. **Create project tasks:**
```bash
# Get agent ID from list-agents
AGENT_ID="agent-abc123"
PROJECT_ID="vuka-win-xyz"

node update-dashboard.js add-task "Research LSM demographics" \
  --project $PROJECT_ID \
  --agent $AGENT_ID \
  --column in-progress \
  --priority high
```

4. **When agent completes work:**
```bash
node update-dashboard.js update-agent $AGENT_ID \
  --status idle \
  --task "Completed LSM market analysis"

node update-dashboard.js update-task <task-id> \
  --column done
```

---

### Example 2: Heartbeat Monitoring

**Scenario:** During a heartbeat, check on all agents and update dashboard.

**Steps:**

1. **List active agent sessions:**
```bash
sessions_list kinds=isolated
```

2. **For each active agent:**
```bash
# Check their latest message
sessions_history sessionKey=<session-key> limit=3

# Update dashboard if status changed
node update-dashboard.js update-agent <agent-id> \
  --status working \
  --task "Updated task description from latest message"

# Move tasks if work progressed
node update-dashboard.js update-task <task-id> --column review
```

3. **Log in HEARTBEAT.md:**
```markdown
**Last Agent Check:** 2026-01-30 20:00 UTC
**Agents Monitored:** 3
**Updates Made:** Agent-123 (working → idle), Task-456 (in-progress → done)
```

---

### Example 3: Project Sprint Planning

**Scenario:** Setting up a new sprint for Vuka Win project.

**Steps:**

1. **Create project (if not exists):**
```bash
node update-dashboard.js add-project "Vuka Win Q1 Sprint" \
  "Focus: 30 → 5000 users by June"
```

2. **Add sprint tasks:**
```bash
PROJECT_ID="<from-list-projects>"

node update-dashboard.js add-task "Implement referral system" \
  --project $PROJECT_ID --column backlog --priority high

node update-dashboard.js add-task "LSM market research" \
  --project $PROJECT_ID --column backlog --priority high

node update-dashboard.js add-task "Ad platform integration" \
  --project $PROJECT_ID --column backlog --priority medium
```

3. **Assign to agents:**
```bash
# Assign tasks by updating with agent ID
node update-dashboard.js update-task <task-id> --agent <agent-id>
```

4. **Monitor progress via Project Board:**
   - Open `https://gereld-project-manager.web.app/project/<project-id>`
   - Drag tasks through columns as work progresses

---

## Best Practices

### 1. Dashboard-First Workflow

**Always update dashboard BEFORE spawning agents:**
```bash
# ✅ Right
node update-dashboard.js add-agent "New Agent"
sessions_spawn task="Work to do"

# ❌ Wrong
sessions_spawn task="Work to do"
# (Chadizzle has no visibility)
```

### 2. Heartbeat Monitoring

**Check on agents every 2-4 heartbeats (~30-60 min):**
- List isolated sessions
- Update agent status if changed
- Move tasks between columns
- Log updates in HEARTBEAT.md

### 3. Status Accuracy

**Keep agent status current:**
- `working` - Has active task, session running
- `idle` - No current work, available
- `blocked` - Waiting on external dependency

### 4. Task Hygiene

**Move tasks promptly:**
- Start work → Move to `in-progress`
- Submit for review → Move to `review`
- Complete → Move to `done`
- Don't let tasks sit in wrong column

### 5. Meaningful Task Titles

**Good:**
- "Research LSM user behavior patterns"
- "Implement Firebase auth module"
- "Analyze competitor pricing models"

**Bad:**
- "Do research"
- "Fix stuff"
- "Work on thing"

### 6. Priority Management

**Use priority levels consistently:**
- `high` - Urgent, blocks other work
- `medium` - Important, normal timeline
- `low` - Nice to have, no deadline pressure

---

## Troubleshooting

### Dashboard Not Updating

**Issue:** Changes via CLI don't appear in web UI

**Solution:**
- Check internet connection
- Refresh browser (Ctrl+R)
- Verify Firebase connection (console logs)
- Check CLI command output for errors

### Agent Not Listed

**Issue:** Added agent doesn't show up

**Solution:**
```bash
# Verify agent was created
node update-dashboard.js list-agents

# Check agent ID was returned correctly
# If not found, try adding again
```

### Tasks Not Showing in Project Board

**Issue:** Tasks exist but don't appear in project view

**Solution:**
```bash
# Verify task has correct project ID
node update-dashboard.js list-tasks --project <project-id>

# Check projectId matches exactly
# Update if needed:
node update-dashboard.js update-task <task-id> --project <correct-id>
```

---

## Support

**Dashboard URL:** https://gereld-project-manager.web.app

**GitHub:** https://github.com/GeraldsCreations/gereld-project-manager

**Built by:** Gereld 🍆 for managing AI agent workflows

---

*Last updated: 2026-01-30*
