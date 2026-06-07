import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
  },
  {
    // Admin dashboard — Admin only
    path: 'admin',
    loadComponent: () => import('./pages/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [authGuard, roleGuard],
    data: { allowedRoles: ['Admin'] },
  },
  {
    // Dashboard for Workers and Supervisors
    path: 'dashboard',
    loadComponent: () => import('./pages/worker-dashboard/worker-dashboard.component').then(m => m.WorkerDashboardComponent),
    canActivate: [authGuard, roleGuard],
    data: { allowedRoles: ['Supervisor', 'Worker'] },
  },
  {
    // Camera page — ALL roles can access
    path: 'camera',
    loadComponent: () => import('./pages/camera/camera.component').then(m => m.CameraComponent),
    canActivate: [authGuard, roleGuard],
    data: { allowedRoles: ['Admin', 'Supervisor', 'Worker'] },
  },
  {
    // Settings page
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent),
    canActivate: [authGuard],
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' },
];
