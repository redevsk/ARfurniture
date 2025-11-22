import { User, UserRole } from '../types';

export const MOCK_ADMIN: User = {
  _id: 'admin-1',
  name: 'Store Admin',
  email: 'admin@arniture.com',
  role: UserRole.ADMIN
};

export const loginUser = async (email: string, password: string): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Mock Admin Login
      if (email === 'admin@arniture.com' && password === 'admin123') {
        resolve(MOCK_ADMIN);
        return;
      }

      // Mock Customer Login
      if (email && password && email.includes('@')) {
        resolve({
          _id: 'cust-' + Math.random().toString(36).substr(2, 9),
          name: email.split('@')[0],
          email,
          role: UserRole.CUSTOMER
        });
        return;
      }

      reject(new Error('Invalid credentials'));
    }, 800);
  });
};

export const registerUser = async (name: string, email: string, password: string): Promise<User> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        _id: 'cust-' + Math.random().toString(36).substr(2, 9),
        name,
        email,
        role: UserRole.CUSTOMER
      });
    }, 800);
  });
};