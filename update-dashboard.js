#!/usr/bin/env node
/**
 * Gereld PM Dashboard Updater
 * 
 * Usage:
 *   node update-dashboard.js add-agent "Agent Name" --status working --task "Current task"
 *   node update-dashboard.js add-project "Project Name" "Description"
 *   node update-dashboard.js add-task "Task Title" --project "project-id" --agent "agent-id" --column in-progress --priority high
 *   node update-dashboard.js update-agent "agent-id" --status idle
 *   node update-dashboard.js update-task "task-id" --column done
 *   node update-dashboard.js list-agents
 *   node update-dashboard.js list-projects
 *   node update-dashboard.js list-tasks
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, doc, updateDoc, getDocs, query, where, Timestamp } = require('firebase/firestore');

// Firebase config
const firebaseConfig = {
    apiKey: 'AIzaSyCUxfXeFRxPZC2d5v4zvbP0wL2vv7WaF94',
    authDomain: 'gereld-project-manager.firebaseapp.com',
    projectId: 'gereld-project-manager',
    storageBucket: 'gereld-project-manager.firebasestorage.app',
    messagingSenderId: '887919771925',
    appId: '1:887919771925:web:c176391baafb71c53da91c',
    measurementId: 'G-61JD91X890'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const parseArgs = () => {
    const args = process.argv.slice(2);
    const command = args[0];
    const params = {};
    let positional = [];
    
    for (let i = 1; i < args.length; i++) {
        if (args[i].startsWith('--')) {
            const key = args[i].substring(2);
            const value = args[i + 1];
            params[key] = value;
            i++;
        } else {
            positional.push(args[i]);
        }
    }
    
    return { command, positional, params };
};

const addAgent = async (name, params) => {
    const agent = {
        name,
        status: params.status || 'idle',
        currentTask: params.task || null,
        avatar: params.avatar || null,
        lastUpdated: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'agents'), agent);
    console.log(`✅ Agent added: ${name} (ID: ${docRef.id})`);
    return docRef.id;
};

const addProject = async (name, description) => {
    const project = {
        name,
        description: description || null,
        createdAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'projects'), project);
    console.log(`✅ Project added: ${name} (ID: ${docRef.id})`);
    return docRef.id;
};

const addTask = async (title, params) => {
    const task = {
        title,
        description: params.description || null,
        projectId: params.project,
        agentId: params.agent,
        column: params.column || 'backlog',
        priority: params.priority || 'medium',
        dueDate: params.dueDate ? Timestamp.fromDate(new Date(params.dueDate)) : null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'tasks'), task);
    console.log(`✅ Task added: ${title} (ID: ${docRef.id})`);
    return docRef.id;
};

const updateAgent = async (id, params) => {
    const updates = {};
    if (params.status) updates.status = params.status;
    if (params.task !== undefined) updates.currentTask = params.task;
    if (params.avatar) updates.avatar = params.avatar;
    updates.lastUpdated = Timestamp.now();
    
    await updateDoc(doc(db, 'agents', id), updates);
    console.log(`✅ Agent updated: ${id}`);
};

const updateTask = async (id, params) => {
    const updates = {};
    if (params.column) updates.column = params.column;
    if (params.priority) updates.priority = params.priority;
    if (params.status) updates.status = params.status;
    if (params.agent) updates.agentId = params.agent;
    updates.updatedAt = Timestamp.now();
    
    await updateDoc(doc(db, 'tasks', id), updates);
    console.log(`✅ Task updated: ${id}`);
};

const listAgents = async () => {
    const snapshot = await getDocs(collection(db, 'agents'));
    console.log(`\n📋 Agents (${snapshot.size}):\n`);
    snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`  ${doc.id}`);
        console.log(`    Name: ${data.name}`);
        console.log(`    Status: ${data.status}`);
        console.log(`    Current Task: ${data.currentTask || 'None'}\n`);
    });
};

const listProjects = async () => {
    const snapshot = await getDocs(collection(db, 'projects'));
    console.log(`\n📋 Projects (${snapshot.size}):\n`);
    snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`  ${doc.id}`);
        console.log(`    Name: ${data.name}`);
        console.log(`    Description: ${data.description || 'None'}\n`);
    });
};

const listTasks = async () => {
    const snapshot = await getDocs(collection(db, 'tasks'));
    console.log(`\n📋 Tasks (${snapshot.size}):\n`);
    snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`  ${doc.id}`);
        console.log(`    Title: ${data.title}`);
        console.log(`    Project: ${data.projectId}`);
        console.log(`    Agent: ${data.agentId}`);
        console.log(`    Column: ${data.column}`);
        console.log(`    Priority: ${data.priority}\n`);
    });
};

const main = async () => {
    const { command, positional, params } = parseArgs();
    
    try {
        switch (command) {
            case 'add-agent':
                if (!positional[0]) throw new Error('Agent name required');
                await addAgent(positional[0], params);
                break;
            
            case 'add-project':
                if (!positional[0]) throw new Error('Project name required');
                await addProject(positional[0], positional[1]);
                break;
            
            case 'add-task':
                if (!positional[0]) throw new Error('Task title required');
                if (!params.project) throw new Error('--project required');
                if (!params.agent) throw new Error('--agent required');
                await addTask(positional[0], params);
                break;
            
            case 'update-agent':
                if (!positional[0]) throw new Error('Agent ID required');
                await updateAgent(positional[0], params);
                break;
            
            case 'update-task':
                if (!positional[0]) throw new Error('Task ID required');
                await updateTask(positional[0], params);
                break;
            
            case 'list-agents':
                await listAgents();
                break;
            
            case 'list-projects':
                await listProjects();
                break;
            
            case 'list-tasks':
                await listTasks();
                break;
            
            default:
                console.log(`
🍆 Gereld PM Dashboard Updater

Commands:
  add-agent <name> [--status idle|working|blocked] [--task "Task text"]
  add-project <name> [description]
  add-task <title> --project <id> --agent <id> [--column backlog|todo|in-progress|review|done] [--priority low|medium|high]
  update-agent <id> [--status idle|working|blocked] [--task "Task text"]
  update-task <id> [--column backlog|todo|in-progress|review|done] [--priority low|medium|high]
  list-agents
  list-projects
  list-tasks

Examples:
  node update-dashboard.js add-agent "Growth Research Agent" --status working --task "Analyzing LSM market"
  node update-dashboard.js add-project "Vuka Win" "South Africa user growth"
  node update-dashboard.js list-agents
                `);
        }
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
    
    process.exit(0);
};

main();
