import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, updateDoc, addDoc, deleteDoc, query, where, orderBy, limit } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Agent {
    id?: string;
    name: string;
    avatar?: string;
    currentTask?: string;
    status: 'idle' | 'working' | 'blocked';
    lastUpdated: Date;
}

export interface Project {
    id?: string;
    name: string;
    description?: string;
    createdAt: Date;
}

export interface Task {
    id?: string;
    title: string;
    description?: string;
    projectId: string;
    agentId: string;
    column: 'backlog' | 'todo' | 'in-progress' | 'review' | 'done';
    priority: 'low' | 'medium' | 'high';
    dueDate?: Date;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date; // When task was marked as done
    // Document/Report fields
    documentType?: 'report' | 'document' | 'code' | 'analysis' | 'summary' | 'none';
    documentUrl?: string; // URL to external document
    reportContent?: string; // Inline report/document content (markdown/text)
    attachments?: { name: string; url: string; type: string }[]; // Multiple attachments
}

// NEW: Activity tracking interface
export interface TaskActivity {
    id?: string;
    taskId: string;
    taskTitle: string;
    agentId: string;
    agentName: string;
    action: 'created' | 'moved' | 'completed' | 'assigned' | 'updated';
    fromColumn?: string;
    toColumn?: string;
    timestamp: Date;
    metadata?: any; // Additional context
}

@Injectable({
    providedIn: 'root'
})
export class FirestoreService {
    private firestore = inject(Firestore);

    // Agents
    getAgents(): Observable<Agent[]> {
        const agentsCol = collection(this.firestore, 'agents');
        return (collectionData(agentsCol, { idField: 'id' }) as Observable<any[]>).pipe(
            map(agents => agents.map(agent => ({
                ...agent,
                lastUpdated: agent.lastUpdated?.toDate() || new Date()
            })))
        );
    }

    // Projects
    getProjects(): Observable<Project[]> {
        const projectsCol = collection(this.firestore, 'projects');
        return (collectionData(projectsCol, { idField: 'id' }) as Observable<any[]>).pipe(
            map(projects => projects.map(project => ({
                ...project,
                createdAt: project.createdAt?.toDate() || new Date()
            })))
        );
    }

    // Tasks
    getTasks(): Observable<Task[]> {
        const tasksCol = collection(this.firestore, 'tasks');
        return (collectionData(tasksCol, { idField: 'id' }) as Observable<any[]>).pipe(
            map(tasks => tasks.map(task => this.convertTaskDates(task)))
        );
    }

    getTasksByAgent(agentId: string): Observable<Task[]> {
        const tasksCol = collection(this.firestore, 'tasks');
        const q = query(tasksCol, where('agentId', '==', agentId));
        return (collectionData(q, { idField: 'id' }) as Observable<any[]>).pipe(
            map(tasks => tasks.map(task => this.convertTaskDates(task)))
        );
    }

    getTasksByProject(projectId: string): Observable<Task[]> {
        const tasksCol = collection(this.firestore, 'tasks');
        const q = query(tasksCol, where('projectId', '==', projectId));
        return (collectionData(q, { idField: 'id' }) as Observable<any[]>).pipe(
            map(tasks => tasks.map(task => this.convertTaskDates(task)))
        );
    }

    // NEW: Activity tracking methods
    getActivitiesByAgent(agentId: string, limitCount: number = 20): Observable<TaskActivity[]> {
        const activitiesCol = collection(this.firestore, 'activities');
        const q = query(
            activitiesCol,
            where('agentId', '==', agentId),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );
        return (collectionData(q, { idField: 'id' }) as Observable<any[]>).pipe(
            map(activities => activities.map(activity => ({
                ...activity,
                timestamp: activity.timestamp?.toDate() || new Date()
            })))
        );
    }

    getActivitiesByTask(taskId: string): Observable<TaskActivity[]> {
        const activitiesCol = collection(this.firestore, 'activities');
        const q = query(
            activitiesCol,
            where('taskId', '==', taskId),
            orderBy('timestamp', 'desc')
        );
        return (collectionData(q, { idField: 'id' }) as Observable<any[]>).pipe(
            map(activities => activities.map(activity => ({
                ...activity,
                timestamp: activity.timestamp?.toDate() || new Date()
            })))
        );
    }

    async logActivity(activity: Omit<TaskActivity, 'id' | 'timestamp'>): Promise<void> {
        const activitiesCol = collection(this.firestore, 'activities');
        await addDoc(activitiesCol, {
            ...activity,
            timestamp: new Date()
        });
    }

    private convertTaskDates(task: any): Task {
        return {
            ...task,
            createdAt: task.createdAt?.toDate() || new Date(),
            updatedAt: task.updatedAt?.toDate() || new Date(),
            dueDate: task.dueDate?.toDate() || undefined,
            completedAt: task.completedAt?.toDate() || undefined
        };
    }

    async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
        const taskDoc = doc(this.firestore, `tasks/${taskId}`);
        await updateDoc(taskDoc, { ...updates, updatedAt: new Date() });
    }

    async addTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
        const tasksCol = collection(this.firestore, 'tasks');
        await addDoc(tasksCol, {
            ...task,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }

    async deleteTask(taskId: string): Promise<void> {
        const taskDoc = doc(this.firestore, `tasks/${taskId}`);
        await deleteDoc(taskDoc);
    }
}
