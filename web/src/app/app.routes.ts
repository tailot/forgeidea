import { Routes } from '@angular/router';
import { LandingComponentComponent } from './landing-component/landing-component.component';

export const routes: Routes = [
    {
        path: '',
        component: LandingComponentComponent
    },
    {
        path: 'generate',
        loadComponent: () => import('./botton-idea/botton-idea.component').then(m => m.BottonIdeaComponent),
        title: 'forge IDEA'
    },
    {
        path: 'generateCategory',
        loadComponent: () => import('./generate-category/generate-category.component').then(m => m.GenerateCategoryComponent),
        title: 'forge IDEA'
    },
    {
        path: 'jobcard/:uuid',
        loadComponent: () => import('./jobcard/jobcard.component').then(m => m.JobcardComponent),
        title: 'forge IDEA'
    },
    {
        path: 'list',
        loadComponent: () => import('./idea-list/idea-list.component').then(m => m.IdeaListComponent),
        title: 'forge IDEA'
    },
    {
        path: 'settings',
        loadComponent: () => import('./settings/settings.component').then(m => m.SettingsComponent),
        title: 'forge IDEA'
    },
    {
        path: 'shared',
        loadComponent: () => import('./sharedidea/sharedidea.component').then(m => m.SharedIdeaComponent),
        title: 'forge IDEA'
    }
];
