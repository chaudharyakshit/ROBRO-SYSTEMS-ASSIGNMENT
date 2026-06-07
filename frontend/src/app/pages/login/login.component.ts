// 1. Imports
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { MatCardModule }           from '@angular/material/card';
import { MatFormFieldModule }      from '@angular/material/form-field';
import { MatInputModule }          from '@angular/material/input';
import { MatButtonModule }         from '@angular/material/button';
import { MatIconModule }           from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../core/services/auth.service';

// 2. Component Decorator
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  // 4. Class Properties
  loginForm!: FormGroup;
  loading = false;
  errorMessage = '';
  hidePassword = true;

  // 5. Constructor
  constructor(
    private fb:          FormBuilder,
    private authService: AuthService,
    private router:      Router,
  ) {
    // If already logged in, skip the login page
    if (this.authService.isLoggedIn()) {
      const role = this.authService.getRole();
      this.router.navigate([role === 'Admin' ? '/admin' : '/dashboard']);
    }
  }

  // 6. ngOnInit
  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  // 7. Public Methods
  get email() {
    return this.loginForm.get('email')!;
  }

  get password() {
    return this.loginForm.get('password')!;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.loading      = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (res) => {
        this.loading = false;
        const role   = res.data.user.role;
        this.router.navigate([role === 'Admin' ? '/admin' : '/dashboard']);
      },
      error: (err) => {
        this.loading      = false;
        this.errorMessage = err.error?.message || 'Invalid email or password.';
      },
    });
  }

  // 9. ngOnDestroy
  ngOnDestroy(): void {
    // Cleanups if necessary
  }
}
