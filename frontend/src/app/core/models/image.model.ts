import { User } from './user.model';

export interface CapturedImage {
  _id: string;
  filename: string;
  filepath: string;
  capturedAt: Date;
  userId: User | string;
  mimetype?: string;
  size?: number;
  createdAt?: Date;
}
