import { User, UserRole, Address } from '../types';

const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;
const AUTH_API_BASE = metaEnv?.VITE_AUTH_API_BASE || 'http://localhost:4000';

console.log('Auth API Base URL:', AUTH_API_BASE);

const parseResponse = async (res: Response) => {
  let data: any = {};
  try {
    data = await res.json();
  } catch (parseError) {
    console.error('Failed to parse response:', parseError);
  }
  if (!res.ok) {
    console.error('HTTP Error:', res.status, res.statusText, data);
    const error = new Error(data.error || `Request failed with status ${res.status}`);
    (error as any).status = res.status;
    throw error;
  }
  return data;
};

// Customer Login
export const loginUser = async (email: string, password: string): Promise<User> => {
  console.log('→ Attempting customer login...');
  
  try {
    const res = await fetch(`${AUTH_API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password })
    });
    
    const data = await parseResponse(res);
    const fullName = data.name || [data.fname, data.mname, data.lname].filter(Boolean).join(' ');
    console.log('✓ Customer login successful');
    
    return {
      _id: data._id,
      name: fullName,
      email: data.email,
      role: (data.role as UserRole) || UserRole.USER
    };
  } catch (error) {
    console.error('✗ Customer login error:', error);
    throw error;
  }
};

// Admin Login - separate function, doesn't fallback
export const loginAdmin = async (identifier: string, password: string): Promise<User> => {
  console.log('→ Attempting admin login for:', identifier);
  console.log('→ Calling:', `${AUTH_API_BASE}/api/admins/login`);
  
  try {
    const res = await fetch(`${AUTH_API_BASE}/api/admins/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: identifier.trim(), password })
    });
    
    const data = await parseResponse(res);
    const fullName = data.name || [data.fname, data.mname, data.lname].filter(Boolean).join(' ');
    console.log('✓ Admin login successful:', fullName);
    
    return {
      _id: data._id,
      name: fullName || data.username || 'Admin',
      email: data.email,
      role: UserRole.ADMIN
    };
  } catch (error) {
    console.error('✗ Admin login error:', error);
    throw error;
  }
};

// Customer Signup
export const registerUser = async (fname: string, lname: string, email: string, password: string, mname = ''): Promise<User> => {
  const res = await fetch(`${AUTH_API_BASE}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.trim(),
      password,
      fname: fname.trim(),
      mname: mname.trim(),
      lname: lname.trim(),
      contactNumber: ''
    })
  });
  const data = await parseResponse(res);
  const fullName = data.name || [data.fname ?? fname, data.mname ?? mname, data.lname ?? lname].filter(Boolean).join(' ');
  return {
    _id: data._id,
    name: fullName,
    email: data.email,
    role: (data.role as UserRole) || UserRole.USER
  };
};

export const updateUserAddress = async (userId: string, address: Address): Promise<Address> => {
  return address;
};
