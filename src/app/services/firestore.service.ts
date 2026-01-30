import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, updateDoc, addDoc, deleteDoc, query, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

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
}

@Injectable({
    providedIn: 'root'
})
export class FirestoreService {
    private firestore = inject(Firestore);

    // Agents
    getAgents(): Observable<Agent[]> {
        const agentsCol = collection(this.firestore, 'agents');
        return collectionData(agentsCol, { idField: 'id' }) as Observable<Agent[]>;
    }

    // Projects
    getProjects(): Observable<Project[]> {
        const projectsCol = collection(this.firestore, 'projects');
        return collectionData(projectsCol, { idField: 'id' }) as Observable<Project[]>;
    }

    // Tasks
    getTasks(): Observable<Task[]> {
        const tasksCol = collection(this.firestore, 'tasks');
        return collectionData(tasksCol, { idField: 'id' }) as Observable<Task[]>;
    }

    getTasksByAgent(agentId: string): Observable<Task[]> {
        const tasksCol = collection(this.firestore, 'tasks');
        const q = query(tasksCol, where('agentId', '==', agentId));
        return collectionData(q, { idField: 'id' }) as Observable<Task[]>;
    }

    getTasksByProject(projectId: string): Observable<Task[]> {
        const tasksCol = collection(this.firestore, 'tasks');
        const q = query(tasksCol, where('projectId', '==', projectId));
        return collectionData(q, { idField: 'id' }) as Observable<Task[]>;
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
