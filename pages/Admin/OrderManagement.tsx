
import React, { useEffect, useState } from 'react';
import { Clock, Package, CheckCircle, XCircle, Search, MapPin, Phone } from 'lucide-react';
import { Order } from '../../types';
import { db } from '../../services/db';
import { CURRENCY } from '../../constants';

export const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
      const data = await db.getOrders();
      setOrders(data);
      setLoading(false);
  };

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
      await db.updateOrderStatus(orderId, newStatus);
      // Optimistic update
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
        order._id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.recipientName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sort by date (newest first)
  const sortedOrders = [...filteredOrders].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
      case 'shipped': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Order Management</h1>
          <p className="text-slate-500 text-sm">View and track customer orders</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input 
                type="text" 
                placeholder="Search orders, names..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
             />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="All">All Status</option>
            <option value="pending">Pending</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Info</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                 <tr><td colSpan={6} className="p-8 text-center text-slate-500">Loading orders...</td></tr>
              ) : sortedOrders.length === 0 ? (
                 <tr><td colSpan={6} className="p-8 text-center text-slate-500">No orders found.</td></tr>
              ) : (
                sortedOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                        <div className="text-sm font-mono text-indigo-600 font-medium">#{order._id.toUpperCase()}</div>
                        <div className="text-xs text-slate-500 mt-1">{new Date(order.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900">{order.recipientName || order.customerName}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" /> {order.contactNumber || 'N/A'}
                        </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                        {order.items.reduce((acc, item) => acc + item.quantity, 0)} items
                        <div className="text-xs text-slate-400 truncate max-w-[150px] mt-1">
                            {order.items.map(i => i.name).join(', ')}
                        </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{CURRENCY}{order.totalAmount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                        <select 
                            value={order.status}
                            onChange={(e) => handleStatusChange(order._id, e.target.value as Order['status'])}
                            className={`text-xs font-medium px-2 py-1 rounded-full border outline-none cursor-pointer ${getStatusColor(order.status)}`}
                        >
                            <option value="pending">Pending</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 max-w-xs">
                       <div className="font-medium truncate">{order.shippingAddress?.street}</div>
                       <div className="text-slate-500 truncate">{order.shippingAddress?.city}</div>
                       {order.shippingAddress?.landmark && (
                           <div className="flex items-center gap-1 mt-1 text-indigo-600 font-medium">
                               <MapPin className="w-3 h-3" /> {order.shippingAddress.landmark}
                           </div>
                       )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Placeholder */}
        {!loading && sortedOrders.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-sm text-slate-500">
                <span>Showing {sortedOrders.length} orders</span>
                <div className="flex gap-2">
                    <button className="px-3 py-1 border border-slate-300 rounded hover:bg-white disabled:opacity-50" disabled>Previous</button>
                    <button className="px-3 py-1 border border-slate-300 rounded hover:bg-white disabled:opacity-50" disabled>Next</button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
