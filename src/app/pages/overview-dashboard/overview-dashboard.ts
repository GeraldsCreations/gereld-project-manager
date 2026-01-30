import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { ProgressBarModule } from 'primeng/progressbar';
import { FirestoreService, Agent, Task } from '../../services/firestore.service';
import { combineLatest, map } from 'rxjs';

interface AgentWithStats extends Agent {
    tasks: Task[];
    totalTasks: number;
    inProgressTasks: number;
    blockedTasks: number;
    completedTasks: number;
    completionPercentage: number;
    activeTasks: Task[]; // Tasks that are todo or in-progress
}

@Component({
    selector: 'app-overview-dashboard',
    standalone: true,
    imports: [CommonModule, CardModule, ButtonModule, TagModule, BadgeModule, ProgressBarModule],
    template: `
        <div class="grid">
            <!-- Hero Header -->
            <div class="col-12">
                <div class="card stats-card">
                    <div class="flex align-items-center justify-content-between flex-wrap gap-3">
                        <div>
                            <h1 class="text-4xl font-bold mb-2">🍆 Gereld PM</h1>
                            <p class="text-lg opacity-90">AI Agent Project Manager</p>
                        </div>
                        <div class="flex gap-4 flex-wrap">
                            <div class="text-center">
                                <div class="stats-card-value">{{ agentsWithStats.length }}</div>
                                <div class="stats-card-label">Agents</div>
                            </div>
                            <div class="text-center">
                                <div class="stats-card-value">{{ getWorkingAgentsCount() }}</div>
                                <div class="stats-card-label">Working</div>
                            </div>
                            <div class="text-center">
                                <div class="stats-card-value">{{ getTotalActiveTasks() }}</div>
                                <div class="stats-card-label">Active Tasks</div>
                            </div>
                            <div class="text-center">
                                <div class="stats-card-value">{{ getOverallCompletion() }}%</div>
                                <div class="stats-card-label">Overall</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Agent Cards Grid -->
            <div class="col-12">
                <div class="card">
                    <div class="flex align-items-center justify-content-between mb-3">
                        <h2 class="m-0">Active Agents</h2>
                        <p-button 
                            label="Refresh" 
                            icon="pi pi-refresh" 
                            [outlined]="true"
                            size="small">
                        </p-button>
                    </div>
                </div>
            </div>
            
            <!-- Enhanced Agent Cards - Wider with more info -->
            <div class="col-12 md:col-6 lg:col-3" *ngFor="let agent of agentsWithStats">
                <div class="agent-card-enhanced">
                    <p-card>
                        <!-- Card Header with Gradient -->
                        <ng-template pTemplate="header">
                            <div class="agent-card-header">
                                <div class="flex align-items-center justify-content-between">
                                    <div class="flex align-items-center gap-3">
                                        <div class="agent-avatar">
                                            <i class="pi pi-user"></i>
                                        </div>
                                        <div>
                                            <div class="text-xl font-bold">{{ agent.name }}</div>
                                            <div class="text-sm opacity-90">
                                                Updated {{ formatRelativeTime(agent.lastUpdated) }}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="status-badge-container">
                                        <p-tag 
                                            [value]="formatStatus(agent.status)" 
                                            [severity]="getStatusSeverity(agent.status)"
                                            styleClass="status-badge status-badge-{{ agent.status }}">
                                        </p-tag>
                                    </div>
                                </div>
                            </div>
                        </ng-template>
                        
                        <!-- Enhanced Card Content -->
                        <div class="py-3">
                            <!-- Progress Section -->
                            <div class="mb-4">
                                <div class="flex align-items-center justify-content-between mb-2">
                                    <span class="text-sm font-semibold text-color-secondary">
                                        Task Progress
                                    </span>
                                    <span class="text-sm font-bold" 
                                          [style.color]="getProgressColor(agent.completionPercentage)">
                                        {{ agent.completedTasks }}/{{ agent.totalTasks }} 
                                        ({{ agent.completionPercentage }}%)
                                    </span>
                                </div>
                                <p-progressBar 
                                    [value]="agent.completionPercentage"
                                    [showValue]="false"
                                    [style]="{'height': '8px'}">
                                </p-progressBar>
                            </div>

                            <!-- Task Breakdown Stats -->
                            <div class="task-breakdown mb-4">
                                <div class="flex gap-3 justify-content-between">
                                    <div class="stat-item flex-1">
                                        <div class="stat-icon" style="background: var(--priority-low-bg)">
                                            <i class="pi pi-list" style="color: var(--priority-low)"></i>
                                        </div>
                                        <div class="stat-value">{{ getBacklogCount(agent) }}</div>
                                        <div class="stat-label">Backlog</div>
                                    </div>
                                    <div class="stat-item flex-1">
                                        <div class="stat-icon" style="background: var(--priority-medium-bg)">
                                            <i class="pi pi-spin pi-spinner" style="color: var(--priority-medium)"></i>
                                        </div>
                                        <div class="stat-value">{{ agent.inProgressTasks }}</div>
                                        <div class="stat-label">In Progress</div>
                                    </div>
                                    <div class="stat-item flex-1">
                                        <div class="stat-icon" style="background: var(--priority-high-bg)">
                                            <i class="pi pi-exclamation-circle" style="color: var(--priority-high)"></i>
                                        </div>
                                        <div class="stat-value">{{ agent.blockedTasks }}</div>
                                        <div class="stat-label">Blocked</div>
                                    </div>
                                    <div class="stat-item flex-1">
                                        <div class="stat-icon" style="background: var(--status-working-bg)">
                                            <i class="pi pi-check-circle" style="color: var(--status-working)"></i>
                                        </div>
                                        <div class="stat-value">{{ agent.completedTasks }}</div>
                                        <div class="stat-label">Done</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Active Tasks List -->
                            <div class="active-tasks-section">
                                <div class="text-xs text-color-secondary mb-2 font-semibold uppercase">
                                    Active Tasks ({{ agent.activeTasks.length }})
                                </div>
                                
                                <div *ngIf="agent.activeTasks.length > 0; else noActiveTasks">
                                    <div class="mini-task-item" 
                                         *ngFor="let task of agent.activeTasks.slice(0, 3)">
                                        <div class="flex align-items-start gap-2">
                                            <i class="pi pi-circle-fill mini-task-icon" 
                                               [style.color]="getColumnColor(task.column)"></i>
                                            <div class="flex-1">
                                                <div class="mini-task-title">{{ task.title }}</div>
                                                <div class="flex align-items-center gap-2 mt-1">
                                                    <p-tag 
                                                        [value]="task.priority" 
                                                        [severity]="getPrioritySeverity(task.priority)"
                                                        [style]="{'font-size': '0.65rem', 'padding': '0.15rem 0.4rem'}">
                                                    </p-tag>
                                                    <span class="mini-task-column">
                                                        {{ formatColumnName(task.column) }}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div *ngIf="agent.activeTasks.length > 3" 
                                         class="text-xs text-color-secondary text-center mt-2">
                                        +{{ agent.activeTasks.length - 3 }} more tasks
                                    </div>
                                </div>
                                
                                <ng-template #noActiveTasks>
                                    <div class="text-sm text-color-secondary text-center py-2">
                                        No active tasks
                                    </div>
                                </ng-template>
                            </div>
                        </div>
                        
                        <!-- Card Footer -->
                        <ng-template pTemplate="footer">
                            <p-button 
                                label="View All Tasks" 
                                icon="pi pi-arrow-right" 
                                iconPos="right"
                                (onClick)="viewAgent(agent.id!)"
                                styleClass="w-full"
                                [style]="{'background': 'var(--gereld-purple)', 'border-color': 'var(--gereld-purple)'}">
                            </p-button>
                        </ng-template>
                    </p-card>
                </div>
            </div>

            <!-- Empty State -->
            <div class="col-12" *ngIf="agentsWithStats.length === 0">
                <div class="card">
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <i class="pi pi-users"></i>
                        </div>
                        <div class="text-xl font-semibold mb-2">No Agents Yet</div>
                        <div class="empty-state-text">
                            Add agents using the Gereld CLI to get started
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        :host ::ng-deep .agent-card-enhanced {
            height: 100%;
        }
        
        :host ::ng-deep .agent-card-enhanced .p-card {
            height: 100%;
            display: flex;
            flex-direction: column;
            border-radius: var(--radius-lg);
            overflow: hidden;
        }
        
        :host ::ng-deep .agent-card-enhanced .p-card-body {
            display: flex;
            flex-direction: column;
            flex: 1;
            padding: 0;
        }
        
        :host ::ng-deep .agent-card-enhanced .p-card-content {
            flex: 1;
            padding: 0 1.25rem;
        }
        
        :host ::ng-deep .agent-card-enhanced .p-card-footer {
            padding: 1.25rem;
            background: var(--bg-surface);
        }

        /* Progress bar customization */
        :host ::ng-deep .p-progressbar {
            background: var(--surface-200);
            border-radius: 4px;
        }

        :host ::ng-deep .p-progressbar-value {
            background: linear-gradient(90deg, var(--gereld-purple) 0%, var(--gereld-purple-light) 100%);
        }

        /* Task breakdown stats */
        .task-breakdown {
            padding: 1rem;
            background: var(--bg-surface);
            border-radius: var(--radius-md);
        }

        .stat-item {
            text-align: center;
        }

        .stat-icon {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 0.5rem;
            font-size: 1.1rem;
        }

        .stat-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--text-primary);
            line-height: 1;
            margin-bottom: 0.25rem;
        }

        .stat-label {
            font-size: 0.7rem;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        /* Mini task items */
        .active-tasks-section {
            background: var(--bg-card);
            padding: 0.75rem;
            border-radius: var(--radius-md);
            border: 1px solid var(--surface-200);
        }

        .mini-task-item {
            padding: 0.5rem;
            margin-bottom: 0.5rem;
            background: var(--bg-surface);
            border-radius: var(--radius-sm);
            transition: background var(--transition-fast);
        }

        .mini-task-item:last-child {
            margin-bottom: 0;
        }

        .mini-task-item:hover {
            background: var(--bg-hover);
        }

        .mini-task-icon {
            font-size: 0.4rem;
            margin-top: 0.3rem;
        }

        .mini-task-title {
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--text-primary);
            line-height: 1.3;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .mini-task-column {
            font-size: 0.7rem;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .status-badge-container {
            animation: fadeIn 0.3s ease-in-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
        }

        /* Mobile responsiveness */
        @media (max-width: 991px) {
            .task-breakdown .flex {
                flex-wrap: wrap;
            }
            
            .stat-item {
                min-width: 50%;
                margin-bottom: 1rem;
            }
        }

        @media (max-width: 575px) {
            .stat-icon {
                width: 32px;
                height: 32px;
                font-size: 0.9rem;
            }

            .stat-value {
                font-size: 1.25rem;
            }

            .stat-label {
                font-size: 0.65rem;
            }
        }
    `]
})
export class OverviewDashboard implements OnInit {
    agentsWithStats: AgentWithStats[] = [];

    constructor(
        private firestoreService: FirestoreService,
        private router: Router
    ) {}

    ngOnInit() {
        // Combine agents and tasks data
        combineLatest([
            this.firestoreService.getAgents(),
            this.firestoreService.getTasks()
        ]).pipe(
            map(([agents, tasks]) => {
                return agents.map(agent => this.enrichAgentWithStats(agent, tasks));
            })
        ).subscribe(agentsWithStats => {
            this.agentsWithStats = agentsWithStats;
        });
    }

    private enrichAgentWithStats(agent: Agent, allTasks: Task[]): AgentWithStats {
        const agentTasks = allTasks.filter(t => t.agentId === agent.id);
        const totalTasks = agentTasks.length;
        const inProgressTasks = agentTasks.filter(t => t.column === 'in-progress').length;
        const completedTasks = agentTasks.filter(t => t.column === 'done').length;
        const blockedTasks = agentTasks.filter(t => t.column === 'review').length; // Using review as "blocked" for now
        const activeTasks = agentTasks.filter(t => t.column === 'todo' || t.column === 'in-progress');
        const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
            ...agent,
            tasks: agentTasks,
            totalTasks,
            inProgressTasks,
            blockedTasks,
            completedTasks,
            completionPercentage,
            activeTasks
        };
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

    formatStatus(status: string): string {
        return status.charAt(0).toUpperCase() + status.slice(1);
    }

    getWorkingAgentsCount(): number {
        return this.agentsWithStats.filter(a => a.status === 'working').length;
    }

    getTotalActiveTasks(): number {
        return this.agentsWithStats.reduce((sum, agent) => sum + agent.activeTasks.length, 0);
    }

    getOverallCompletion(): number {
        const totalTasks = this.agentsWithStats.reduce((sum, agent) => sum + agent.totalTasks, 0);
        const totalCompleted = this.agentsWithStats.reduce((sum, agent) => sum + agent.completedTasks, 0);
        return totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
    }

    getBacklogCount(agent: AgentWithStats): number {
        return agent.tasks.filter(t => t.column === 'backlog' || t.column === 'todo').length;
    }

    getProgressColor(percentage: number): string {
        if (percentage >= 75) return 'var(--status-working)';
        if (percentage >= 50) return 'var(--priority-medium)';
        if (percentage >= 25) return 'var(--priority-low)';
        return 'var(--text-secondary)';
    }

    getColumnColor(column: string): string {
        switch (column) {
            case 'backlog': return '#6B7280';
            case 'todo': return '#3B82F6';
            case 'in-progress': return '#F59E0B';
            case 'review': return '#8B5CF6';
            case 'done': return '#10B981';
            default: return '#6B7280';
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

    viewAgent(agentId: string) {
        this.router.navigate(['/agent', agentId]);
    }
}
