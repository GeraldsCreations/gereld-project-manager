import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { FirestoreService, Agent } from '../../services/firestore.service';

@Component({
    selector: 'app-overview-dashboard',
    standalone: true,
    imports: [CommonModule, CardModule, ButtonModule, TagModule, BadgeModule],
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
                        <div class="flex gap-4">
                            <div class="text-center">
                                <div class="stats-card-value">{{ agents.length }}</div>
                                <div class="stats-card-label">Agents</div>
                            </div>
                            <div class="text-center">
                                <div class="stats-card-value">{{ getWorkingAgentsCount() }}</div>
                                <div class="stats-card-label">Working</div>
                            </div>
                            <div class="text-center">
                                <div class="stats-card-value">{{ getBlockedAgentsCount() }}</div>
                                <div class="stats-card-label">Blocked</div>
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
            
            <div class="col-12 md:col-6 lg:col-4" *ngFor="let agent of agents">
                <div class="agent-card">
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
                        
                        <!-- Card Content -->
                        <div class="py-3">
                            <div class="mb-3">
                                <div class="text-xs text-color-secondary mb-1 font-semibold uppercase">
                                    Current Task
                                </div>
                                <div class="font-medium text-lg" 
                                     [class.text-color-secondary]="!agent.currentTask">
                                    {{ agent.currentTask || 'No active task' }}
                                </div>
                            </div>
                            
                            <!-- Task Stats (placeholder - would come from task count query) -->
                            <div class="flex gap-4 pt-2 border-top-1 surface-border">
                                <div class="flex-1 text-center">
                                    <div class="text-xl font-bold text-primary">-</div>
                                    <div class="text-xs text-color-secondary">Active</div>
                                </div>
                                <div class="flex-1 text-center">
                                    <div class="text-xl font-bold" style="color: var(--status-working)">-</div>
                                    <div class="text-xs text-color-secondary">Done</div>
                                </div>
                                <div class="flex-1 text-center">
                                    <div class="text-xl font-bold" style="color: var(--status-blocked)">-</div>
                                    <div class="text-xs text-color-secondary">Blocked</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Card Footer -->
                        <ng-template pTemplate="footer">
                            <p-button 
                                label="View Tasks" 
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
            <div class="col-12" *ngIf="agents.length === 0">
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
        :host ::ng-deep .agent-card {
            height: 100%;
        }
        
        :host ::ng-deep .agent-card .p-card {
            height: 100%;
            display: flex;
            flex-direction: column;
            border-radius: var(--radius-lg);
            overflow: hidden;
        }
        
        :host ::ng-deep .agent-card .p-card-body {
            display: flex;
            flex-direction: column;
            flex: 1;
            padding: 0;
        }
        
        :host ::ng-deep .agent-card .p-card-content {
            flex: 1;
            padding: 0 1.25rem;
        }
        
        :host ::ng-deep .agent-card .p-card-footer {
            padding: 1.25rem;
            background: var(--bg-surface);
        }

        .status-badge-container {
            animation: fadeIn 0.3s ease-in-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
        }
    `]
})
export class OverviewDashboard implements OnInit {
    agents: Agent[] = [];

    constructor(
        private firestoreService: FirestoreService,
        private router: Router
    ) {}

    ngOnInit() {
        this.firestoreService.getAgents().subscribe(agents => {
            this.agents = agents;
        });
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

    getWorkingAgentsCount(): number {
        return this.agents.filter(a => a.status === 'working').length;
    }

    getBlockedAgentsCount(): number {
        return this.agents.filter(a => a.status === 'blocked').length;
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
