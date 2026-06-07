import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth     = inject(AuthService);
  const snackBar = inject(MatSnackBar);
  const token    = auth.getToken();

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401) {
          auth.logout();
        } else if (error.status === 403) {
          snackBar.open('Access Denied', '✕', {
            duration:           4000,
            panelClass:         ['snack-error'],
            horizontalPosition: 'right',
            verticalPosition:   'bottom',
          });
        }
      }
      return throwError(() => error);
    })
  );
};
