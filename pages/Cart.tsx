
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ArrowRight, CreditCard, MapPin, Plus, Check, X } from 'lucide-react';
import { useCart, useAuth } from '../App';
import { Address } from '../types';
import { CURRENCY } from '../constants';

export const Cart: React.FC = () => {
  const { cart, removeFromCart, clearCart } = useCart();
  const { user, updateAddress, setAuthModalOpen } = useAuth();
  
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressForm, setAddressForm] = useState<Address>({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });

  // Automatically select all items when cart changes (optional UX)
  // or keep selection empty. Let's default to selecting all for better UX
  useEffect(() => {
    const allIds = new Set(cart.map(item => item._id));
    // Only if we haven't manually deselected everything (simple logic: if new items added, maybe select them?)
    // For simplicity, let's just initialize all selected if the set is empty and cart has items initially
    if (selectedItems.size === 0 && cart.length > 0) {
        setSelectedItems(allIds);
    }
  }, [cart.length]);

  const toggleItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
        newSelected.delete(id);
    } else {
        newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === cart.length) {
        setSelectedItems(new Set());
    } else {
        setSelectedItems(new Set(cart.map(item => item._id)));
    }
  };

  const cartItemsToCheckout = cart.filter(item => selectedItems.has(item._id));
  const subtotal = cartItemsToCheckout.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = subtotal * 0.12; // VAT 12% in PH
  const total = subtotal + tax;

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateAddress(addressForm);
    setIsAddressModalOpen(false);
  };

  const handleCheckout = () => {
    if (!user) {
        setAuthModalOpen(true);
        return;
    }

    if (cartItemsToCheckout.length === 0) {
        alert("Please select at least one item to checkout.");
        return;
    }

    if (!user.address) {
        setIsAddressModalOpen(true);
        return;
    }

    alert(`Checkout successful for ${cartItemsToCheckout.length} items! Total: ${CURRENCY}${total.toLocaleString()}`);
    // Remove checked items
    cartItemsToCheckout.forEach(item => removeFromCart(item._id));
    setSelectedItems(new Set());
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-slate-50 rounded-2xl p-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Your cart is empty</h2>
          <p className="text-slate-500 mb-8">Looks like you haven't added any furniture yet.</p>
          <Link 
            to="/"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Continue Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Cart Items */}
        <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200">
                <input 
                    type="checkbox" 
                    checked={cart.length > 0 && selectedItems.size === cart.length}
                    onChange={toggleSelectAll}
                    className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-sm font-semibold text-slate-700">Select All ({cart.length} items)</span>
            </div>

            <div className="space-y-6">
            {cart.map((item) => (
                <div key={item._id} className={`flex gap-4 p-4 border rounded-xl shadow-sm transition-colors ${selectedItems.has(item._id) ? 'bg-white border-indigo-100 ring-1 ring-indigo-500/20' : 'bg-slate-50 border-slate-100 opacity-70'}`}>
                <div className="flex items-center">
                    <input 
                        type="checkbox" 
                        checked={selectedItems.has(item._id)}
                        onChange={() => toggleItem(item._id)}
                        className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                </div>
                <div className="w-24 h-24 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-grow flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-slate-900">{item.name}</h3>
                        <p className="text-sm text-slate-500">{item.category}</p>
                    </div>
                    <button 
                        onClick={() => removeFromCart(item._id)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-600">Qty: {item.quantity}</span>
                    </div>
                    <div className="font-bold text-slate-900">{CURRENCY}{(item.price * item.quantity).toLocaleString()}</div>
                    </div>
                </div>
                </div>
            ))}
            </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-slate-50 p-6 rounded-2xl sticky top-24 border border-slate-200">
            
            {/* Shipping Info Block */}
            <div className="mb-6 p-4 bg-white rounded-xl border border-slate-200">
                <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-indigo-600" /> Shipping Address
                    </h4>
                    {user && user.address && (
                        <button 
                            onClick={() => {
                                setAddressForm(user.address!);
                                setIsAddressModalOpen(true);
                            }} 
                            className="text-xs text-indigo-600 font-medium hover:underline"
                        >
                            Edit
                        </button>
                    )}
                </div>
                
                {!user ? (
                    <p className="text-sm text-slate-500">Log in to manage shipping addresses.</p>
                ) : user.address ? (
                    <div className="text-sm text-slate-600 leading-snug">
                        <p>{user.address.street}</p>
                        <p>{user.address.city}, {user.address.state} {user.address.zipCode}</p>
                        <p>{user.address.country}</p>
                    </div>
                ) : (
                    <button 
                        onClick={() => setIsAddressModalOpen(true)}
                        className="w-full mt-2 py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 text-sm font-medium hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Add Address
                    </button>
                )}
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-6">Order Summary</h3>
            <p className="text-xs text-slate-500 mb-4">Summary for {cartItemsToCheckout.length} selected items</p>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{CURRENCY}{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>VAT (12%)</span>
                <span>{CURRENCY}{tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between text-lg font-bold text-slate-900">
                <span>Total</span>
                <span>{CURRENCY}{total.toLocaleString()}</span>
              </div>
            </div>

            <button 
              onClick={handleCheckout}
              disabled={cartItemsToCheckout.length === 0}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Checkout Selected <CreditCard className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Address Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-900">Shipping Address</h2>
                    <button onClick={() => setIsAddressModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6">
                    <form id="addressForm" onSubmit={handleAddressSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Street Address</label>
                            <input 
                                required
                                value={addressForm.street}
                                onChange={e => setAddressForm({...addressForm, street: e.target.value})}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" 
                                placeholder="123 Main St" 
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">City</label>
                                <input 
                                    required
                                    value={addressForm.city}
                                    onChange={e => setAddressForm({...addressForm, city: e.target.value})}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" 
                                    placeholder="Valenzuela" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Province/Region</label>
                                <input 
                                    required
                                    value={addressForm.state}
                                    onChange={e => setAddressForm({...addressForm, state: e.target.value})}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" 
                                    placeholder="Metro Manila" 
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Zip Code</label>
                                <input 
                                    required
                                    value={addressForm.zipCode}
                                    onChange={e => setAddressForm({...addressForm, zipCode: e.target.value})}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" 
                                    placeholder="1440" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Country</label>
                                <input 
                                    required
                                    value={addressForm.country}
                                    onChange={e => setAddressForm({...addressForm, country: e.target.value})}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" 
                                    placeholder="Philippines" 
                                />
                            </div>
                        </div>
                    </form>
                </div>
                
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                    <button 
                        onClick={() => setIsAddressModalOpen(false)}
                        className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
                        type="button"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit"
                        form="addressForm"
                        className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                        Save Address
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
