import { User } from '../types';

class AuthService {
  private currentUser: User | null = null;
  private users: User[] = [];

  constructor() {
    // Load from localStorage
    const savedUser = localStorage.getItem('conquerun_user');
    const savedUsers = localStorage.getItem('conquerun_users');
    
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
    }
    
    if (savedUsers) {
      this.users = JSON.parse(savedUsers);
    } else {
      // Initialize with mock users for demo
      this.users = [
        {
          id: 'user1',
          username: 'Explorer',
          email: 'explorer@example.com',
          totalPoints: 450,
          claimedTerritories: 3,
          achievements: [],
          createdAt: new Date('2024-01-15'),
          isOnline: true
        },
        {
          id: 'user2',
          username: 'Conqueror',
          email: 'conqueror@example.com',
          totalPoints: 320,
          claimedTerritories: 2,
          achievements: [],
          createdAt: new Date('2024-01-20'),
          isOnline: false
        },
        {
          id: 'user3',
          username: 'Navigator',
          email: 'navigator@example.com',
          totalPoints: 280,
          claimedTerritories: 2,
          achievements: [],
          createdAt: new Date('2024-02-01'),
          isOnline: true
        }
      ];
      this.saveUsers();
    }
  }

  async login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    // Mock authentication - in production would validate against backend
    const user = this.users.find(u => u.email === email);
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    this.currentUser = { ...user, isOnline: true };
    localStorage.setItem('conquerun_user', JSON.stringify(this.currentUser));
    
    return { success: true, user: this.currentUser };
  }

  async register(email: string, password: string, username: string): Promise<{ success: boolean; user?: User; error?: string }> {
    // Check if user already exists
    if (this.users.some(u => u.email === email)) {
      return { success: false, error: 'Email already registered' };
    }

    if (this.users.some(u => u.username === username)) {
      return { success: false, error: 'Username already taken' };
    }

    const newUser: User = {
      id: `user_${Date.now()}`,
      username,
      email,
      totalPoints: 0,
      claimedTerritories: 0,
      achievements: [],
      createdAt: new Date(),
      isOnline: true
    };

    this.users.push(newUser);
    this.currentUser = newUser;
    
    this.saveUsers();
    localStorage.setItem('conquerun_user', JSON.stringify(this.currentUser));

    return { success: true, user: this.currentUser };
  }

  logout(): void {
    if (this.currentUser) {
      this.currentUser.isOnline = false;
    }
    this.currentUser = null;
    localStorage.removeItem('conquerun_user');
    this.saveUsers();
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  updateUserStats(points: number, territories: number): void {
    if (this.currentUser) {
      this.currentUser.totalPoints += points;
      this.currentUser.claimedTerritories += territories;
      
      // Update in users array
      const userIndex = this.users.findIndex(u => u.id === this.currentUser!.id);
      if (userIndex !== -1) {
        this.users[userIndex] = { ...this.currentUser };
      }
      
      localStorage.setItem('conquerun_user', JSON.stringify(this.currentUser));
      this.saveUsers();
    }
  }

  getLeaderboard(): User[] {
    return [...this.users]
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 100);
  }

  private saveUsers(): void {
    localStorage.setItem('conquerun_users', JSON.stringify(this.users));
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }
}

export const authService = new AuthService();