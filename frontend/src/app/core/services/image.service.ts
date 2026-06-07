import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { CapturedImage } from '../models/image.model';

export interface ImagesResponse {
  success: boolean;
  message: string;
  data: {
    images: CapturedImage[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  };
}

export interface ImageUploadResponse {
  success: boolean;
  message: string;
  data: CapturedImage;
}

export interface ImageDeleteResponse {
  success: boolean;
  message: string;
  data: null;
}

@Injectable({ providedIn: 'root' })
export class ImageService {
  private readonly apiUrl = `${environment.apiUrl}/images`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  uploadImage(blob: Blob, filename: string = `capture_${Date.now()}.jpg`): Observable<ImageUploadResponse> {
    const formData = new FormData();
    formData.append('image', blob, filename);
    return this.http.post<ImageUploadResponse>(`${this.apiUrl}/upload`, formData);
  }

  getImages(): Observable<ImagesResponse> {
    return this.http.get<ImagesResponse>(this.apiUrl);
  }

  deleteImage(id: string): Observable<ImageDeleteResponse> {
    return this.http.delete<ImageDeleteResponse>(`${this.apiUrl}/${id}`);
  }

  getImageUrl(filepath: string): string {
    if (!filepath) return '';
    const filename = filepath.split('/').pop() || '';
    const token = this.auth.getToken();
    return `${this.apiUrl}/file/${filename}${token ? '?token=' + encodeURIComponent(token) : ''}`;
  }
}
