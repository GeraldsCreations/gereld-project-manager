import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DragDropModule } from 'primeng/dragdrop';
import { FirestoreService, Task, Project, Agent } from '../../services/firestore.service';

@Component({
    selector: 'app-project-board',
    standalone: true,
    imports: [CommonModule, CardModule, ButtonModule, TagModule, DragDropModule],
    template: `
        <div class="grid">
            <div class="col-12">
                <div class="card">
                    <div class="flex align-items-center mb-3">
                        <p-button icon="pi pi-arrow-left" 
                                  [text]="true" 
                                  (onClick)="goBack()">
                        </p-button>
                        <div class="ml-2">
                            <h2>{{ project?.name }}</h2>
                            <p class="text-color-secondary" *ngIf="project?.description">
                                {{ project.description }}
                            </p>
                        </div>
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
                                    <div class="flex align-items-center gap-2">
                                        <p-tag [value]="task.priority" 
                                               [severity]="getPrioritySeverity(task.priority)">
                                        </p-tag>
                                        <span class="text-sm">
                                            <i class="pi pi-user mr-1"></i>
                                            {{ getAgentName(task.agentId) }}
                                        </span>
                                    </div>
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
export class ProjectBoard implements OnInit {
    project: Project | null = null;
    tasks: Task[] = [];
    agents: Agent[] = [];
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
        const projectId = this.route.snapshot.paramMap.get('id');
        if (projectId) {
            // Load project info
            this.firestoreService.getProjects().subscribe(projects => {
                this.project = projects.find(p => p.id === projectId) || null;
            });

            // Load tasks for this project
            this.firestoreService.getTasksByProject(projectId).subscribe(tasks => {
                this.tasks = tasks;
            });

            // Load all agents
            this.firestoreService.getAgents().subscribe(agents => {
                this.agents = agents;
            });
        }
    }

    getTasksByColumn(column: string): Task[] {
        return this.tasks.filter(t => t.column === column);
    }

    getAgentName(agentId: string): string {
        const agent = this.agents.find(a => a.id === agentId);
        return agent?.name || 'Unassigned';
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
