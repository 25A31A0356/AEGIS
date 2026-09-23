import React, { useState, useRef } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { useAuth } from '../../context/AuthContext';
import { useTranslation, LANGUAGES } from '../../i18n/useTranslation';

interface UserDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuthModal?: () => void;
}

const BLOOD_GROUPS = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'];

export const UserDrawer: React.FC<UserDrawerProps> = ({ isOpen, onClose, onOpenAuthModal }) => {
  const {
    profile,
    updateProfile,
    colorScheme,
    setColorScheme,
    notificationsEnabled,
    setNotificationsEnabled,
    liveLocationEnabled,
    setLiveLocationEnabled,
  } = useProfile();

  const { language, setLanguage, dict, t } = useTranslation();
  const { logout, isAuthenticated } = useAuth();

  const [isNearbyResponder, setIsNearbyResponder] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeSectionModal, setActiveSectionModal] = useState<string | null>(null);

  // Edit form state
  const [editName, setEditName] = useState(profile.fullName || 'Aarav Sharma');
  const [editPhone, setEditPhone] = useState(profile.phoneNumber || '+91 98765 43210');
  const [editBlood, setEditBlood] = useState(profile.bloodGroup || 'O+');
  const [editMedical, setEditMedical] = useState(profile.medicalNotes || 'No known allergies. Asthmatic inhaler carrier.');
  const [editPeople, setEditPeople] = useState(profile.peopleCount || 2);
  const [editAvatar, setEditAvatar] = useState(profile.avatarUrl || '');
  const [saveToast, setSaveToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image file size should be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setEditAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  const handleOpenEdit = () => {
    setEditName(profile.fullName || 'Aarav Sharma');
    setEditPhone(profile.phoneNumber || '+91 98765 43210');
    setEditBlood(profile.bloodGroup || 'O+');
    setEditMedical(profile.medicalNotes || '');
    setEditPeople(profile.peopleCount || 2);
    setEditAvatar(profile.avatarUrl || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      fullName: editName.trim() || 'Aarav Sharma',
      phoneNumber: editPhone.trim(),
      bloodGroup: editBlood,
      medicalNotes: editMedical.trim(),
      peopleCount: Number(editPeople) || 1,
      avatarUrl: editAvatar,
    });
    setSaveToast(true);
    setTimeout(() => {
      setSaveToast(false);
      setIsEditModalOpen(false);
    }, 800);
  };

  const isDarkMode = colorScheme === 'dark';

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md h-full bg-white dark:bg-[#0d0d0f] shadow-2xl border-l border-slate-200 dark:border-[#27272a] flex flex-col font-sans animate-drawer-right overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#27272a] flex items-center justify-between bg-white dark:bg-[#0d0d0f]">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              {dict.settings || 'Settings'} &amp; {dict.yourProfile || 'Profile'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#18181b] transition-colors cursor-pointer"
            title={dict.close || 'Close'}
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
          {saveToast && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
              {dict.details || 'Profile updated successfully!'}
            </div>
          )}

          {/* 1. YOUR PROFILE SECTION */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#a1a1aa]">
                {dict.yourProfile || 'YOUR PROFILE'}
              </span>
              <button
                onClick={handleOpenEdit}
                className="flex items-center gap-1 text-xs font-bold text-[#0d5c75] dark:text-teal-400 hover:underline cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                <span>{dict.details || 'Edit Profile'}</span>
              </button>
            </div>

            {/* Profile Card */}
            <div
              onClick={handleOpenEdit}
              className="p-4 rounded-2xl border border-slate-200 dark:border-[#27272a] bg-white dark:bg-[#111111] flex items-center justify-between gap-3 shadow-xs hover:border-[#0d5c75]/50 dark:hover:border-teal-500/50 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-full bg-[#0d5c75] dark:bg-teal-600 text-white flex items-center justify-center font-black text-xl shadow-xs shrink-0 overflow-hidden">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    profile.fullName?.trim() ? profile.fullName.trim()[0].toUpperCase() : 'A'
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-slate-500 dark:text-[#a1a1aa] leading-none mb-1">
                    {dict.nameInApp || 'Name shown in the app'}
                  </p>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                    {profile.fullName || 'Aarav Sharma'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-[#a1a1aa] font-medium mt-0.5">
                    {profile.bloodGroup ? ('Blood: ' + profile.bloodGroup) : 'Blood: O+'} &bull; {profile.phoneNumber || '+91 98765 43210'}
                  </p>
                </div>
              </div>

              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-[#18181b] group-hover:bg-[#0d5c75]/10 dark:group-hover:bg-teal-950 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:text-[#0d5c75] dark:group-hover:text-teal-400 transition-colors shrink-0">
                <span className="material-symbols-outlined text-base">edit</span>
              </div>
            </div>
          </div>

          {/* 2. LANGUAGE SECTION */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#a1a1aa] block mb-2">
              {dict.language?.toUpperCase() || 'LANGUAGE'}
            </span>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#27272a] bg-white dark:bg-[#111111] space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{dict.language || 'Language'}</h4>
                  <p className="text-xs text-slate-500 dark:text-[#a1a1aa]">
                    {currentLang.native} &bull; {currentLang.label}
                  </p>
                </div>
                <span className="material-symbols-outlined text-[#0d5c75] dark:text-teal-400 text-2xl">
                  language
                </span>
              </div>

              {/* Language Grid */}
              <div className="grid grid-cols-3 gap-2">
                {LANGUAGES.map((item) => {
                  const isSelected = language === item.code;
                  return (
                    <button
                      key={item.code}
                      onClick={() => setLanguage(item.code)}
                      className={'p-2.5 rounded-xl border text-center transition-all cursor-pointer ' + (
                        isSelected
                          ? 'border-[#0d5c75] dark:border-teal-400 bg-[#0d5c75]/10 dark:bg-teal-950/40 shadow-xs'
                          : 'border-slate-200 dark:border-[#27272a] bg-slate-50 dark:bg-[#18181b] hover:bg-slate-100 dark:hover:bg-[#222225]'
                      )}
                    >
                      <p
                        className={'text-xs font-bold leading-tight ' + (
                          isSelected ? 'text-[#0d5c75] dark:text-teal-300' : 'text-slate-900 dark:text-white'
                        )}
                      >
                        {item.native}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-[#a1a1aa] font-medium mt-0.5">
                        {item.label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. APP PREFERENCES TOGGLES */}
          <div className="rounded-2xl border border-slate-200 dark:border-[#27272a] bg-white dark:bg-[#111111] divide-y divide-slate-100 dark:divide-[#27272a] shadow-xs overflow-hidden">
            {/* Appearance Toggle */}
            <div
              onClick={() => setColorScheme(isDarkMode ? 'light' : 'dark')}
              className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#18181b]/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#0d5c75] dark:text-teal-400 text-xl">
                  {isDarkMode ? 'dark_mode' : 'dark_mode'}
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{dict.appearance || 'Appearance'}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-[#a1a1aa]">
                    {isDarkMode ? (dict.dark || 'Dark') : (dict.light || 'Light')}
                  </p>
                </div>
              </div>
              <div
                className={'w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ' + (
                  isDarkMode ? 'bg-[#0d5c75] dark:bg-teal-500' : 'bg-slate-300 dark:bg-[#27272a]'
                )}
              >
                <div
                  className={'bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ' + (
                    isDarkMode ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </div>
            </div>

            {/* Notifications Toggle */}
            <div
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#18181b]/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#0d5c75] dark:text-teal-400 text-xl">
                  notifications
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{dict.notifications || 'Notifications'}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-[#a1a1aa]">
                    {dict.weatherSafetyAlerts || 'Weather & safety alerts'}
                  </p>
                </div>
              </div>
              <div
                className={'w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ' + (
                  notificationsEnabled ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-slate-300 dark:bg-[#27272a]'
                )}
              >
                <div
                  className={'bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ' + (
                    notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </div>
            </div>

            {/* Live Location Toggle */}
            <div
              onClick={() => setLiveLocationEnabled(!liveLocationEnabled)}
              className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#18181b]/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#0d5c75] dark:text-teal-400 text-xl">
                  location_on
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{dict.liveLocation || 'Live location'}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-[#a1a1aa]">
                    {dict.usedWeatherRoutes || 'Used for weather & routes'}
                  </p>
                </div>
              </div>
              <div
                className={'w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ' + (
                  liveLocationEnabled ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-slate-300 dark:bg-[#27272a]'
                )}
              >
                <div
                  className={'bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ' + (
                    liveLocationEnabled ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </div>
            </div>

            {/* Nearby Community Responder Toggle */}
            <div
              onClick={() => setIsNearbyResponder(!isNearbyResponder)}
              className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#18181b]/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#0d5c75] dark:text-teal-400 text-xl">
                  verified_user
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {dict.community || 'Nearby Community Responder'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-[#a1a1aa]">
                    Available to help nearby Aegis users (within 10-20 km)
                  </p>
                </div>
              </div>
              <div
                className={'w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ' + (
                  isNearbyResponder ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-slate-300 dark:bg-[#27272a]'
                )}
              >
                <div
                  className={'bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ' + (
                    isNearbyResponder ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </div>
            </div>
          </div>

          {/* 4. SUPPORT & ACCESS SECTION */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#a1a1aa] block mb-2">
              {dict.supportAccess || 'SUPPORT & ACCESS'}
            </span>

            <div className="rounded-2xl border border-slate-200 dark:border-[#27272a] bg-white dark:bg-[#111111] divide-y divide-slate-100 dark:divide-[#27272a] shadow-xs overflow-hidden">
              {/* Family Contacts */}
              <button
                onClick={() => setActiveSectionModal('family')}
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#18181b]/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#0d5c75] dark:text-teal-400 text-xl">
                    group
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{dict.familyContacts || 'Family contacts'}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-[#a1a1aa]">
                      {dict.trustedSafeContacts || 'Trusted Safe Ping contacts'} ({profile.familyContacts?.length || 2} registered)
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-base">chevron_right</span>
              </button>

              {/* Permissions */}
              <button
                onClick={() => setActiveSectionModal('permissions')}
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#18181b]/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#0d5c75] dark:text-teal-400 text-xl">
                    security
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{dict.permissions || 'Permissions'}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-[#a1a1aa]">
                      {dict.locationPhotosNotifs || 'Location, photos, notifications'}
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-base">chevron_right</span>
              </button>

              {/* Help Desk */}
              <a
                href="mailto:help@agiesalert.app"
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#18181b]/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#0d5c75] dark:text-teal-400 text-xl">
                    help
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{dict.helpDesk || 'Help desk'}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-[#a1a1aa]">
                      help@agiesalert.app
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-base">chevron_right</span>
              </a>

              {/* AGIES ALERT Web Link */}
              <a
                href="http://localhost:8081"
                target="_blank"
                rel="noreferrer"
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#18181b]/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#0d5c75] dark:text-teal-400 text-xl">
                    smartphone
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{dict.agiesWeb || 'AEGIS ALERT app'}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-[#a1a1aa]">
                      {dict.openCompanionWeb || 'Open the companion app link'}
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-base">chevron_right</span>
              </a>
            </div>
          </div>

          {/* 5. SIGN OUT BUTTON */}
          <div className="pt-2">
            <button
              onClick={() => {
                if (isAuthenticated) {
                  logout();
                } else if (onOpenAuthModal) {
                  onOpenAuthModal();
                }
                onClose();
              }}
              className="w-full py-3 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-100 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
            >
              {isAuthenticated ? (dict.signOut || 'Sign Out') : 'Sign In with NDMA / Aadhaar'}
            </button>
          </div>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#111111] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#27272a] p-6 space-y-4 font-sans animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0d5c75] dark:text-teal-400 text-xl">
                  edit_note
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {dict.yourProfile || 'Edit Citizen Profile'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#18181b]"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              {/* Profile Photo Uploader */}
              <div className="flex items-center gap-3.5 p-3 bg-slate-50 dark:bg-[#18181b] rounded-2xl border border-slate-200 dark:border-[#27272a]">
                <div className="w-14 h-14 rounded-2xl bg-[#0d5c75] text-white flex items-center justify-center font-black text-xl shadow-xs shrink-0 overflow-hidden">
                  {editAvatar ? (
                    <img src={editAvatar} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    editName?.trim() ? editName.trim()[0].toUpperCase() : 'A'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                    {dict.profilePhoto || 'Profile Photo'}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-lg bg-[#0d5c75] hover:bg-[#09485c] dark:bg-teal-500 dark:hover:bg-teal-400 text-white dark:text-slate-950 font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xs">photo_camera</span>
                      <span>{editAvatar ? (dict.changePhoto || 'Change Photo') : (dict.uploadPhoto || 'Upload Photo')}</span>
                    </button>
                    {editAvatar && (
                      <button
                        type="button"
                        onClick={() => setEditAvatar('')}
                        className="px-2 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 font-bold text-[11px] transition-colors cursor-pointer"
                      >
                        {dict.removePhoto || 'Remove'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-[#a1a1aa] mb-1">
                  {dict.nameInApp || 'Full Name'}
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#27272a] bg-slate-50 dark:bg-[#18181b] text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-[#0d5c75]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-[#a1a1aa] mb-1">
                  Emergency Phone Number
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#27272a] bg-slate-50 dark:bg-[#18181b] text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-[#0d5c75]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-[#a1a1aa] mb-1">
                    Blood Group
                  </label>
                  <select
                    value={editBlood}
                    onChange={(e) => setEditBlood(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-[#27272a] bg-slate-50 dark:bg-[#18181b] text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-[#0d5c75]"
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-[#a1a1aa] mb-1">
                    Family Size
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={editPeople}
                    onChange={(e) => setEditPeople(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#27272a] bg-slate-50 dark:bg-[#18181b] text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-[#0d5c75]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-[#a1a1aa] mb-1">
                  Medical Notes &amp; Allergies
                </label>
                <textarea
                  rows={2}
                  value={editMedical}
                  onChange={(e) => setEditMedical(e.target.value)}
                  placeholder="e.g. Diabetics, Asthmatic, Penicillin allergy"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#27272a] bg-slate-50 dark:bg-[#18181b] text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-[#0d5c75]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#27272a] text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-[#18181b]"
                >
                  {dict.cancel || 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0d5c75] hover:bg-[#094356] dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-bold transition-colors cursor-pointer shadow-xs"
                >
                  {dict.save || 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FAMILY CONTACTS MODAL */}
      {activeSectionModal === 'family' && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setActiveSectionModal(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#111111] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#27272a] p-6 space-y-4 font-sans animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0d5c75] dark:text-teal-400 text-xl">
                  group
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {dict.familyContacts || 'Trusted Family Contacts'}
                </h3>
              </div>
              <button
                onClick={() => setActiveSectionModal(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#18181b]"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-[#a1a1aa]">
              {dict.trustedSafeContacts || 'These contacts are automatically notified via SMS ping when you trigger SOS distress or safe check-in.'}
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {profile.familyContacts?.map((contact) => (
                <div
                  key={contact.id}
                  className="p-3 rounded-2xl border border-slate-200 dark:border-[#27272a] bg-slate-50 dark:bg-[#18181b] flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{contact.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-[#a1a1aa] font-mono">
                      {contact.phone} &bull; {contact.relationship}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Verified
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setActiveSectionModal(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-black font-bold text-xs cursor-pointer"
            >
              {dict.close || 'Done'}
            </button>
          </div>
        </div>
      )}

      {/* PERMISSIONS MODAL */}
      {activeSectionModal === 'permissions' && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setActiveSectionModal(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#111111] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#27272a] p-6 space-y-4 font-sans animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0d5c75] dark:text-teal-400 text-xl">
                  security
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {dict.permissions || 'App Permissions'}
                </h3>
              </div>
              <button
                onClick={() => setActiveSectionModal(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#18181b]"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl border border-slate-200 dark:border-[#27272a] bg-slate-50 dark:bg-[#18181b] flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{dict.liveLocation || 'Location Services (GPS)'}</p>
                  <p className="text-[11px] text-slate-500 dark:text-[#a1a1aa]">{dict.usedWeatherRoutes || 'Precise district hazard radar & weather'}</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Granted</span>
              </div>
              <div className="p-3 rounded-2xl border border-slate-200 dark:border-[#27272a] bg-slate-50 dark:bg-[#18181b] flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{dict.notifications || 'Emergency Notifications'}</p>
                  <p className="text-[11px] text-slate-500 dark:text-[#a1a1aa]">{dict.weatherSafetyAlerts || 'Severe alert sirens & safe pings'}</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Granted</span>
              </div>
              <div className="p-3 rounded-2xl border border-slate-200 dark:border-[#27272a] bg-slate-50 dark:bg-[#18181b] flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{dict.reports || 'Photo & Report Uploads'}</p>
                  <p className="text-[11px] text-slate-500 dark:text-[#a1a1aa]">{dict.reportHazardShort || 'Crowdsourced incident photos'}</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Granted</span>
              </div>
            </div>

            <button
              onClick={() => setActiveSectionModal(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-black font-bold text-xs cursor-pointer"
            >
              {dict.close || 'Done'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDrawer;
