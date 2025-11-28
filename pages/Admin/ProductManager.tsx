
import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Save, Upload, Box, AlertCircle } from 'lucide-react';
import { Product } from '../../types';
import { db } from '../../services/db';
import { CURRENCY } from '../../constants';

export const ProductManager: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: 'Chairs',
    imageUrl: '',
    arModelUrl: '',
    width: '',
    height: '',
    depth: '',
    unit: 'cm' as 'cm' | 'in',
    isFeatured: false,
    isNewArrival: false
  });

  useEffect(() => {
    const loadData = async () => {
      const data = await db.getProducts();
      setProducts(data);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      await db.deleteProduct(id);
      setProducts(products.filter(p => p._id !== id));
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product._id);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category,
      imageUrl: product.imageUrl,
      arModelUrl: product.arModelUrl,
      width: product.dimensions.width.toString(),
      height: product.dimensions.height.toString(),
      depth: product.dimensions.depth.toString(),
      unit: product.dimensions.unit,
      isFeatured: product.isFeatured || false,
      isNewArrival: product.isNewArrival || false
    });
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingId(null);
    setFormData({
        name: '',
        description: '',
        price: '',
        stock: '',
        category: 'Chairs',
        imageUrl: '',
        arModelUrl: '',
        width: '',
        height: '',
        depth: '',
        unit: 'cm',
        isFeatured: false,
        isNewArrival: false
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? checked : value 
    }));
    if (formError) setFormError(''); 
  };

  const validateForm = () => {
    if (!formData.name.trim()) return "Product name is required";
    if (parseFloat(formData.price) < 0) return "Price cannot be negative";
    if (parseInt(formData.stock) < 0) return "Stock cannot be negative";
    if (!formData.imageUrl.trim()) return "Image URL is required";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const error = validateForm();
    if (error) {
        setFormError(error);
        return;
    }

    setIsSubmitting(true);
    
    try {
        const productData = {
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price) || 0,
            stock: parseInt(formData.stock) || 0,
            category: formData.category,
            imageUrl: formData.imageUrl,
            arModelUrl: formData.arModelUrl,
            dimensions: {
                width: parseFloat(formData.width) || 0,
                height: parseFloat(formData.height) || 0,
                depth: parseFloat(formData.depth) || 0,
                unit: formData.unit
            },
            isFeatured: formData.isFeatured,
            isNewArrival: formData.isNewArrival
        };
        
        if (editingId) {
            // Update
            const updated = await db.updateProduct(editingId, productData);
            setProducts(prev => prev.map(p => p._id === editingId ? updated : p));
        } else {
            // Create
            const created = await db.createProduct(productData);
            setProducts(prev => [...prev, created]);
        }
        
        setIsModalOpen(false);
        setEditingId(null);
        
        // Reset form
        setFormData({
          name: '',
          description: '',
          price: '',
          stock: '',
          category: 'Chairs',
          imageUrl: '',
          arModelUrl: '',
          width: '',
          height: '',
          depth: '',
          unit: 'cm',
          isFeatured: false,
          isNewArrival: false
        });
    } catch (err) {
        setFormError("Failed to save product. Please try again.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">Product Management</h1>
            <p className="text-slate-500 text-sm">Manage inventory and AR assets</p>
        </div>
        <button 
          onClick={handleCreate}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tags</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Loading...</td></tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-slate-100 overflow-hidden border border-slate-200">
                           <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                           <div className="font-medium text-slate-900">{product.name}</div>
                           <div className="text-xs text-slate-500 truncate max-w-[200px]">{product.description.substring(0, 40)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm">{product.category}</td>
                    <td className="px-6 py-4 text-slate-900 font-medium text-sm">{CURRENCY}{product.price.toLocaleString()}</td>
                    <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.stock > 10 ? 'bg-green-100 text-green-700' : product.stock > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                            {product.stock} units
                        </span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col gap-1">
                          {product.isFeatured && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded w-fit">Featured</span>}
                          {product.isNewArrival && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded w-fit">New</span>}
                          {product.arModelUrl && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded w-fit">AR Ready</span>}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                            onClick={() => handleEdit(product)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handleDelete(product._id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
              {!loading && products.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">No products found. Add your first one!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-900">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                {/* Modal Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    
                    {formError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {formError}
                        </div>
                    )}

                    <form id="addProductForm" onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Product Name *</label>
                                    <input name="name" required value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" placeholder="e.g. Modern Sofa" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
                                    <select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                                        <option value="Chairs">Chairs</option>
                                        <option value="Sofas">Sofas</option>
                                        <option value="Tables">Tables</option>
                                        <option value="Decor">Decor</option>
                                        <option value="Storage">Storage</option>
                                        <option value="Beds">Beds</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Price ({CURRENCY}) *</label>
                                        <input type="number" step="0.01" min="0" name="price" required value={formData.price} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="0.00" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Stock *</label>
                                        <input type="number" min="0" name="stock" required value={formData.stock} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="0" />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Image URL *</label>
                                    <div className="flex gap-2">
                                        <input name="imageUrl" required value={formData.imageUrl} onChange={handleInputChange} className="flex-1 px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="https://..." />
                                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 border border-slate-200 overflow-hidden">
                                            {formData.imageUrl ? <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Preview" /> : <Upload className="w-4 h-4 text-slate-400" />}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">AR Model URL (.glb)</label>
                                    <input name="arModelUrl" value={formData.arModelUrl} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="https://.../model.glb" />
                                </div>

                                {/* Tags Section */}
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <label className="block text-sm font-semibold text-slate-900 mb-2">Tags & Collections</label>
                                    <div className="flex flex-col gap-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" name="isFeatured" checked={formData.isFeatured} onChange={handleInputChange} className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
                                            <span className="text-sm text-slate-700">Featured Collection</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" name="isNewArrival" checked={formData.isNewArrival} onChange={handleInputChange} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" />
                                            <span className="text-sm text-slate-700">New Arrival</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                            <textarea name="description" rows={3} value={formData.description} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" placeholder="Product details..." />
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <label className="block text-sm font-semibold text-slate-900 mb-3">Dimensions</label>
                            <div className="grid grid-cols-4 gap-3">
                                <div>
                                    <span className="text-xs text-slate-500 mb-1 block">Width</span>
                                    <input type="number" name="width" value={formData.width} onChange={handleInputChange} className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm outline-none focus:border-indigo-500" placeholder="W" />
                                </div>
                                <div>
                                    <span className="text-xs text-slate-500 mb-1 block">Height</span>
                                    <input type="number" name="height" value={formData.height} onChange={handleInputChange} className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm outline-none focus:border-indigo-500" placeholder="H" />
                                </div>
                                <div>
                                    <span className="text-xs text-slate-500 mb-1 block">Depth</span>
                                    <input type="number" name="depth" value={formData.depth} onChange={handleInputChange} className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm outline-none focus:border-indigo-500" placeholder="D" />
                                </div>
                                <div>
                                    <span className="text-xs text-slate-500 mb-1 block">Unit</span>
                                    <select name="unit" value={formData.unit} onChange={handleInputChange} className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm outline-none focus:border-indigo-500 bg-white">
                                        <option value="cm">cm</option>
                                        <option value="in">in</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                    <button 
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit"
                        form="addProductForm"
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm shadow-indigo-600/20 disabled:opacity-70"
                    >
                        {isSubmitting ? (
                            <>Saving...</>
                        ) : (
                            <>
                                <Save className="w-4 h-4" /> {editingId ? 'Update Product' : 'Save Product'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
