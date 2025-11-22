
import React, { useEffect, useState } from 'react';
import { Plus, Trash2, X, Save, Upload, Megaphone, AlertCircle } from 'lucide-react';
import { MarketingBanner } from '../../types';
import { db } from '../../services/db';

export const MarketingManager: React.FC = () => {
  const [banners, setBanners] = useState<MarketingBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    imageUrl: '',
    badgeText: '',
    buttonText: 'SHOP NOW',
    link: '/',
    isActive: true
  });

  useEffect(() => {
    const loadData = async () => {
      const data = await db.getBanners();
      setBanners(data);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this banner?')) {
      await db.deleteBanner(id);
      setBanners(banners.filter(b => b._id !== id));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.imageUrl) {
        setFormError("Title and Image URL are required");
        return;
    }

    setIsSubmitting(true);
    try {
        const newBanner = await db.createBanner(formData);
        setBanners(prev => [...prev, newBanner]);
        setIsModalOpen(false);
        setFormData({
            title: '',
            subtitle: '',
            description: '',
            imageUrl: '',
            badgeText: '',
            buttonText: 'SHOP NOW',
            link: '/',
            isActive: true
        });
    } catch (e) {
        setFormError("Failed to save banner");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">Marketing Banners</h1>
            <p className="text-slate-500 text-sm">Manage homepage promotional sections</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" /> Create Banner
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
            <div className="col-span-2 text-center py-8 text-slate-500">Loading banners...</div>
        ) : banners.map(banner => (
            <div key={banner._id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group relative">
                <div className="h-48 overflow-hidden relative">
                    <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                    {banner.badgeText && (
                         <div className="absolute top-4 left-0 bg-[#CD3C32] text-white text-xs font-bold px-3 py-1 shadow-md transform -rotate-45 -translate-x-2 translate-y-2 w-24 text-center">
                             {banner.badgeText}
                         </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    <button 
                        onClick={() => handleDelete(banner._id)}
                        className="absolute top-2 right-2 bg-white/90 p-2 rounded-lg text-red-600 opacity-0 group-hover:opacity-100 transition-all hover:bg-white"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
                <div className="p-6">
                    {banner.subtitle && <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">{banner.subtitle}</div>}
                    <h3 className="text-xl font-serif font-bold text-slate-900 mb-2">{banner.title}</h3>
                    <p className="text-slate-600 text-sm mb-4">{banner.description}</p>
                    <span className="inline-block bg-black text-white text-xs font-bold px-4 py-2 uppercase tracking-wider">
                        {banner.buttonText}
                    </span>
                </div>
            </div>
        ))}
      </div>
      
      {/* Create Banner Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
                 <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-900">Create Marketing Banner</h2>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    {formError && <div className="text-red-600 text-sm mb-4">{formError}</div>}
                    <form id="bannerForm" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Banner Title *</label>
                            <input name="title" value={formData.title} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-slate-200" placeholder="e.g. The Classic Living Room" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Subtitle</label>
                                <input name="subtitle" value={formData.subtitle} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-slate-200" placeholder="e.g. Get The Look" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Badge Text</label>
                                <input name="badgeText" value={formData.badgeText} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-slate-200" placeholder="e.g. SALE" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Image URL *</label>
                            <input name="imageUrl" value={formData.imageUrl} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-slate-200" placeholder="https://..." required />
                        </div>
                         <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                            <textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} className="w-full px-4 py-2 rounded-lg border border-slate-200 resize-none" placeholder="Short engaging text..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Button Text</label>
                                <input name="buttonText" value={formData.buttonText} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-slate-200" />
                            </div>
                             <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Link Path</label>
                                <input name="link" value={formData.link} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-slate-200" />
                            </div>
                        </div>
                    </form>
                </div>
                
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                     <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg">Cancel</button>
                     <button type="submit" form="bannerForm" disabled={isSubmitting} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                         {isSubmitting ? 'Saving...' : 'Create Banner'}
                     </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
