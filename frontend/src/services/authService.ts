import { User } from '../types';

export const API_URL = 'http://localhost:5000/api';

class AuthService {
  private currentUser: User | null = null;

  constructor() {
    const user = localStorage.getItem('conquerun_user');
    if (user) {
      this.currentUser = JSON.parse(user);
    }
  }

  getAuthHeaders() {
    const token = localStorage.getItem('conquerun_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  async login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      const { user, token } = data;

      this.currentUser = user;
      localStorage.setItem('conquerun_user', JSON.stringify(user));
      localStorage.setItem('conquerun_token', token);

      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: 'Network error during login.' };
    }
  }

  async register(email: string, password: string, username: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ email, password, username }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }

      const { user, token } = data;

      this.currentUser = user;
      localStorage.setItem('conquerun_user', JSON.stringify(user));
      localStorage.setItem('conquerun_token', token);

      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: 'Network error during registration.' };
    }
  }

  logout(): void {
    this.currentUser = null;
    localStorage.removeItem('conquerun_user');
    localStorage.removeItem('conquerun_token');
  }

  async fetchProfile(): Promise<User | null> {
    const token = localStorage.getItem('conquerun_token');
    if (!token) return null;

    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        this.logout();
        return null;
      }

      const data = await response.json();
      const { user } = data;
      this.currentUser = user;
      localStorage.setItem('conquerun_user', JSON.stringify(user));
      return user;
    } catch (error) {
      return null;
    }
  }
  
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  async getLeaderboard(): Promise<User[]> {
    try {
      const response = await fetch(`${API_URL}/leaderboard`, {
        headers: this.getAuthHeaders(),
      });
      if (!response.ok) return [];
      const data = await response.json();
      const entries: (User & { _id?: string })[] = Array.isArray(data) ? data : data?.leaderboard ?? [];
      // The API returns Mongo's `_id`; the UI matches players by `id`
      return entries.map(({ _id, ...user }) => ({ ...user, id: user.id ?? _id ?? '' }));
    } catch (error) {
      return [];
    }
  }
  
  public async updateUserProfile(username: string): Promise<{ success: boolean; error?: string; user?: User }> {
    try {
      const token = localStorage.getItem('conquerun_token');
      if (!token) return { success: false, error: 'Not authenticated' };

      const response = await fetch(`${API_URL}/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to update profile' };
      }

      this.currentUser = data.user;
      localStorage.setItem('conquerun_user', JSON.stringify(data.user));

      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  public async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const token = localStorage.getItem('conquerun_token');
      if (!token) return { success: false, error: 'Not authenticated' };

      const response = await fetch(`${API_URL}/user/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to change password' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
}

export const authService = new AuthService();