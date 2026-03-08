
import { Box, ShoppingBag, LayoutDashboard, LogOut, User, ClipboardList, Megaphone, Settings } from 'lucide-react';

export const APP_NAME = "ARFurniture";
export const CURRENCY = "₱";

// Get API base URL from environment or construct it
export const getApiBaseUrl = (): string => {
  // 1. If we are in the browser, check the hostname
  // This is the most reliable way to detect production environment
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.endsWith('.local');

    // If not local, we're on Vercel or other production host - use empty string for same-origin
    if (!isLocal) {
      return '';
    }
  }

  // 2. Fallback to Vite env variables for development/special cases
  const envBase = import.meta.env.VITE_AUTH_API_BASE;
  if (envBase) {
    return envBase.replace(/\/$/, '');
  }

  // 3. Absolute fallback for local development
  return 'http://localhost:4000';
};

// Resolve asset URLs to work from any host (localhost, LAN IP, or tunnel)
// Handles relative paths, absolute URLs, and localhost URLs
export const resolveAssetUrl = (url: string | undefined): string => {
  if (!url) return '';

  // If it's already an absolute URL (http/https), return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // For relative paths, resolve against the API server
  const apiBase = getApiBaseUrl();

  // Ensure path starts with /
  const path = url.startsWith('/') ? url : `/${url}`;

  return `${apiBase}${path}`;
};

export const NAV_ITEMS_CUSTOMER = [
  { label: 'Shop', path: '/', icon: ShoppingBag },
  { label: 'About', path: '/about', icon: User },
];

export const NAV_ITEMS_ADMIN = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { label: 'Products', path: '/admin/products', icon: Box },
  { label: 'Orders', path: '/admin/orders', icon: ClipboardList },
  { label: 'Marketing', path: '/admin/marketing', icon: Megaphone },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
];
