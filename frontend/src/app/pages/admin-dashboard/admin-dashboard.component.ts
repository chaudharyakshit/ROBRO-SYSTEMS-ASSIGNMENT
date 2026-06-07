// 1. Imports
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Inject,
} from '@angular/core';
import { CommonModule }     from '@angular/common';
import { FormsModule }      from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { MatToolbarModule }         from '@angular/material/toolbar';
import { MatButtonModule }          from '@angular/material/button';
import { MatIconModule }            from '@angular/material/icon';
import { MatTableModule }           from '@angular/material/table';
import { MatSelectModule }          from '@angular/material/select';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule }     from '@angular/material/progress-bar';
import { MatChipsModule }           from '@angular/material/chips';
import { MatTooltipModule }         from '@angular/material/tooltip';
import { MatMenuModule }            from '@angular/material/menu';
import { MatDividerModule }         from '@angular/material/divider';
import { MatFormFieldModule }       from '@angular/material/form-field';

import { UserService }        from '../../core/services/user.service';
import { AuthService, AuthUser } from '../../core/services/auth.service';
import { User }               from '../../core/models/user.model';
import { CreateUserDialogComponent } from './create-user-dialog.component';
import { ThemeService }       from '../../core/services/theme.service';
import { ThemeDialogComponent } from '../../core/components/theme-dialog.component';
import { NotificationService, NotificationItem } from '../../core/services/notification.service';

// 2. Component Decorator
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSelectModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
    MatFormFieldModule,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  // 4. Class Properties
  users: User[] = [];
  displayedCols: string[] = ['name', 'email', 'role', 'status', 'created', 'actions'];
  loading = true;
  currentUser: AuthUser | null = null;
  readonly roles = ['Admin', 'Supervisor', 'Worker'] as const;
  notifications: NotificationItem[] = [];
  unreadCount = 0;
  private pollInterval: any;

  currentTime: Date = new Date();
  private timeInterval: any;

  // 5. Constructor
  constructor(
    private userService:  UserService,
    private authService:  AuthService,
    private router:       Router,
    private dialog:       MatDialog,
    private snackBar:     MatSnackBar,
    private cdr:          ChangeDetectorRef,
    public themeService:  ThemeService,
    private notificationService: NotificationService,
  ) {}

  // 6. ngOnInit
  ngOnInit(): void {
    // Decode JWT payload to extract user info
    this.currentUser = this.authService.getUser();
    this.loadUsers();
    if (this.currentUser?.role === 'Admin') {
      this.loadNotifications();
      this.pollInterval = setInterval(() => this.loadNotifications(), 12000);
    }
    
    this.timeInterval = setInterval(() => {
      this.currentTime = new Date();
      this.cdr.markForCheck();
    }, 1000);
  }

  // 7. Public Methods
  getGreeting(): string {
    const hour = this.currentTime.getHours();
    let greeting = 'Good evening';
    if (hour < 12) {
      greeting = 'Good morning';
    } else if (hour < 18) {
      greeting = 'Good afternoon';
    }
    const name = this.currentUser?.name || 'User';
    return `${greeting}, ${name} 👋`;
  }

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
  loadUsers(): void {
    this.loading = true;
    this.userService.getUsers().subscribe({
      next: (res) => {
        this.users   = res.data.users;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.snack(err.error?.message || 'Failed to load users. Check your connection.', 'error');
        this.cdr.markForCheck();
      },
    });
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(CreateUserDialogComponent, {
      width: '360px',
      disableClose: false,
    });

    ref.afterClosed().subscribe((formValue) => {
      if (!formValue) return;

      this.loading = true;
      this.userService.createUser(formValue).subscribe({
        next: (res) => {
          this.users = [...this.users, res.data];
          this.loading = false;
          this.snack(`User "${res.data.name}" created successfully.`, 'success');
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loading = false;
          this.snack(err.error?.message || 'Failed to create user.', 'error');
          this.cdr.markForCheck();
        },
      });
    });
  }

  confirmDelete(user: User): void {
    if (user._id === this.currentUser?.id) {
      this.snack('You cannot delete your own account.', 'error');
      return;
    }

    const ref = this.dialog.open(ConfirmDeleteDialogComponent, {
      data: { userName: user.name },
      width: '380px',
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;

      this.loading = true;
      this.userService.deleteUser(user._id).subscribe({
        next: () => {
          this.users = this.users.filter((u) => u._id !== user._id);
          this.loading = false;
          this.snack(`User "${user.name}" deleted.`, 'success');
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loading = false;
          this.snack(err.error?.message || 'Failed to delete user.', 'error');
          this.cdr.markForCheck();
        },
      });
    });
  }

  onRoleChange(user: User, newRole: string): void {
    if (user.role === newRole) return;

    this.loading = true;
    this.userService.updateRole(user._id, newRole).subscribe({
      next: (res) => {
        const idx = this.users.findIndex((u) => u._id === user._id);
        if (idx !== -1) {
          this.users = [
            ...this.users.slice(0, idx),
            res.data,
            ...this.users.slice(idx + 1),
          ];
        }
        this.loading = false;
        this.snack(`Role updated to "${newRole}" for ${user.name}.`, 'success');
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.snack(err.error?.message || 'Failed to update role.', 'error');
        this.cdr.markForCheck();
      },
    });
  }

  logout(): void {
    this.authService.logout();
  }

  getRoleBadgeClass(role: string): string {
    const map: Record<string, string> = {
      Admin:      'badge-admin',
      Supervisor: 'badge-supervisor',
      Worker:     'badge-worker',
    };
    return map[role] ?? 'badge-worker';
  }

  // 8. Private Helper Methods
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

  private snack(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, '✕', {
      duration:           4000,
      panelClass:         type === 'success' ? ['snack-success'] : ['snack-error'],
      horizontalPosition: 'right',
      verticalPosition:   'bottom',
    });
  }

  // 9. ngOnDestroy
  ngOnDestroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }
}

// ── Inline confirm-delete dialog ──────────────────────────────────────────────
@Component({
  selector: 'app-confirm-delete-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-dialog">
      <div class="confirm-icon-wrap">
        <mat-icon class="confirm-icon">delete_forever</mat-icon>
      </div>
      <h2 mat-dialog-title>Delete User?</h2>
      <mat-dialog-content>
        <p>You are about to permanently delete <strong>{{ data.userName }}</strong>.<br />
        This action cannot be undone.</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-stroked-button id="cancel-delete-btn" [mat-dialog-close]="false">Cancel</button>
        <button mat-flat-button id="confirm-delete-btn" class="delete-btn" [mat-dialog-close]="true">
          Delete
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog { padding: 12px; font-family: 'Outfit', sans-serif; text-align: center; }
    .confirm-icon-wrap {
      display: inline-flex; align-items: center; justify-content: center;
      width: 56px; height: 56px; border-radius: 50%;
      background: rgba(239,68,68,0.15); margin-bottom: 12px;
    }
    .confirm-icon { font-size: 28px; width: 28px; height: 28px; color: #f87171; }
    h2 { font-size: 1.2rem; font-weight: 700; color: #e2e8f0; margin-bottom: 4px; }
    p  { color: #94a3b8; font-size: 0.9rem; line-height: 1.5; }
    strong { color: #e2e8f0; }
    .delete-btn {
      background: linear-gradient(90deg, #ef4444, #dc2626) !important;
      color: #fff !important; border-radius: 10px !important;
    }
    mat-dialog-actions { gap: 10px; }
  `],
})
export class ConfirmDeleteDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { userName: string }) {}
}
