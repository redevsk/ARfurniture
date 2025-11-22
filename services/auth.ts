
import { User, UserRole, Address } from '../types';

export const MOCK_ADMIN: User = {
  _id: 'admin-1',
  name: 'Store Admin',
  email: 'admin@arfurniture.com',
  role: UserRole.ADMIN,
  address: {
    street: '123 Paso de Blas',
    city: 'Valenzuela City',
    state: 'Metro Manila',
    zipCode: '1442',
    country: 'Philippines'
  }
};

export const loginUser = async (email: string, password: string): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Mock Admin Login
      if (email === 'admin@arfurniture.com' && password === 'admin123') {
        resolve(MOCK_ADMIN);
        return;
      }

      // Mock Customer Login
      if (email && password && email.includes('@')) {
        // Randomly assign address to some users for testing, but defaulting to undefined for demo of feature
        resolve({
          _id: 'cust-' + Math.random().toString(36).substr(2, 9),
          name: email.split('@')[0],
          email,
          role: UserRole.CUSTOMER
          // No address by default to test the "Add Address" flow
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

export const updateUserAddress = async (userId: string, address: Address): Promise<Address> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(address);
    }, 500);
  });
};
