import React, { useRef, useState } from 'react';
import { useFarmProject } from '../../context/FarmProjectContext';
import { User, Mail, Phone, MapPin, Check, Camera, Trash2 } from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { userProfile, updateUserProfile } = useFarmProject();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(userProfile);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPhotoError('Choose an image file to upload.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setPhotoError('Choose an image smaller than 8 MB.');
      return;
    }

    try {
      const imageUrl = await resizeProfileImage(file);
      updateUserProfile({ avatarUrl: imageUrl });
      setForm(current => ({ ...current, avatarUrl: imageUrl }));
      setPhotoError('');
      setSavedSuccess(true);
      window.setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      setPhotoError('This image could not be processed. Try another image.');
    }
  };

  const handleRemovePhoto = () => {
    updateUserProfile({ avatarUrl: '' });
    setForm(current => ({ ...current, avatarUrl: '' }));
    setPhotoError('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(form);
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
          User Profile
        </h2>
        <p className="text-sm text-neutral-500 mt-0.5">
          Manage your personal details and farm investor profile.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs">
          <Check className="w-4 h-4" />
          <span>Profile details successfully updated!</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-neutral-100">
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div aria-label={userProfile.avatarUrl ? `${userProfile.fullName}'s profile photo` : 'Profile initials'} className="w-24 h-24 overflow-hidden rounded-full bg-emerald-50 border-2 border-emerald-200 text-emerald-800 shadow-md grid place-items-center text-2xl font-bold">
              {userProfile.avatarUrl ? <img src={userProfile.avatarUrl} alt={`${userProfile.fullName}'s profile`} className="w-full h-full object-cover" /> : userProfile.fullName.trim().split(/\s+/).filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'FR'}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="sr-only" aria-label="Upload profile picture" />
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-[11px] font-semibold text-neutral-700 hover:bg-neutral-50">
                <Camera className="h-3.5 w-3.5" /> {userProfile.avatarUrl ? 'Change photo' : 'Upload photo'}
              </button>
              {userProfile.avatarUrl && <button type="button" onClick={handleRemovePhoto} aria-label="Remove profile photo" className="rounded-lg p-1.5 text-neutral-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>}
            </div>
            {photoError && <p role="alert" className="max-w-40 text-center text-[11px] text-red-600">{photoError}</p>}
          </div>

          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-xl font-bold text-neutral-900">{userProfile.fullName}</h3>
            <p className="text-xs text-neutral-500">{userProfile.organization}</p>
            <span className="inline-block text-[11px] font-semibold text-neutral-600 bg-neutral-100 px-2.5 py-0.5 rounded-full mt-1">Project workspace profile</span>
          </div>
        </div>

        {!isEditing ? (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-neutral-50 rounded-xl space-y-1">
                <span className="text-neutral-500 flex items-center gap-1.5 font-medium">
                  <User className="w-3.5 h-3.5 text-neutral-400" /> Full Name
                </span>
                <p className="font-semibold text-neutral-900 text-sm">{userProfile.fullName}</p>
              </div>

              <div className="p-3.5 bg-neutral-50 rounded-xl space-y-1">
                <span className="text-neutral-500 flex items-center gap-1.5 font-medium">
                  <Mail className="w-3.5 h-3.5 text-neutral-400" /> Email Address
                </span>
                <p className="font-semibold text-neutral-900 text-sm">{userProfile.email}</p>
              </div>

              <div className="p-3.5 bg-neutral-50 rounded-xl space-y-1">
                <span className="text-neutral-500 flex items-center gap-1.5 font-medium">
                  <Phone className="w-3.5 h-3.5 text-neutral-400" /> Phone Number
                </span>
                <p className="font-semibold text-neutral-900 text-sm">{userProfile.phone}</p>
              </div>

              <div className="p-3.5 bg-neutral-50 rounded-xl space-y-1">
                <span className="text-neutral-500 flex items-center gap-1.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400" /> Primary Location
                </span>
                <p className="font-semibold text-neutral-900 text-sm">{userProfile.location}</p>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setIsEditing(true)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
              >
                Edit Profile
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Location (City, State)</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

function resizeProfileImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      const scale = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Canvas is unavailable'));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Image could not be loaded'));
    };
    image.src = objectUrl;
  });
}
