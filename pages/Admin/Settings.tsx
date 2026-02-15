import React, { useState, useEffect } from 'react';
import { Save, Upload, Loader } from 'lucide-react';
import { StoreSettings } from '../../types';
import { APP_NAME } from '../../constants';
import { resolveAssetUrl, getApiBaseUrl } from '../../constants';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<StoreSettings>({
    type: 'general',
    storeName: APP_NAME,
    logoUrl: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/settings`);
      if (response.ok) {
        const data = await response.json();
        setSettings({
          ...data,
          storeName: data.storeName || APP_NAME
        });
        if (data.logoUrl) {
          setPreviewUrl(resolveAssetUrl(data.logoUrl));
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      let logoUrl = settings.logoUrl;

      // Upload logo if changed
      if (logoFile) {
        const formData = new FormData();
        formData.append('file', logoFile);

        const uploadRes = await fetch(`${getApiBaseUrl()}/api/upload/logo`, {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) throw new Error('Failed to upload logo');
        
        const uploadData = await uploadRes.json();
        logoUrl = uploadData.url;
      }

      // Update settings
      const res = await fetch(`${getApiBaseUrl()}/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storeName: settings.storeName,
          logoUrl,
        }),
      });

      if (!res.ok) throw new Error('Failed to save settings');

      const updatedSettings = await res.json();
      setSettings(updatedSettings.value || updatedSettings);
      setMessage({ type: 'success', text: 'Settings saved successfully' });
      
      // Update local preview if needed (already updated by file selection, but sync with server resp)
      if (updatedSettings.logoUrl || (updatedSettings.value && updatedSettings.value.logoUrl)) {
         const newUrl = updatedSettings.logoUrl || updatedSettings.value.logoUrl;
         setSettings(prev => ({ ...prev, logoUrl: newUrl }));
      }

    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Store Settings</h1>
        <p className="text-slate-500 mt-1">Manage your store's general information and branding.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-8">
          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
              message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <Save className="w-5 h-5" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center font-bold">!</div>
              )}
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Store Name */}
            <div>
              <label htmlFor="storeName" className="block text-sm font-medium text-slate-700 mb-2">
                Store Name
              </label>
              <input
                type="text"
                id="storeName"
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                className="w-full max-w-md px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-colors"
                placeholder="Enter store name"
                required
              />
              <p className="mt-2 text-sm text-slate-500">
                This name will appear in the header and footer of your store.
              </p>
            </div>

            <hr className="border-slate-100" />

            {/* Store Logo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-4">
                Store Logo
              </label>
              
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="w-32 h-32 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative group">
                  {previewUrl ? (
                    <img 
                      src={previewUrl} 
                      alt="Store Logo" 
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <span className="text-slate-400 text-xs text-center px-2">No logo</span>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <label 
                      htmlFor="logo-upload" 
                      className="cursor-pointer px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Upload New Logo
                    </label>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                    {logoFile && (
                      <span className="text-sm text-slate-500">
                        {logoFile.name}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">
                    Recommended size: 200x200px. Supported formats: PNG, JPG, WEBP.
                  </p>
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
