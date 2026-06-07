import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, _state) => {
  const auth         = inject(AuthService);
  const router       = inject(Router);

  // Support both single role (string) and multiple roles (string[])
  const allowed = route.data['allowedRoles'] as string | string[];
  const allowedRoles: string[] = Array.isArray(allowed) ? allowed : [allowed];

  const userRole = auth.getRole();

  if (auth.isLoggedIn() && userRole && allowedRoles.includes(userRole)) {
    return true;
  }

  // Authenticated but wrong role → redirect to their default page
  if (auth.isLoggedIn()) {
    router.navigate([userRole === 'Admin' ? '/admin' : '/dashboard']);
  } else {
    router.navigate(['/login']);
  }

  return false;
};
