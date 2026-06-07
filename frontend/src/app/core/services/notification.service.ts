import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NotificationUser {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export interface NotificationItem {
  _id: string;
  userId: NotificationUser;
  message: string;
  imagePath: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  success: boolean;
  message: string;
  data: NotificationItem[];
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly apiUrl = `${environment.apiUrl}/notifications`;

  constructor(private http: HttpClient) {}

  getNotifications(): Observable<NotificationsResponse> {
    return this.http.get<NotificationsResponse>(this.apiUrl);
  }

  markAllAsRead(): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/read`, {});
  }
}
