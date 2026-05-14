import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { uploadToCloudinary } from '../utils/cloudinary';

export default function CreateProductPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({ title: '', description: '', price: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleFileChange = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10 MB.');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFileChange(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!imageFile) {
      setError('Please select a product image.');
      return;
    }

    try {
      // Step 1: Upload image to Cloudinary directly from the browser
      setUploading(true);
      const imageUrl = await uploadToCloudinary(imageFile);
      setUploading(false);

      // Step 2: Send JSON payload (with Cloudinary URL) to backend
      setSaving(true);
      await api.post('/api/products', {
        title: form.title,
        description: form.description,
        price: parseFloat(form.price),
        imageUrl,
      });

      setSuccess(true);
      setTimeout(() => navigate('/products'), 1500);
    } catch (err) {
      setUploading(false);
      setSaving(false);
      setError(err.message || 'Failed to create product. Please try again.');
    }
  };

  const isLoading = uploading || saving;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/products')}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Catalog
        </button>
        <h1 className="text-3xl font-extrabold text-white">Add New Product</h1>
        <p className="text-slate-400 text-sm mt-1">Fill in the details and upload a photo</p>
      </div>

      <div className="glass-card p-8">
        {success && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 mb-6">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Product created! Redirecting…
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6" role="alert">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} id="create-product-form" className="space-y-6">
          {/* Image Upload */}
          <div>
            <label className="form-label">Product Image</label>
            <div
              onClick={() => !isLoading && fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className={`relative border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-all duration-200
                ${imagePreview ? 'border-brand-500/50' : 'border-white/10 hover:border-brand-500/40 hover:bg-white/5'}`}
            >
              {imagePreview ? (
                <div className="relative aspect-[16/9]">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm font-medium">Click to change</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-slate-400 text-sm font-medium">Click or drag &amp; drop</p>
                  <p className="text-slate-600 text-xs mt-1">PNG, JPG, WEBP up to 10MB</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              id="product-image-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files[0])}
            />
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="form-label">Product Title</label>
            <input
              id="title"
              name="title"
              type="text"
              required
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Vintage Leather Bag"
              className="input-field"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="form-label">Description</label>
            <textarea
              id="description"
              name="description"
              required
              rows={4}
              value={form.description}
              onChange={handleChange}
              placeholder="Describe your product in detail…"
              className="input-field resize-none"
            />
          </div>

          {/* Price */}
          <div>
            <label htmlFor="price" className="form-label">Price (USD)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">$</span>
              <input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                required
                value={form.price}
                onChange={handleChange}
                placeholder="0.00"
                className="input-field pl-8"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            id="btn-create-product"
            type="submit"
            disabled={isLoading || success}
            className="btn-primary w-full py-3.5 text-base"
          >
            {uploading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Uploading image…
              </>
            ) : saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving product…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Product
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
