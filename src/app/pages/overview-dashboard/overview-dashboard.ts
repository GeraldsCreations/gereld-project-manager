import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { FirestoreService, Agent } from '../../services/firestore.service';

@Component({
    selector: 'app-overview-dashboard',
    standalone: true,
    imports: [CommonModule, CardModule, ButtonModule, TagModule],
    template: `
        <div class="grid">
            <div class="col-12">
                <div class="card">
                    <h2>AI Agents Overview</h2>
                    <p class="text-color-secondary">Monitor all active agents and their current tasks</p>
                </div>
            </div>
            
            <div class="col-12 md:col-6 lg:col-4" *ngFor="let agent of agents">
                <p-card class="agent-card">
                    <ng-template pTemplate="header">
                        <div class="p-3 flex align-items-center justify-content-between">
                            <div class="flex align-items-center gap-2">
                                <i class="pi pi-user text-4xl"></i>
                                <span class="font-bold text-xl">{{ agent.name }}</span>
                            </div>
                            <p-tag [value]="agent.status" 
                                   [severity]="getStatusSeverity(agent.status)">
                            </p-tag>
                        </div>
                    </ng-template>
                    
                    <div class="mb-3">
                        <div class="text-sm text-color-secondary mb-1">Current Task</div>
                        <div class="font-medium">{{ agent.currentTask || 'No active task' }}</div>
                    </div>
                    
                    <div class="text-sm text-color-secondary">
                        Last updated: {{ agent.lastUpdated | date:'short' }}
                    </div>
                    
                    <ng-template pTemplate="footer">
                        <p-button label="View Tasks" 
                                  icon="pi pi-arrow-right" 
                                  (onClick)="viewAgent(agent.id!)"
                                  styleClass="w-full">
                        </p-button>
                    </ng-template>
                </p-card>
            </div>
        </div>
    `,
    styles: [`
        :host ::ng-deep .agent-card {
            height: 100%;
        }
        :host ::ng-deep .agent-card .p-card-body {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
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

    viewAgent(agentId: string) {
        this.router.navigate(['/agent', agentId]);
    }
}
