// 1. Imports
import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  OnInit,
  HostListener,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { MatToolbarModule }          from '@angular/material/toolbar';
import { MatButtonModule }           from '@angular/material/button';
import { MatIconModule }             from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule }  from '@angular/material/progress-spinner';
import { MatTooltipModule }          from '@angular/material/tooltip';
import { MatChipsModule }            from '@angular/material/chips';
import { MatMenuModule }             from '@angular/material/menu';
import { MatDividerModule }          from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { ImageService }              from '../../core/services/image.service';
import { AuthService, AuthUser }     from '../../core/services/auth.service';
import { CapturedImage }             from '../../core/models/image.model';
import { ThemeService }              from '../../core/services/theme.service';
import { ThemeDialogComponent }      from '../../core/components/theme-dialog.component';
import { NotificationService, NotificationItem } from '../../core/services/notification.service';

// 3. Interface Definitions
export type RoleFilter = 'All' | 'Admin' | 'Supervisor' | 'Worker';

// 2. Component Decorator
@Component({
  selector: 'app-camera',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule,
    MatDialogModule,
  ],
  templateUrl: './camera.component.html',
  styleUrls: [
    '../admin-dashboard/admin-dashboard.component.scss',
    './camera.component.scss'
  ],
})
export class CameraComponent implements OnInit, AfterViewInit, OnDestroy {
  // 4. Class Properties
  @ViewChild('videoEl')  videoEl!:  ElementRef<HTMLVideoElement>;
  @ViewChild('canvasEl') canvasEl!: ElementRef<HTMLCanvasElement>;

  stream:        MediaStream | null = null;
  capturedSrc:   string | null      = null;
  imageBlob:     Blob | null        = null;
  gallery:       CapturedImage[]    = [];
  filtered:      CapturedImage[]    = [];
  cameraError = '';
  uploading   = false;
  galleryLoading = true;
  currentUser:   AuthUser | null    = null;
  lightboxImage: CapturedImage | null = null;
  activeFilter:  RoleFilter         = 'All';
  readonly filterOptions: RoleFilter[] = ['All', 'Admin', 'Supervisor', 'Worker'];
  notifications: NotificationItem[] = [];
  unreadCount = 0;
  private pollInterval: any;

  // 5. Constructor
  constructor(
    private imageService: ImageService,
    private authService:  AuthService,
    private router:       Router,
    private snackBar:     MatSnackBar,
    private cdr:          ChangeDetectorRef,
    public themeService:  ThemeService,
    private dialog:       MatDialog,
    private notificationService: NotificationService,
  ) {}

  // 6. ngOnInit
  ngOnInit(): void {
    // Decode JWT payload to extract user role
    this.currentUser = this.authService.getUser();
    if (this.currentUser?.role === 'Admin') {
      this.loadNotifications();
      this.pollInterval = setInterval(() => this.loadNotifications(), 12000);
    }
  }

  // 6b. ngAfterViewInit
  ngAfterViewInit(): void {
    this.startCamera();
    this.loadGallery();
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

  // 7. Public Methods
  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.lightboxImage) {
      this.closeLightbox();
    }
  }

  startCamera(): void {
    this.cameraError = '';
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.cameraError = 'Camera API is not supported in this browser or requires a secure context (HTTPS).';
      this.cdr.markForCheck();
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } })
      .then((stream) => {
        this.stream = stream;
        this.videoEl.nativeElement.srcObject = stream;
        this.cdr.markForCheck();
      })
      .catch(() => {
        this.cameraError = 'Camera access denied or unavailable. Please check browser permissions.';
        this.cdr.markForCheck();
      });
  }

  stopCamera(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }

  capture(): void {
    const video  = this.videoEl.nativeElement;
    const canvas = this.canvasEl.nativeElement;
    const ctx    = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width  = video.videoWidth  || 1280;
    canvas.height = video.videoHeight || 720;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    this.capturedSrc = canvas.toDataURL('image/jpeg', 0.92);

    // Canvas snapshot converted to JPEG blob at 0.9 quality
    canvas.toBlob(
      (blob) => { this.imageBlob = blob; this.cdr.markForCheck(); },
      'image/jpeg',
      0.92,
    );
  }

  retake(): void {
    this.capturedSrc = null;
    this.imageBlob   = null;
  }

  upload(): void {
    if (!this.imageBlob || this.uploading) return;
    this.uploading = true;

    this.imageService.uploadImage(this.imageBlob, `capture_${Date.now()}.jpg`).subscribe({
      next: (res) => {
        this.uploading   = false;
        this.capturedSrc = null;
        this.imageBlob   = null;

        const newRecord: CapturedImage = {
          ...res.data,
          userId: {
            _id:       this.currentUser!.id,
            name:      this.currentUser!.name,
            email:     this.currentUser!.email,
            role:      this.currentUser!.role,
            isActive:  this.currentUser!.isActive,
            createdAt: new Date(),
          },
        };

        this.gallery  = [newRecord, ...this.gallery];
        this.applyFilter(this.activeFilter);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.uploading = false;
        this.snack(err.error?.message || 'Upload failed. Please try again.', 'error');
        this.cdr.markForCheck();
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (this.uploading) {
      input.value = '';
      return;
    }
    this.uploading = true;

    this.imageService.uploadImage(file, file.name).subscribe({
      next: (res) => {
        this.uploading = false;
        input.value = '';

        const newRecord: CapturedImage = {
          ...res.data,
          userId: {
            _id:       this.currentUser!.id,
            name:      this.currentUser!.name,
            email:     this.currentUser!.email,
            role:      this.currentUser!.role,
            isActive:  this.currentUser!.isActive,
            createdAt: new Date(),
          },
        };

        this.gallery  = [newRecord, ...this.gallery];
        this.applyFilter(this.activeFilter);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.uploading = false;
        input.value = '';
        this.snack(err.error?.message || 'Upload failed. Please try again.', 'error');
        this.cdr.markForCheck();
      },
    });
  }

  loadGallery(): void {
    this.galleryLoading = true;
    this.imageService.getImages().subscribe({
      next: (res) => {
        const images        = res.data.images;
        this.gallery        = images;
        this.filtered       = images;
        this.galleryLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.galleryLoading = false;
        this.snack(err.error?.message || 'Failed to load gallery images.', 'error');
        this.cdr.markForCheck();
      },
    });
  }

  applyFilter(filter: RoleFilter): void {
    this.activeFilter = filter;
    if (filter === 'All') {
      this.filtered = this.gallery;
    } else {
      this.filtered = this.gallery.filter((img) => this.getUploaderRole(img) === filter);
    }
    this.cdr.markForCheck();
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
    const blobUrl = this.getImageUrl(img.filepath);
    if (!blobUrl || blobUrl.startsWith('assets/')) {
      this.snack('Image not ready for download.', 'error');
      return;
    }
    const filename = img.filename || img.filepath.split('/').pop() || 'capture.jpg';

    const anchor    = document.createElement('a');
    anchor.href     = blobUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }

  deleteImage(img: CapturedImage): void {
    if (!confirm('Are you sure you want to delete this photo? This cannot be undone.')) {
      return;
    }
    
    this.imageService.deleteImage(img._id).subscribe({
      next: () => {
        this.gallery = this.gallery.filter(i => i._id !== img._id);
        this.filtered = this.filtered.filter(i => i._id !== img._id);
        this.closeLightbox();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.snack(err.error?.message || 'Failed to delete image.', 'error');
      }
    });
  }

  getImageUrl(filepath: string): string {
    return this.imageService.getImageUrl(filepath);
  }

  isAdmin(): boolean {
    return this.currentUser?.role === 'Admin';
  }

  isOwnImage(img: CapturedImage): boolean {
    const uid = typeof img.userId === 'string' ? img.userId : img.userId._id;
    return uid === this.currentUser?.id;
  }

  getUploaderName(img: CapturedImage): string {
    if (typeof img.userId === 'object' && img.userId !== null) {
      return img.userId.name;
    }
    return this.currentUser?.name ?? 'Unknown';
  }

  getUploaderRole(img: CapturedImage): string {
    if (typeof img.userId === 'object' && img.userId !== null) {
      return img.userId.role;
    }
    return this.currentUser?.role ?? '';
  }

  getRoleClass(role: string): string {
    const map: Record<string, string> = {
      Admin:      'chip-admin',
      Supervisor: 'chip-supervisor',
      Worker:     'chip-worker',
    };
    return map[role] ?? 'chip-worker';
  }

  logout(): void {
    this.stopCamera();
    this.authService.logout();
  }

  get galleryTitle(): string {
    return this.isAdmin() ? 'All Captures' : 'My Gallery';
  }

  get filteredCount(): number {
    return this.filtered.length;
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
    this.stopCamera();
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }
}
