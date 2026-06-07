import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';

export interface UsersResponse {
  success: boolean;
  message: string;
  data: {
    users: User[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  };
}

export interface UserResponse {
  success: boolean;
  message: string;
  data: User;
}

export interface DeleteUserResponse {
  success: boolean;
  message: string;
  data: null;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<UsersResponse> {
    return this.http.get<UsersResponse>(this.apiUrl);
  }

  createUser(data: { name: string; email: string; password: string; role: string }): Observable<UserResponse> {
    return this.http.post<UserResponse>(this.apiUrl, data);
  }

  deleteUser(id: string): Observable<DeleteUserResponse> {
    return this.http.delete<DeleteUserResponse>(`${this.apiUrl}/${id}`);
  }

  updateRole(id: string, role: string): Observable<UserResponse> {
    return this.http.patch<UserResponse>(`${this.apiUrl}/${id}/role`, { role });
  }
}
