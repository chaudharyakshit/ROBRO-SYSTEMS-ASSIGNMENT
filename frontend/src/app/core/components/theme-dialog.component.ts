import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ThemeService, ThemeType } from '../services/theme.service';

@Component({
  selector: 'app-theme-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="themes-dialog">
      <div class="dialog-header">
        <h2>Themes</h2>
        <button mat-icon-button (click)="close()"><mat-icon>close</mat-icon></button>
      </div>

      <div class="themes-grid">
        <!-- White Theme -->
        <div class="theme-card" [class.active]="currentTheme === 'white'" (click)="selectTheme('white')">
          <div class="theme-preview white-preview">
            <div class="check-overlay" *ngIf="currentTheme === 'white'">
              <mat-icon class="check-icon">check</mat-icon>
            </div>
          </div>
          <span class="theme-label">White</span>
        </div>

        <!-- Aurora Theme -->
        <div class="theme-card" [class.active]="currentTheme === 'aurora'" (click)="selectTheme('aurora')">
          <div class="theme-preview aurora-preview">
            <div class="check-overlay" *ngIf="currentTheme === 'aurora'">
              <mat-icon class="check-icon">check</mat-icon>
            </div>
          </div>
          <span class="theme-label">Aurora</span>
        </div>

        <!-- Carbon Theme -->
        <div class="theme-card" [class.active]="currentTheme === 'carbon'" (click)="selectTheme('carbon')">
          <div class="theme-preview carbon-preview">
            <div class="check-overlay" *ngIf="currentTheme === 'carbon'">
              <mat-icon class="check-icon">check</mat-icon>
            </div>
          </div>
          <span class="theme-label">Carbon</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .themes-dialog {
      padding: 24px;
      font-family: 'Outfit', sans-serif;
      background: var(--bg-themes-dialog);
      color: var(--color-themes-dialog-text);
      border-radius: 16px;
    }
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 700;
        letter-spacing: -0.01em;
        color: var(--color-themes-dialog-text);
      }
      button {
        color: var(--color-text-muted);
      }
    }
    .themes-grid {
      display: flex;
      gap: 16px;
      justify-content: center;
    }
    .theme-card {
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      transition: transform 0.2s ease;
      &:hover {
        transform: translateY(-2px);
      }
    }
    .theme-preview {
      width: 110px;
      height: 70px;
      border-radius: 10px;
      position: relative;
      overflow: hidden;
      border: 2px solid rgba(128, 128, 128, 0.15);
      transition: all 0.25s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .theme-card.active .theme-preview {
      border-color: #6366f1;
      box-shadow: 0 0 14px rgba(99, 102, 241, 0.5);
    }
    .white-preview {
      background: #f8fafc;
      border: 1px solid rgba(15, 23, 42, 0.08);
    }
    .aurora-preview {
      background: url('/bg-aurora.jpg') no-repeat center center/cover;
    }
    .carbon-preview {
      background: url('/bg-carbon.jpg') no-repeat center center/cover;
    }
    .check-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(99, 102, 241, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      .check-icon {
        color: #ffffff !important;
        background: #6366f1;
        border-radius: 50%;
        font-size: 16px;
        width: 22px;
        height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
    .theme-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-text-muted);
      transition: color 0.2s;
    }
    .theme-card.active .theme-label {
      color: var(--color-themes-dialog-text);
    }
  `],
})
export class ThemeDialogComponent implements OnInit {
  currentTheme: ThemeType = 'white';

  constructor(
    private themeService: ThemeService,
    private dialogRef: MatDialogRef<ThemeDialogComponent>
  ) {}

  ngOnInit(): void {
    this.currentTheme = this.themeService.theme;
  }

  selectTheme(theme: ThemeType): void {
    this.currentTheme = theme;
    this.themeService.setTheme(theme);
  }

  close(): void {
    this.dialogRef.close();
  }
}
