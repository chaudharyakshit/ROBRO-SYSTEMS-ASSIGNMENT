import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  // isLoggedIn checks if token exists, is formatted correctly, and exp claim has not passed
  if (auth.isLoggedIn()) {
    return true;
  }

  // Clear local storage and redirect if invalid or expired
  auth.logout();
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
