import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { TimelineModule } from 'primeng/timeline';
import { FirestoreService, Task, Agent, TaskActivity } from '../../services/firestore.service';

interface KanbanColumn {
    value: string;
    label: string;
    color: string;
    icon: string;
}

@Component({
    selector: 'app-agent-view',
    standalone: true,
    imports: [CommonModule, CardModule, ButtonModule, TagModule, BadgeModule, TimelineModule],
    template: `
        <div class="grid">
            <!-- Agent Profile Header -->
            <div class="col-12">
                <div class="card" style="background: var(--bg-gradient-purple); color: white;">
                    <div class="flex align-items-start justify-content-between gap-3 flex-wrap">
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
                                <div class="flex align-items-center gap-3 mb-3 flex-wrap">
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
                    <div class="col-12 sm:col-6 md:col-3">
                        <div class="card text-center metric-card">
                            <div class="metric-icon" style="background: var(--gereld-purple-100); color: var(--gereld-purple)">
                                <i class="pi pi-list"></i>
                            </div>
                            <div class="metric-value">{{ tasks.length }}</div>
                            <div class="metric-label">Total Tasks</div>
                        </div>
                    </div>
                    <div class="col-12 sm:col-6 md:col-3">
                        <div class="card text-center metric-card">
                            <div class="metric-icon" style="background: var(--priority-medium-bg); color: var(--priority-medium)">
                                <i class="pi pi-spin pi-spinner"></i>
                            </div>
                            <div class="metric-value">{{ getTasksByColumn('in-progress').length }}</div>
                            <div class="metric-label">In Progress</div>
                        </div>
                    </div>
                    <div class="col-12 sm:col-6 md:col-3">
                        <div class="card text-center metric-card">
                            <div class="metric-icon" style="background: var(--priority-high-bg); color: var(--priority-high)">
                                <i class="pi pi-exclamation-circle"></i>
                            </div>
                            <div class="metric-value">{{ getTasksByPriority('high').length }}</div>
                            <div class="metric-label">High Priority</div>
                        </div>
                    </div>
                    <div class="col-12 sm:col-6 md:col-3">
                        <div class="card text-center metric-card">
                            <div class="metric-icon" style="background: var(--status-working-bg); color: var(--status-working)">
                                <i class="pi pi-check-circle"></i>
                            </div>
                            <div class="metric-value">{{ getTasksByColumn('done').length }}</div>
                            <div class="metric-label">Completed</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Main Content: Kanban + Activity Split -->
            <div class="col-12 lg:col-8">
                <!-- Kanban Board Header -->
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

                <!-- Kanban Board -->
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
                                
                                <div class="task-card-title">{{ task.title }}</div>
                                <div class="task-card-description" *ngIf="task.description">
                                    {{ task.description }}
                                </div>
                                <div class="task-card-footer">
                                    <p-tag 
                                        [value]="task.priority" 
                                        [severity]="getPrioritySeverity(task.priority)"
                                        [style]="{'font-size': '0.75rem'}">
                                    </p-tag>
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
                                 class="empty-state-mini">
                                <i [class]="'pi ' + column.icon" style="font-size: 1.5rem; opacity: 0.3"></i>
                                <div class="text-xs text-color-secondary mt-1">No tasks</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Activity Timeline Sidebar -->
            <div class="col-12 lg:col-4">
                <div class="card activity-card">
                    <div class="flex align-items-center justify-content-between mb-3">
                        <h3 class="m-0">Recent Activity</h3>
                        <p-badge [value]="activities.length.toString()" severity="info"></p-badge>
                    </div>

                    <div *ngIf="activities.length > 0; else noActivity">
                        <p-timeline [value]="activities" align="left">
                            <ng-template pTemplate="marker" let-activity>
                                <div class="timeline-marker" [style.background]="getActivityColor(activity.action)">
                                    <i [class]="getActivityIcon(activity.action)"></i>
                                </div>
                            </ng-template>
                            
                            <ng-template pTemplate="content" let-activity>
                                <div class="timeline-content">
                                    <div class="timeline-title">{{ activity.taskTitle }}</div>
                                    <div class="timeline-action">
                                        {{ getActivityDescription(activity) }}
                                    </div>
                                    <div class="timeline-timestamp">
                                        <i class="pi pi-clock mr-1"></i>
                                        {{ formatRelativeTime(activity.timestamp) }}
                                    </div>
                                </div>
                            </ng-template>
                        </p-timeline>
                    </div>

                    <ng-template #noActivity>
                        <div class="empty-state">
                            <div class="empty-state-icon">
                                <i class="pi pi-history"></i>
                            </div>
                            <div class="text-sm text-color-secondary">
                                No recent activity
                            </div>
                            <div class="text-xs text-color-secondary mt-2">
                                Task updates will appear here
                            </div>
                        </div>
                    </ng-template>
                </div>
            </div>
        </div>
    `,
    styles: [`
        /* Metric Cards */
        .metric-card {
            padding: 1.5rem;
            transition: transform var(--transition-fast), box-shadow var(--transition-fast);
        }

        .metric-card:hover {
            transform: translateY(-4px);
            box-shadow: var(--shadow-md);
        }

        .metric-icon {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1rem;
            font-size: 1.5rem;
        }

        .metric-value {
            font-size: 2.5rem;
            font-weight: 700;
            color: var(--text-primary);
            line-height: 1;
            margin-bottom: 0.5rem;
        }

        .metric-label {
            font-size: 0.875rem;
            color: var(--text-secondary);
            font-weight: 500;
        }

        /* Kanban Styles */
        .kanban-container {
            display: flex;
            gap: 1rem;
            overflow-x: auto;
            padding-bottom: 1rem;
            min-height: 500px;
        }

        .kanban-column-content {
            overflow-y: auto;
            max-height: calc(100vh - 550px);
            min-height: 400px;
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

        .task-card-overdue {
            background: #FEF2F2 !important;
            border-left-color: var(--priority-high) !important;
        }

        .empty-state-mini {
            text-align: center;
            padding: 2rem 1rem;
        }

        /* Activity Timeline */
        .activity-card {
            position: sticky;
            top: 1rem;
            max-height: calc(100vh - 2rem);
            overflow-y: auto;
        }

        :host ::ng-deep .p-timeline {
            padding-left: 0;
        }

        :host ::ng-deep .p-timeline-event {
            min-height: auto;
            padding-bottom: 1.5rem;
        }

        :host ::ng-deep .p-timeline-event-opposite {
            display: none;
        }

        :host ::ng-deep .p-timeline-event-connector {
            background: var(--surface-200);
            width: 2px;
        }

        .timeline-marker {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 0.875rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }

        .timeline-content {
            padding-left: 1rem;
        }

        .timeline-title {
            font-size: 0.875rem;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 0.25rem;
            line-height: 1.3;
        }

        .timeline-action {
            font-size: 0.8rem;
            color: var(--text-secondary);
            margin-bottom: 0.5rem;
        }

        .timeline-timestamp {
            font-size: 0.75rem;
            color: var(--text-muted);
            display: flex;
            align-items: center;
        }

        .agent-avatar {
            background: rgba(255, 255, 255, 0.2);
            border: 3px solid rgba(255, 255, 255, 0.3);
        }

        /* Responsive */
        @media (max-width: 991px) {
            .kanban-container {
                -webkit-overflow-scrolling: touch;
            }

            .activity-card {
                position: static;
                max-height: none;
            }
        }

        @media (max-width: 575px) {
            .metric-icon {
                width: 48px;
                height: 48px;
                font-size: 1.25rem;
            }

            .metric-value {
                font-size: 2rem;
            }
        }
    `]
})
export class AgentView implements OnInit {
    agent: Agent | null = null;
    tasks: Task[] = [];
    activities: TaskActivity[] = [];

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
            // Load agent info
            this.firestoreService.getAgents().subscribe(agents => {
                this.agent = agents.find(a => a.id === agentId) || null;
            });

            // Load tasks for this agent
            this.firestoreService.getTasksByAgent(agentId).subscribe(tasks => {
                this.tasks = tasks;
            });

            // Load activities for this agent
            this.firestoreService.getActivitiesByAgent(agentId, 15).subscribe(activities => {
                this.activities = activities;
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

    getActivityIcon(action: string): string {
        switch (action) {
            case 'created': return 'pi pi-plus';
            case 'moved': return 'pi pi-arrow-right';
            case 'completed': return 'pi pi-check';
            case 'assigned': return 'pi pi-user';
            case 'updated': return 'pi pi-pencil';
            default: return 'pi pi-circle';
        }
    }

    getActivityColor(action: string): string {
        switch (action) {
            case 'created': return 'var(--priority-low)';
            case 'moved': return 'var(--priority-medium)';
            case 'completed': return 'var(--status-working)';
            case 'assigned': return 'var(--gereld-purple)';
            case 'updated': return 'var(--text-secondary)';
            default: return 'var(--surface-400)';
        }
    }

    getActivityDescription(activity: TaskActivity): string {
        switch (activity.action) {
            case 'created':
                return 'Created task';
            case 'moved':
                return `Moved from ${this.formatColumnName(activity.fromColumn || '')} to ${this.formatColumnName(activity.toColumn || '')}`;
            case 'completed':
                return 'Completed task';
            case 'assigned':
                return 'Assigned to agent';
            case 'updated':
                return 'Updated task details';
            default:
                return 'Task activity';
        }
    }

    formatColumnName(column: string): string {
        const names: { [key: string]: string } = {
            'backlog': 'Backlog',
            'todo': 'To Do',
            'in-progress': 'In Progress',
            'review': 'Review',
            'done': 'Done'
        };
        return names[column] || column;
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
