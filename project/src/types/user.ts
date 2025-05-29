export interface User {
  _id: string;
  name: string;
  email: string;
  picture?: string;
  picturePublicId?: string;
  token?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: any) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}