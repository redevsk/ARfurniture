
import { Box, ShoppingBag, LayoutDashboard, LogOut, User, ClipboardList, Megaphone } from 'lucide-react';

export const APP_NAME = "ARFurniture";
export const CURRENCY = "₱";

// Resolve asset URLs to work from any host (localhost, LAN IP, or tunnel)
// Handles relative paths, absolute URLs, and localhost URLs
export const resolveAssetUrl = (url: string | undefined): string => {
  if (!url) return '';
  
  // If it starts with http://localhost or http://127.0.0.1, extract the path and resolve it
  const localhostMatch = url.match(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(.*)$/);
  if (localhostMatch) {
    const path = localhostMatch[3]; // Extract path part
    const host = window.location.hostname;
    const protocol = window.location.protocol;
    const apiPort = '4000';
    return `${protocol}//${host}:${apiPort}${path}`;
  }
  
  // If it's already an absolute URL (http/https) that's not localhost, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // For relative paths, resolve against the API server
  // Use port 4000 on same host as the current page
  const host = window.location.hostname;
  const protocol = window.location.protocol;
  const apiPort = '4000';
  
  // Ensure path starts with /
  const path = url.startsWith('/') ? url : `/${url}`;
  
  return `${protocol}//${host}:${apiPort}${path}`;
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
];
