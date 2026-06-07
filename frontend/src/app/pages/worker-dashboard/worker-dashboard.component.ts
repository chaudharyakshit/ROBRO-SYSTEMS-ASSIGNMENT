import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService, AuthUser } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { ImageService } from '../../core/services/image.service';
import { CapturedImage } from '../../core/models/image.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-worker-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  templateUrl: './worker-dashboard.component.html',
  styleUrls: [
    '../admin-dashboard/admin-dashboard.component.scss',
    '../camera/camera.component.scss'
  ]
})
export class WorkerDashboardComponent implements OnInit, OnDestroy {
  currentUser: AuthUser | null = null;
  currentTime = new Date();

  gallery: CapturedImage[] = [];
  filtered: CapturedImage[] = [];
  galleryLoading = true;
  lightboxImage: CapturedImage | null = null;

  private timeInterval: any;

  constructor(
    private authService: AuthService,
    private imageService: ImageService,
    public themeService: ThemeService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getUser();
    
    this.timeInterval = setInterval(() => {
      this.currentTime = new Date();
      this.cdr.markForCheck();
    }, 1000);

    this.loadGallery();
  }

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

  logout(): void {
    this.authService.logout();
  }

  // --- Gallery Logic ---
  loadGallery(): void {
    this.galleryLoading = true;
    this.imageService.getImages().subscribe({
      next: (res) => {
        this.gallery = res.data.images || [];
        this.filtered = this.gallery;
        this.galleryLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.galleryLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  getImageUrl(filepath: string): string {
    return this.imageService.getImageUrl(filepath);
  }

  getUploaderName(img: CapturedImage): string {
    if (typeof img.userId === 'object' && img.userId !== null) {
      return img.userId.name;
    }
    return this.currentUser?.name || 'Unknown User';
  }

  getUploaderRole(img: CapturedImage): string {
    if (typeof img.userId === 'object' && img.userId !== null) {
      return img.userId.role;
    }
    return this.currentUser?.role || 'Worker';
  }

  getRoleClass(role: string): string {
    const map: Record<string, string> = {
      Admin:      'chip-admin',
      Supervisor: 'chip-supervisor',
      Worker:     'chip-worker',
    };
    return map[role] ?? 'chip-worker';
  }

  isOwnImage(img: CapturedImage): boolean {
    const uid = typeof img.userId === 'string' ? img.userId : img.userId?._id;
    return uid === this.currentUser?.id;
  }

  openLightbox(img: CapturedImage): void {
    this.lightboxImage = img;
    this.cdr.markForCheck();
  }

  closeLightbox(): void {
    this.lightboxImage = null;
    this.cdr.markForCheck();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('lightbox-backdrop')) {
      this.closeLightbox();
    }
  }

  downloadImage(img: CapturedImage): void {
    const url = this.getImageUrl(img.filepath);
    const a = document.createElement('a');
    a.href = url;
    a.download = img.filename || 'download.jpg';
    a.click();
  }

  ngOnDestroy(): void {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }
}
