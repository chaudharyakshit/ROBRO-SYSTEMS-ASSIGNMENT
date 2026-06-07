import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Supervisor' | 'Worker';
  isActive: boolean;
}

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: AuthUser;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'robro_token';
  private readonly apiUrl    = `${environment.apiUrl}/auth`;

  private currentUserSubject = new BehaviorSubject<AuthUser | null>(this.loadUserFromStorage());
  public currentUser$        = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  // ── Stored-user loader (Decodes name, email, role from JWT) ──────────────
  private loadUserFromStorage(): AuthUser | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Verify token expiration
      if (payload.exp * 1000 <= Date.now()) {
        localStorage.clear();
        return null;
      }
      return {
        id:       payload.id,
        name:     payload.name,
        email:    payload.email,
        role:     payload.role,
        isActive: true,
      };
    } catch {
      return null;
    }
  }

  // ── Login ──────────────────────────────────────────────────────────────
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap((res) => {
          if (res?.data?.token) {
            // ONLY store the JWT token, never store the password
            localStorage.setItem(this.TOKEN_KEY, res.data.token);

            // Populate subject from decoded token payload for security consistency
            const payload = JSON.parse(atob(res.data.token.split('.')[1]));
            const user: AuthUser = {
              id:       payload.id,
              name:     payload.name,
              email:    payload.email,
              role:     payload.role,
              isActive: true,
            };
            this.currentUserSubject.next(user);
          }
        }),
      );
  }

  // ── Logout ─────────────────────────────────────────────────────────────
  logout(): void {
    // Clear ALL localStorage items
    localStorage.clear();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  // ── Token access ───────────────────────────────────────────────────────
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // ── Auth check (validates JWT expiry by decoding payload) ──────────────
  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  // ── Role helpers ───────────────────────────────────────────────────────
  getRole(): string | null {
    const user = this.getUser();
    return user ? user.role : null;
  }

  getUser(): AuthUser | null {
    if (!this.currentUserSubject.value) {
      const decodedUser = this.loadUserFromStorage();
      if (decodedUser) {
        this.currentUserSubject.next(decodedUser);
      }
    }
    return this.currentUserSubject.value;
  }

  get currentUserValue(): AuthUser | null {
    return this.getUser();
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn();
  }

  getUserRole(): string | null {
    return this.getRole();
  }
}
