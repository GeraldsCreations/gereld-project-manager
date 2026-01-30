import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { FirestoreService, Task, Project, Agent } from '../../services/firestore.service';

interface KanbanColumn {
    value: string;
    label: string;
    color: string;
    icon: string;
}

@Component({
    selector: 'app-project-board',
    standalone: true,
    imports: [CommonModule, CardModule, ButtonModule, TagModule, BadgeModule, ScrollPanelModule],
    template: `
        <div class="grid">
            <!-- Project Header -->
            <div class="col-12">
                <div class="card">
                    <div class="flex align-items-start justify-content-between gap-3">
                        <div class="flex align-items-start gap-3 flex-1">
                            <p-button 
                                icon="pi pi-arrow-left" 
                                [text]="true"
                                [rounded]="true"
                                severity="secondary"
                                (onClick)="goBack()">
                            </p-button>
                            <div class="flex-1">
                                <h1 class="text-3xl font-bold mb-2">{{ project?.name || 'Loading...' }}</h1>
                                <p class="text-color-secondary" *ngIf="project?.description">
                                    {{ project?.description }}
                                </p>
                                <div class="flex gap-3 mt-3 align-items-center">
                                    <div class="flex align-items-center gap-2">
                                        <i class="pi pi-calendar text-color-secondary"></i>
                                        <span class="text-sm">
                                            Created {{ project?.createdAt | date:'mediumDate' }}
                                        </span>
                                    </div>
                                    <div class="flex align-items-center gap-2">
                                        <i class="pi pi-list text-color-secondary"></i>
                                        <span class="text-sm font-semibold">
                                            {{ tasks.length }} {{ tasks.length === 1 ? 'task' : 'tasks' }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p-button 
                            label="Refresh" 
                            icon="pi pi-refresh" 
                            [outlined]="true"
                            size="small">
                        </p-button>
                    </div>
                </div>
            </div>

            <!-- Kanban Board -->
            <div class="col-12">
                <div class="kanban-container">
                    <div class="kanban-column" 
                         *ngFor="let column of columns"
                         [style.border-top]="'3px solid ' + column.color">
                        
                        <!-- Column Header (Sticky) -->
                        <div class="kanban-column-header">
                            <div class="flex align-items-center gap-2">
                                <i [class]="'pi ' + column.icon" 
                                   [style.color]="column.color"></i>
                                <span class="kanban-column-title">{{ column.label }}</span>
                            </div>
                            <span class="kanban-column-count">
                                {{ getTasksByColumn(column.value).length }}
                            </span>
                        </div>

                        <!-- Task Cards -->
                        <div class="kanban-column-content">
                            <div *ngFor="let task of getTasksByColumn(column.value)" 
                                 class="task-card task-card-priority-{{ task.priority }}"
                                 [class.task-card-overdue]="isOverdue(task)">
                                
                                <!-- Task Title -->
                                <div class="task-card-title">
                                    {{ task.title }}
                                </div>

                                <!-- Task Description -->
                                <div class="task-card-description" *ngIf="task.description">
                                    {{ task.description }}
                                </div>

                                <!-- Task Footer -->
                                <div class="task-card-footer">
                                    <div class="flex align-items-center gap-2 flex-wrap">
                                        <!-- Priority Badge -->
                                        <p-tag 
                                            [value]="task.priority" 
                                            [severity]="getPrioritySeverity(task.priority)"
                                            [style]="{'font-size': '0.75rem'}">
                                        </p-tag>
                                        
                                        <!-- Agent Assignee -->
                                        <div class="flex align-items-center gap-1 text-sm text-color-secondary">
                                            <i class="pi pi-user" style="font-size: 0.75rem"></i>
                                            <span>{{ getAgentName(task.agentId) }}</span>
                                        </div>
                                    </div>

                                    <!-- Due Date -->
                                    <div class="flex align-items-center gap-1" *ngIf="task.dueDate">
                                        <i class="pi pi-clock" 
                                           style="font-size: 0.75rem"
                                           [class.text-red-500]="isOverdue(task)"
                                           [class.text-color-secondary]="!isOverdue(task)"></i>
                                        <span class="text-xs"
                                              [class.text-red-500]="isOverdue(task)"
                                              [class.text-color-secondary]="!isOverdue(task)">
                                            {{ task.dueDate | date:'MMM d' }}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <!-- Empty State -->
                            <div *ngIf="getTasksByColumn(column.value).length === 0" 
                                 class="empty-state">
                                <div class="empty-state-icon">
                                    <i [class]="'pi ' + column.icon"></i>
                                </div>
                                <div class="empty-state-text">
                                    No tasks in {{ column.label.toLowerCase() }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Task Summary Cards -->
            <div class="col-12">
                <div class="grid">
                    <div class="col-12 md:col-3">
                        <div class="card text-center" style="border-left: 4px solid var(--priority-high)">
                            <div class="text-3xl font-bold text-color-secondary mb-2">
                                {{ getTasksByPriority('high').length }}
                            </div>
                            <div class="text-sm text-color-secondary">High Priority</div>
                        </div>
                    </div>
                    <div class="col-12 md:col-3">
                        <div class="card text-center" style="border-left: 4px solid var(--status-working)">
                            <div class="text-3xl font-bold text-color-secondary mb-2">
                                {{ getTasksByColumn('in-progress').length }}
                            </div>
                            <div class="text-sm text-color-secondary">In Progress</div>
                        </div>
                    </div>
                    <div class="col-12 md:col-3">
                        <div class="card text-center" style="border-left: 4px solid var(--status-blocked)">
                            <div class="text-3xl font-bold text-color-secondary mb-2">
                                {{ getOverdueTasks().length }}
                            </div>
                            <div class="text-sm text-color-secondary">Overdue</div>
                        </div>
                    </div>
                    <div class="col-12 md:col-3">
                        <div class="card text-center" style="border-left: 4px solid var(--status-working)">
                            <div class="text-3xl font-bold text-color-secondary mb-2">
                                {{ getTasksByColumn('done').length }}
                            </div>
                            <div class="text-sm text-color-secondary">Completed</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .kanban-container {
            display: flex;
            gap: 1rem;
            overflow-x: auto;
            padding-bottom: 1rem;
            min-height: 600px;
        }

        .kanban-column-content {
            overflow-y: auto;
            max-height: calc(100vh - 400px);
            padding-right: 0.5rem;
        }

        /* Custom scrollbar */
        .kanban-column-content::-webkit-scrollbar {
            width: 6px;
        }

        .kanban-column-content::-webkit-scrollbar-track {
            background: var(--surface-100);
            border-radius: 3px;
        }

        .kanban-column-content::-webkit-scrollbar-thumb {
            background: var(--surface-300);
            border-radius: 3px;
        }

        .kanban-column-content::-webkit-scrollbar-thumb:hover {
            background: var(--surface-400);
        }

        .task-card-overdue {
            background: #FEF2F2 !important;
            border-left-color: var(--priority-high) !important;
        }

        /* Mobile optimization */
        @media (max-width: 768px) {
            .kanban-container {
                -webkit-overflow-scrolling: touch;
            }
        }
    `]
})
export class ProjectBoard implements OnInit {
    project: Project | null = null;
    tasks: Task[] = [];
    agents: Agent[] = [];

    columns: KanbanColumn[] = [
        { value: 'backlog', label: 'Backlog', color: '#6B7280', icon: 'pi-inbox' },
        { value: 'todo', label: 'To Do', color: '#3B82F6', icon: 'pi-list' },
        { value: 'in-progress', label: 'In Progress', color: '#F59E0B', icon: 'pi-spin pi-spinner' },
        { value: 'review', label: 'Review', color: '#8B5CF6', icon: 'pi-eye' },
        { value: 'done', label: 'Done', color: '#10B981', icon: 'pi-check-circle' }
    ];

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private firestoreService: FirestoreService
    ) {}

    ngOnInit() {
        const projectId = this.route.snapshot.paramMap.get('id');
        if (projectId) {
            this.firestoreService.getProjects().subscribe(projects => {
                this.project = projects.find(p => p.id === projectId) || null;
            });

            this.firestoreService.getTasksByProject(projectId).subscribe(tasks => {
                this.tasks = tasks;
            });

            this.firestoreService.getAgents().subscribe(agents => {
                this.agents = agents;
            });
        }
    }

    getTasksByColumn(column: string): Task[] {
        return this.tasks.filter(t => t.column === column);
    }

    getTasksByPriority(priority: string): Task[] {
        return this.tasks.filter(t => t.priority === priority);
    }

    getOverdueTasks(): Task[] {
        const now = new Date();
        return this.tasks.filter(t => 
            t.dueDate && 
            new Date(t.dueDate) < now && 
            t.column !== 'done'
        );
    }

    isOverdue(task: Task): boolean {
        if (!task.dueDate || task.column === 'done') return false;
        return new Date(task.dueDate) < new Date();
    }

    getAgentName(agentId: string): string {
        const agent = this.agents.find(a => a.id === agentId);
        return agent?.name || 'Unassigned';
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
