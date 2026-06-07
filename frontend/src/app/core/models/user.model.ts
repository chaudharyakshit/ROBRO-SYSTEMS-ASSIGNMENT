export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Supervisor' | 'Worker';
  isActive: boolean;
  createdAt: Date;
}
