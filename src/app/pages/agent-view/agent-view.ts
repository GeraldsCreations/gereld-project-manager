import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DragDropModule } from 'primeng/dragdrop';
import { FirestoreService, Task, Agent } from '../../services/firestore.service';

@Component({
    selector: 'app-agent-view',
    standalone: true,
    imports: [CommonModule, CardModule, ButtonModule, TagModule, DragDropModule],
    template: `
        <div class="grid">
            <div class="col-12">
                <div class="card">
                    <div class="flex align-items-center justify-content-between mb-3">
                        <div>
                            <p-button icon="pi pi-arrow-left" 
                                      [text]="true" 
                                      (onClick)="goBack()">
                            </p-button>
                            <h2 class="inline-block ml-2">{{ agent?.name }} - Tasks</h2>
                        </div>
                        <p-tag [value]="agent?.status || 'loading'" [severity]="getStatusSeverity(agent?.status || 'idle')"></p-tag>
                    </div>
                </div>
            </div>

            <div class="col-12 md:col-6 lg" *ngFor="let column of columns">
                <div class="card">
                    <h5>{{ column.label }} ({{ getTasksByColumn(column.value).length }})</h5>
                    <div class="kanban-column" 
                         pDroppable="tasks"
                         (onDrop)="onDrop($event, column.value)">
                        
                        <div *ngFor="let task of getTasksByColumn(column.value)" 
                             class="task-card mb-2"
                             pDraggable="tasks"
                             (onDragStart)="dragStart(task)"
                             (onDragEnd)="dragEnd()">
                            
                            <p-card>
                                <div class="font-bold mb-2">{{ task.title }}</div>
                                <div class="text-sm text-color-secondary mb-2" *ngIf="task.description">
                                    {{ task.description }}
                                </div>
                                <div class="flex align-items-center justify-content-between">
                                    <p-tag [value]="task.priority" 
                                           [severity]="getPrioritySeverity(task.priority)">
                                    </p-tag>
                                    <span class="text-sm text-color-secondary" *ngIf="task.dueDate">
                                        {{ task.dueDate | date:'short' }}
                                    </span>
                                </div>
                            </p-card>
                        </div>

                        <div *ngIf="getTasksByColumn(column.value).length === 0" 
                             class="text-center text-color-secondary p-3">
                            No tasks
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .kanban-column {
            min-height: 400px;
            background: var(--surface-50);
            border-radius: 6px;
            padding: 1rem;
        }
        .task-card {
            cursor: move;
        }
        .task-card:hover {
            opacity: 0.9;
        }
    `]
})
export class AgentView implements OnInit {
    agent: Agent | null = null;
    tasks: Task[] = [];
    draggedTask: Task | null = null;

    columns = [
        { value: 'backlog', label: 'Backlog' },
        { value: 'todo', label: 'To Do' },
        { value: 'in-progress', label: 'In Progress' },
        { value: 'review', label: 'Review' },
        { value: 'done', label: 'Done' }
    ];

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private firestoreService: FirestoreService
    ) {}

    ngOnInit() {
        const agentId = this.route.snapshot.paramMap.get('id');
        if (agentId) {
            // Load agent info
            this.firestoreService.getAgents().subscribe(agents => {
                this.agent = agents.find(a => a.id === agentId) || null;
            });

            // Load tasks for this agent
            this.firestoreService.getTasksByAgent(agentId).subscribe(tasks => {
                this.tasks = tasks;
            });
        }
    }

    getTasksByColumn(column: string): Task[] {
        return this.tasks.filter(t => t.column === column);
    }

    dragStart(task: Task) {
        this.draggedTask = task;
    }

    dragEnd() {
        this.draggedTask = null;
    }

    async onDrop(event: any, newColumn: string) {
        if (this.draggedTask && this.draggedTask.id) {
            await this.firestoreService.updateTask(this.draggedTask.id, { column: newColumn as any });
        }
    }

    getStatusSeverity(status: string): 'success' | 'warning' | 'danger' | 'info' {
        switch (status) {
            case 'working': return 'success';
            case 'blocked': return 'danger';
            case 'idle': return 'info';
            default: return 'info';
        }
    }

    getPrioritySeverity(priority: string): 'success' | 'warning' | 'danger' {
        switch (priority) {
            case 'high': return 'danger';
            case 'medium': return 'warning';
            case 'low': return 'success';
            default: return 'success';
        }
    }

    goBack() {
        this.router.navigate(['/']);
    }
}
