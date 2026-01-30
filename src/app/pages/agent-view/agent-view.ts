import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { FirestoreService, Task, Agent } from '../../services/firestore.service';

interface KanbanColumn {
    value: string;
    label: string;
    color: string;
    icon: string;
}

@Component({
    selector: 'app-agent-view',
    standalone: true,
    imports: [CommonModule, CardModule, ButtonModule, TagModule, BadgeModule],
    template: `
        <div class="grid">
            <!-- Agent Profile Header -->
            <div class="col-12">
                <div class="card" style="background: var(--bg-gradient-purple); color: white;">
                    <div class="flex align-items-start justify-content-between gap-3">
                        <div class="flex align-items-start gap-3 flex-1">
                            <p-button 
                                icon="pi pi-arrow-left" 
                                [text]="true"
                                [rounded]="true"
                                severity="secondary"
                                (onClick)="goBack()"
                                [style]="{'color': 'white'}">
                            </p-button>
                            <div class="agent-avatar" style="width: 80px; height: 80px; font-size: 2.5rem;">
                                <i class="pi pi-user"></i>
                            </div>
                            <div class="flex-1">
                                <h1 class="text-4xl font-bold mb-2">{{ agent?.name || 'Loading...' }}</h1>
                                <div class="flex align-items-center gap-3 mb-3">
                                    <p-tag 
                                        [value]="formatStatus(agent?.status || 'idle')" 
                                        [severity]="getStatusSeverity(agent?.status || 'idle')"
                                        styleClass="status-badge status-badge-{{ agent?.status }}">
                                    </p-tag>
                                    <span class="text-sm opacity-90">
                                        Last updated {{ agent ? formatRelativeTime(agent.lastUpdated) : 'Loading...' }}
                                    </span>
                                </div>
                                <div class="text-lg opacity-90" *ngIf="agent?.currentTask">
                                    <i class="pi pi-bolt mr-2"></i>
                                    <strong>Current:</strong> {{ agent?.currentTask }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Task Metrics -->
            <div class="col-12">
                <div class="grid">
                    <div class="col-12 md:col-3">
                        <div class="card text-center">
                            <div class="text-4xl font-bold mb-2" style="color: var(--gereld-purple)">
                                {{ tasks.length }}
                            </div>
                            <div class="text-sm text-color-secondary font-semibold">Total Tasks</div>
                        </div>
                    </div>
                    <div class="col-12 md:col-3">
                        <div class="card text-center">
                            <div class="text-4xl font-bold mb-2" style="color: var(--status-working)">
                                {{ getTasksByColumn('in-progress').length }}
                            </div>
                            <div class="text-sm text-color-secondary font-semibold">In Progress</div>
                        </div>
                    </div>
                    <div class="col-12 md:col-3">
                        <div class="card text-center">
                            <div class="text-4xl font-bold mb-2" style="color: var(--priority-high)">
                                {{ getTasksByPriority('high').length }}
                            </div>
                            <div class="text-sm text-color-secondary font-semibold">High Priority</div>
                        </div>
                    </div>
                    <div class="col-12 md:col-3">
                        <div class="card text-center">
                            <div class="text-4xl font-bold mb-2" style="color: var(--status-working)">
                                {{ getTasksByColumn('done').length }}
                            </div>
                            <div class="text-sm text-color-secondary font-semibold">Completed</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Kanban Board Header -->
            <div class="col-12">
                <div class="card">
                    <div class="flex align-items-center justify-content-between">
                        <h2 class="m-0">Task Board</h2>
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
                                    <div class="flex align-items-center gap-2">
                                        <!-- Priority Badge -->
                                        <p-tag 
                                            [value]="task.priority" 
                                            [severity]="getPrioritySeverity(task.priority)"
                                            [style]="{'font-size': '0.75rem'}">
                                        </p-tag>
                                        
                                        <!-- Project Badge (if available) -->
                                        <div class="flex align-items-center gap-1 text-xs text-color-secondary">
                                            <i class="pi pi-folder" style="font-size: 0.7rem"></i>
                                            <span>Project</span>
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
                                    No tasks
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Activity Timeline Placeholder -->
            <div class="col-12">
                <div class="card">
                    <h3 class="mb-3">Recent Activity</h3>
                    <div class="text-center text-color-secondary py-4">
                        <i class="pi pi-history text-4xl mb-2 opacity-30"></i>
                        <div class="text-sm">Activity timeline coming soon</div>
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
            min-height: 500px;
        }

        .kanban-column-content {
            overflow-y: auto;
            max-height: calc(100vh - 450px);
            padding-right: 0.5rem;
        }

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

        .agent-avatar {
            background: rgba(255, 255, 255, 0.2);
            border: 3px solid rgba(255, 255, 255, 0.3);
        }

        @media (max-width: 768px) {
            .kanban-container {
                -webkit-overflow-scrolling: touch;
            }
        }
    `]
})
export class AgentView implements OnInit {
    agent: Agent | null = null;
    tasks: Task[] = [];

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
        const agentId = this.route.snapshot.paramMap.get('id');
        if (agentId) {
            this.firestoreService.getAgents().subscribe(agents => {
                this.agent = agents.find(a => a.id === agentId) || null;
            });

            this.firestoreService.getTasksByAgent(agentId).subscribe(tasks => {
                this.tasks = tasks;
            });
        }
    }

    getTasksByColumn(column: string): Task[] {
        return this.tasks.filter(t => t.column === column);
    }

    getTasksByPriority(priority: string): Task[] {
        return this.tasks.filter(t => t.priority === priority);
    }

    isOverdue(task: Task): boolean {
        if (!task.dueDate || task.column === 'done') return false;
        return new Date(task.dueDate) < new Date();
    }

    getStatusSeverity(status: string): 'success' | 'warning' | 'danger' | 'info' {
        switch (status) {
            case 'working': return 'success';
            case 'blocked': return 'danger';
            case 'idle': return 'info';
            default: return 'info';
        }
    }

    formatStatus(status: string): string {
        return status.charAt(0).toUpperCase() + status.slice(1);
    }

    getPrioritySeverity(priority: string): 'success' | 'warning' | 'danger' {
        switch (priority) {
            case 'high': return 'danger';
            case 'medium': return 'warning';
            case 'low': return 'success';
            default: return 'success';
        }
    }

    formatRelativeTime(date: Date): string {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }

    goBack() {
        this.router.navigate(['/']);
    }
}
