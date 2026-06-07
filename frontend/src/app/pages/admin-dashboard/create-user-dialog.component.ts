// 1. Imports
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule }             from '@angular/material/form-field';
import { MatInputModule }                 from '@angular/material/input';
import { MatSelectModule }                from '@angular/material/select';
import { MatButtonModule }                from '@angular/material/button';
import { MatIconModule }                  from '@angular/material/icon';

// 2. Component Decorator
@Component({
  selector: 'app-create-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="dialog-wrapper">
      <h2 mat-dialog-title class="dialog-title">
        <mat-icon>person_add</mat-icon>
        Create New User
      </h2>

      <mat-dialog-content class="dialog-body">
        <form [formGroup]="form" id="create-user-form">
          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Full Name</mat-label>
            <input matInput formControlName="name" placeholder="John Doe" />
            <mat-error *ngIf="form.get('name')?.hasError('required')">Name is required</mat-error>
          </mat-form-field>

          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Email Address</mat-label>
            <input matInput type="email" formControlName="email" placeholder="john@example.com" />
            <mat-error *ngIf="form.get('email')?.hasError('required')">Email is required</mat-error>
            <mat-error *ngIf="form.get('email')?.hasError('email')">Enter a valid email</mat-error>
          </mat-form-field>

          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Password</mat-label>
            <input matInput type="password" formControlName="password" placeholder="Min 8 characters" />
            <mat-error *ngIf="form.get('password')?.hasError('required')">Password is required</mat-error>
            <mat-error *ngIf="form.get('password')?.hasError('minlength')">
              Minimum 8 characters required
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Role</mat-label>
            <mat-select formControlName="role">
              <mat-option value="Supervisor">Supervisor</mat-option>
              <mat-option value="Worker">Worker</mat-option>
            </mat-select>
            <mat-error *ngIf="form.get('role')?.hasError('required')">Role is required</mat-error>
          </mat-form-field>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="dialog-actions">
        <button mat-stroked-button id="cancel-dialog-btn" (click)="onCancel()">Cancel</button>
        <button
          mat-flat-button
          id="confirm-create-btn"
          class="confirm-btn"
          [disabled]="form.invalid"
          (click)="onConfirm()"
        >
          Create User
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-wrapper {
      padding: 16px 20px;
      font-family: 'Outfit', sans-serif;
      background: var(--bg-dialog);
    }
    .dialog-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--color-dialog-title);
      margin: 0 0 16px 0 !important;
      padding: 0 !important;
      border: none !important;
      mat-icon {
        color: #6366f1;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }
    .dialog-body {
      display: flex;
      flex-direction: column;
      min-width: 280px;
      padding: 0 !important;
      margin: 0 !important;
      overflow: visible !important;
    }
    .full-width {
      width: 100%;
      margin-bottom: 4px;
    }
    .dialog-actions {
      padding: 12px 0 0 0 !important;
      margin: 0 !important;
      gap: 8px;
    }
    .confirm-btn {
      background: linear-gradient(90deg, #3b82f6, #6366f1) !important;
      color: #fff !important;
      border-radius: 8px !important;
      font-size: 0.8rem !important;
      padding: 0 14px !important;
      height: 32px !important;
      font-weight: 600 !important;
      font-family: 'Outfit', sans-serif !important;
    }
    #cancel-dialog-btn {
      border-radius: 8px !important;
      font-size: 0.8rem !important;
      padding: 0 14px !important;
      height: 32px !important;
      color: var(--color-text-muted) !important;
      border-color: var(--border-dialog, rgba(255, 255, 255, 0.08)) !important;
      font-weight: 600 !important;
      font-family: 'Outfit', sans-serif !important;
    }

    ::ng-deep .dialog-wrapper {
      /* Form field compact style */
      .mat-mdc-form-field {
        font-size: 0.8rem !important;
        width: 100%;
      }

      /* Wrapper style */
      .mat-mdc-text-field-wrapper {
        height: 38px !important;
        padding: 0 12px !important;
        background-color: var(--bg-input-field) !important;
        border-radius: 8px !important;
        border: 1px solid var(--border-dialog, rgba(255, 255, 255, 0.08)) !important;
        transition: all 0.2s ease;
      }

      /* Hover & Focus state */
      .mat-mdc-form-field.mat-focused .mat-mdc-text-field-wrapper {
        border-color: #6366f1 !important;
        box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15) !important;
      }

      .mat-mdc-form-field-infix {
        min-height: 38px !important;
        padding-top: 13px !important;
        padding-bottom: 0px !important;
      }

      /* Input styling */
      .mdc-text-field__input {
        font-size: 0.8rem !important;
        color: var(--color-input-text) !important;
        &::placeholder {
          color: var(--color-text-muted) !important;
          opacity: 0.5;
        }
      }

      /* Labels styling */
      .mdc-floating-label {
        font-size: 0.8rem !important;
        color: var(--color-input-label) !important;
        top: 20px !important;
      }

      .mdc-floating-label--float-above {
        transform: translateY(-13px) scale(0.75) !important;
      }

      /* Hide active/default underlines */
      .mdc-line-ripple,
      .mdc-line-ripple::before,
      .mdc-line-ripple::after {
        display: none !important;
      }

      /* Error messages container */
      .mat-mdc-form-field-subscript-wrapper {
        margin-top: 2px !important;
        padding: 0 !important;
        font-size: 0.7rem !important;
      }

      .mat-mdc-form-field-error-wrapper {
        padding: 0 !important;
      }

      /* Dropdown select height adjustments */
      .mat-mdc-select-trigger {
        height: 18px !important;
        display: inline-flex !important;
        align-items: center !important;
      }

      .mat-mdc-select-value {
        font-size: 0.8rem !important;
        color: var(--color-input-text) !important;
      }

      .mat-mdc-select-arrow-wrapper {
        height: 18px !important;
        display: flex !important;
        align-items: center !important;
      }
    }
  `],
})
export class CreateUserDialogComponent implements OnInit, OnDestroy {
  // 4. Class Properties
  form!: FormGroup;

  // 5. Constructor
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateUserDialogComponent>,
  ) {}

  // 6. ngOnInit
  ngOnInit(): void {
    this.form = this.fb.group({
      name:     ['', [Validators.required, Validators.minLength(2)]],
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      role:     ['Worker', Validators.required],
    });
  }

  // 7. Public Methods
  onCancel(): void {
    this.dialogRef.close(null);
  }

  onConfirm(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }

  // 9. ngOnDestroy
  ngOnDestroy(): void {
    // Teardown logic if required
  }
}
