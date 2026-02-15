import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Check, X, Edit2 } from 'lucide-react';
import { Address } from '../types';
import { getAddresses, addAddress, deleteAddress, updateAddress } from '../services/address';

interface AddressManagerProps {
  userId: string;
  selectedAddressId?: string;
  onSelectAddress: (address: Address) => void;
}

export const AddressManager: React.FC<AddressManagerProps> = ({ userId, selectedAddressId, onSelectAddress }) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null); // Track editing state
  const [error, setError] = useState<string | null>(null);

  const [addressForm, setAddressForm] = useState<Omit<Address, 'id'>>({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Philippines',
    landmark: ''
  });

  useEffect(() => {
    loadAddresses();
  }, [userId]);

  const loadAddresses = async () => {
    setIsLoading(true);
    try {
      const data = await getAddresses(userId);
      setAddresses(data);
      if (data.length > 0 && !selectedAddressId) {
        onSelectAddress(data[0]);
      }
    } catch (err) {
      console.error('Failed to load addresses', err);
      setError('Failed to load addresses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent | React.KeyboardEvent | React.MouseEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        const updated = await updateAddress(userId, isEditing, addressForm);
        setAddresses(addresses.map(a => a.id === isEditing ? updated : a));
        setIsEditing(null);
      } else {
        const added = await addAddress(userId, addressForm);
        setAddresses([...addresses, added]);
        setIsAdding(false);
        // Optionally auto-select the new address
        onSelectAddress(added);
      }
      
      setAddressForm({
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Philippines',
        landmark: ''
      });
    } catch (err) {
      console.error('Failed to save address', err);
      setError('Failed to save address');
    }
  };

  const startEditing = (addr: Address) => {
      setAddressForm({
          street: addr.street,
          city: addr.city,
          state: addr.state,
          zipCode: addr.zipCode,
          country: addr.country,
          landmark: addr.landmark || ''
      });
      setIsEditing(addr.id || '');
      setIsAdding(false);
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      await deleteAddress(userId, addressId);
      setAddresses(addresses.filter(a => a.id !== addressId));
      if (selectedAddressId === addressId) {
        // Handle deselection if needed, though parent controls selection
      }
    } catch (err) {
      console.error('Failed to delete address', err);
      setError('Failed to delete address');
    }
  };

  const cancelForm = () => {
      setIsAdding(false);
      setIsEditing(null);
      setAddressForm({
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Philippines',
        landmark: ''
      });
  };

  if (isLoading) return <div className="p-4 text-center text-slate-500">Loading addresses...</div>;

  return (
    <div className="space-y-4">
      {error && <div className="text-red-500 text-sm p-2 bg-red-50 rounded">{error}</div>}
      
      <div className="grid grid-cols-1 gap-3">
        {addresses.map(addr => (
          <div 
            key={addr.id} 
            className={`
              relative p-4 rounded-xl border-2 cursor-pointer transition-all group
              ${selectedAddressId === addr.id 
                ? 'border-indigo-600 bg-indigo-50' 
                : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}
            `}
            onClick={() => onSelectAddress(addr)}
          >
            <div className="flex items-start gap-3">
              <div className={`
                mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                ${selectedAddressId === addr.id ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}
              `}>
                {selectedAddressId === addr.id && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="flex-grow">
                <p className="text-sm font-bold text-slate-900">{addr.street}</p>
                <p className="text-sm text-slate-600">{addr.city}, {addr.state} {addr.zipCode}</p>
                <p className="text-xs text-slate-500 uppercase mt-1">{addr.country}</p>
                {addr.landmark && (
                  <p className="text-xs text-indigo-600 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {addr.landmark}
                  </p>
                )}
              </div>
              
              <div className="flex gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); startEditing(addr); }}
                    className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Edit Address"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addr.id!); }}
                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Address"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
              </div>
            </div>
          </div>
        ))}

        {addresses.length === 0 && !isAdding && !isEditing && (
          <div className="text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-500 text-sm mb-3">No saved addresses found.</p>
          </div>
        )}

        {!isAdding && !isEditing ? (
          <button 
            onClick={() => setIsAdding(true)}
            className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-indigo-500 hover:text-indigo-600 font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add New Address
          </button>
        ) : (
          <div onKeyDown={(e) => e.key === 'Enter' && handleSaveAddress(e)} className="bg-slate-50 p-4 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-2">
            <h4 className="font-bold text-slate-900 mb-4 flex items-center justify-between">
              {isEditing ? 'Edit Address' : 'New Address'}
              <button type="button" onClick={cancelForm} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </h4>
            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  required
                  placeholder="Street Address"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm"
                  value={addressForm.street}
                  onChange={e => setAddressForm({...addressForm, street: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="City"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm"
                  value={addressForm.city}
                  onChange={e => setAddressForm({...addressForm, city: e.target.value})}
                />
                <input
                  type="text"
                  required
                  placeholder="State/Province"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm"
                  value={addressForm.state}
                  onChange={e => setAddressForm({...addressForm, state: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="ZIP Code"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm"
                  value={addressForm.zipCode}
                  onChange={e => setAddressForm({...addressForm, zipCode: e.target.value})}
                />
                <input
                  type="text"
                  required
                  placeholder="Country"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm"
                  value={addressForm.country}
                  onChange={e => setAddressForm({...addressForm, country: e.target.value})}
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Landmark (Optional)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm"
                  value={addressForm.landmark}
                  onChange={e => setAddressForm({...addressForm, landmark: e.target.value})}
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={cancelForm}
                  className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={(e) => handleSaveAddress(e)}
                  className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  {isEditing ? 'Update Address' : 'Save Address'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
