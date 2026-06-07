import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService, AuthUser } from '../../core/services/auth.service';
import { ThemeService, ThemeType } from '../../core/services/theme.service';
import { NotificationService, NotificationItem } from '../../core/services/notification.service';
import { ThemeDialogComponent } from '../../core/components/theme-dialog.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
    MatDialogModule,
    MatToolbarModule,
    MatSlideToggleModule,
    MatSnackBarModule
  ],
  templateUrl: './settings.component.html',
  styleUrls: [
    '../admin-dashboard/admin-dashboard.component.scss',
    './settings.component.scss'
  ]
})
export class SettingsComponent implements OnInit {
  activeTab: 'account' | 'security' | 'notifications' | 'appearance' | 'localization' = 'account';
  currentUser: AuthUser | null = null;
  notifications: NotificationItem[] = [];
  unreadCount = 0;
  
  // Password Visibility Toggles
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;
  
  themes = [
    { id: 'white', name: 'Clean White' },
    { id: 'aurora', name: 'Aurora Dark' },
    { id: 'carbon', name: 'Carbon Dark' }
  ];

  constructor(
    public themeService: ThemeService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private dialog: MatDialog,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.currentUser = this.authService.getUser();
  }

  ngOnInit() {
    // Only load notifications for Admin role (API is Admin-only)
    if (this.currentUser?.role === 'Admin') {
      this.loadNotifications();
    }
  }

  setTab(tab: any) {
    this.activeTab = tab;
  }

  saveSettings() {
    this.snackBar.open('Settings saved successfully!', 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom'
    });
  }

  setTheme(themeId: string) {
    this.themeService.setTheme(themeId as ThemeType);
  }

  logoutAll() {
    alert('Logged out from all other devices.');
  }

  updatePassword() {
    alert('Password updated successfully.');
  }

  // --- Topbar logic ---
  getThemeName(): string {
    const theme = this.themeService.theme;
    return theme.charAt(0).toUpperCase() + theme.slice(1);
  }

  openThemeDialog(): void {
    this.dialog.open(ThemeDialogComponent, {
      width: '420px',
      disableClose: false,
    });
  }

  logout(): void {
    this.authService.logout();
  }

  loadNotifications(): void {
    this.notificationService.getNotifications().subscribe({
      next: (res) => {
        this.notifications = res.data;
        this.unreadCount = this.notifications.filter((n) => !n.isRead).length;
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications = this.notifications.map((n) => ({ ...n, isRead: true }));
        this.unreadCount = 0;
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }
}
