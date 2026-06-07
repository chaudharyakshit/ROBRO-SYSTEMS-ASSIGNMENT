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
    .dialog-wrapper { padding: 8px; font-family: 'Outfit', sans-serif; }
    .dialog-title {
      display: flex; align-items: center; gap: 10px;
      font-size: 1.25rem; font-weight: 700; color: var(--color-dialog-title); margin-bottom: 4px;
      mat-icon { color: #6366f1; }
    }
    .dialog-body { display: flex; flex-direction: column; min-width: 360px; padding-top: 8px; }
    .full-width { width: 100%; margin-bottom: 4px; }
    .dialog-actions { padding-top: 16px; gap: 10px; }
    .confirm-btn {
      background: linear-gradient(90deg, #3b82f6, #6366f1) !important;
      color: #fff !important;
      border-radius: 10px !important;
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
