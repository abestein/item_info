export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserCreateDTO {
  username: string;
  email: string;
  password: string;
  role: string;
  isActive?: boolean;
}

export interface UserUpdateDTO {
  username?: string;
  email?: string;
  password?: string;
  role?: string;
  isActive?: boolean;
}

export interface UserListParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  role?: string;
  isActive?: string;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PagePermission {
  page: string;
  name: string;
  description: string;
  category: string;
}

export interface UserPermissions {
  userId: number;
  permissions: string[] | null; // null means use role-based permissions
  useRolePermissions: boolean;
}

export interface UserPermissionsResponse {
  user: User;
  permissions: string[] | null;
  useRolePermissions: boolean;
  availablePages: PagePermission[];
  roleBasedPermissions: string[];
}
