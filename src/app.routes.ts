import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { OverviewDashboard } from './app/pages/overview-dashboard/overview-dashboard';
import { AgentView } from './app/pages/agent-view/agent-view';
import { ProjectBoard } from './app/pages/project-board/project-board';
import { Documentation } from './app/pages/documentation/documentation';
import { Landing } from './app/pages/landing/landing';
import { Notfound } from './app/pages/notfound/notfound';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        children: [
            { path: '', component: OverviewDashboard },
            { path: 'agents', component: AgentView },
            { path: 'agent/:id', component: AgentView },
            { path: 'board', component: ProjectBoard },
            { path: 'project/:id', component: ProjectBoard },
            { path: 'uikit', loadChildren: () => import('./app/pages/uikit/uikit.routes') },
            { path: 'documentation', component: Documentation },
            { path: 'pages', loadChildren: () => import('./app/pages/pages.routes') }
        ]
    },
    { path: 'landing', component: Landing },
    { path: 'notfound', component: Notfound },
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    { path: '**', redirectTo: '/notfound' }
];
