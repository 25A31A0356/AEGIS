import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Globe,
  Moon,
  Sun,
  Bell,
  MapPin,
  Users,
  ShieldAlert,
  HelpCircle,
  ExternalLink,
  LogOut,
  Check,
  CheckCircle2,
  Phone,
  Plus,
  Trash2,
  Lock,
  Smartphone,
} from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import { APP_LANGUAGES, BLOOD_GROUPS } from '../../types/profile';
import { useTranslation } from '../../i18n/useTranslation';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ProfileView = 'main' | 'edit-profile' | 'family-contacts' | 'permissions' | 'help-desk';

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const {
    profile,
    language,
    setLanguage,
    colorScheme,
    setColorScheme,
    notificationsEnabled,
    setNotificationsEnabled,
    liveLocationEnabled,
    setLiveLocationEnabled,
    updateProfile,
    addFamilyContact,
    removeFamilyContact,
    resetToDefaults,
  } = useProfile();

  // Internal screen navigation inside the right slide drawer
  const [currentView, setCurrentView] = useState<ProfileView>('main');

  // Edit Profile Form State
  const [tempName, setTempName] = useState(profile.fullName || '');
  const [tempPhone, setTempPhone] = useState(profile.phoneNumber || '');
  const [tempBlood, setTempBlood] = useState(profile.bloodGroup || 'O+');
  const [tempMedical, setTempMedical] = useState(profile.medicalNotes || '');
  const [tempPeople, setTempPeople] = useState(String(profile.peopleCount || 3));
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Add Family Contact Form State
  const [showAddContactForm, setShowAddContactForm] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRel, setNewContactRel] = useState('Family');
  const [newContactNotes, setNewContactNotes] = useState('');

  if (!isOpen) return null;

  const currentLanguage = APP_LANGUAGES.find((l) => l.code === language) || APP_LANGUAGES[0];

  const handleOpenEditProfile = () => {
    setTempName(profile.fullName || '');
    setTempPhone(profile.phoneNumber || '');
    setTempBlood(profile.bloodGroup || 'O+');
    setTempMedical(profile.medicalNotes || '');
    setTempPeople(String(profile.peopleCount || 3));
    setCurrentView('edit-profile');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName.trim()) return;

    updateProfile({
      fullName: tempName.trim(),
      phoneNumber: tempPhone.trim(),
      bloodGroup: tempBlood,
      medicalNotes: tempMedical.trim(),
      peopleCount: parseInt(tempPeople, 10) || 1,
    });

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setCurrentView('main');
    }, 600);
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) return;

    addFamilyContact({
      name: newContactName.trim(),
      phone: newContactPhone.trim(),
      relationship: newContactRel.trim() || 'Family',
      notes: newContactNotes.trim() || undefined,
      isPrimary: profile.familyContacts.length === 0,
    });

    setNewContactName('');
    setNewContactPhone('');
    setNewContactRel('Family');
    setNewContactNotes('');
    setShowAddContactForm(false);
  };

  const avatarInitial = profile.fullName?.trim() ? profile.fullName.trim()[0].toUpperCase() : 'A';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Dark backdrop with blur */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Slide-over Drawer Panel from Right */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div
          className="w-screen max-w-md sm:max-w-lg bg-slate-50 dark:bg-[#071828] shadow-2xl border-l border-slate-200 dark:border-[#1E3347] flex flex-col h-full animate-in slide-in-from-right duration-300 ease-out transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {/* VIEW 1: MAIN SETTINGS & PROFILE */}
          {currentView === 'main' && (
            <div className="flex flex-col h-full animate-in fade-in duration-150">
              {/* Top Header Bar */}
              <div className="px-5 pt-4 pb-3 bg-white dark:bg-[#0E1C2A] border-b border-slate-200 dark:border-[#1E3347] flex items-center justify-between sticky top-0 z-10 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-[#075B8A] dark:text-[#18C3D0] uppercase tracking-widest bg-[#075B8A]/10 dark:bg-[#18C3D0]/10 px-2 py-0.5 rounded">
                    {t('settings.preferences', 'PREFERENCES')}
                  </span>
                </div>

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#132335] transition-colors"
                  title="Close Drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
                {/* Title */}
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    {t('settings.title', 'Settings')}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {t('settings.subtitle', 'Make AGIES work best for your safety and preparedness.')}
                  </p>
                </div>

                {/* SECTION: YOUR PROFILE */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {t('settings.yourProfile', 'YOUR PROFILE')}
                    </span>
                    <button
                      onClick={handleOpenEditProfile}
                      className="flex items-center gap-1 text-xs font-bold text-[#075B8A] dark:text-[#18C3D0] hover:text-[#0B6E9E] bg-[#075B8A]/10 dark:bg-[#18C3D0]/10 px-2.5 py-1 rounded-full hover:bg-[#075B8A]/15 transition-all"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>{t('settings.editProfile', 'Edit Profile')}</span>
                    </button>
                  </div>

                  {/* Profile Card */}
                  <div
                    onClick={handleOpenEditProfile}
                    className="p-4 rounded-2xl bg-white dark:bg-[#0E1C2A] border border-slate-200 dark:border-[#1E3347] shadow-xs hover:border-slate-300 dark:hover:border-[#18C3D0] transition-all cursor-pointer flex items-center gap-3.5 group"
                  >
                    <div className="w-13 h-13 rounded-full bg-[#075B8A] text-white flex items-center justify-center font-black text-xl shadow-md shrink-0 ring-4 ring-[#075B8A]/10">
                      {avatarInitial}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        {t('settings.nameInApp', 'NAME IN APP')}
                      </div>
                      <div className="text-base font-extrabold text-slate-900 dark:text-slate-100 truncate">
                        {profile.fullName || 'Aarav Sharma'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-red-600 dark:text-red-400 font-bold font-mono">
                          Blood: {profile.bloodGroup || 'O+'}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span className="font-mono text-slate-600 dark:text-slate-300">{profile.phoneNumber || '+91 98765 00000'}</span>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span className="text-slate-600 dark:text-slate-300">{profile.peopleCount || 3} People</span>
                      </div>
                      {profile.medicalNotes && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-1 bg-slate-50 dark:bg-[#07131D] px-2 py-0.5 rounded border border-slate-100 dark:border-[#1E3347]">
                          ⚕️ {profile.medicalNotes}
                        </div>
                      )}
                    </div>

                    <div className="w-8 h-8 rounded-full bg-[#075B8A]/10 dark:bg-[#18C3D0]/10 text-[#075B8A] dark:text-[#18C3D0] flex items-center justify-center group-hover:bg-[#075B8A] group-hover:text-white dark:group-hover:bg-[#18C3D0] dark:group-hover:text-[#075B8A] transition-all shrink-0">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* SECTION: LANGUAGE */}
                <div className="space-y-2">
                  <div className="px-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t('settings.language', 'LANGUAGE')}
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-[#0E1C2A] border border-slate-200 dark:border-[#1E3347] shadow-xs space-y-3 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{t('settings.appLanguage', 'Language')}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {currentLanguage.native} • {currentLanguage.label}
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-[#075B8A]/10 dark:bg-[#18C3D0]/10 text-[#075B8A] dark:text-[#18C3D0] flex items-center justify-center">
                        <Globe className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {APP_LANGUAGES.map((lang) => {
                        const isSelected = language === lang.code;
                        return (
                          <button
                            key={lang.code}
                            onClick={() => setLanguage(lang.code)}
                            className={`p-2.5 rounded-xl text-left border transition-all ${
                              isSelected
                                ? 'bg-[#075B8A]/10 dark:bg-[#18C3D0]/15 border-[#075B8A] dark:border-[#18C3D0] shadow-xs'
                                : 'bg-slate-50 dark:bg-[#07131D] hover:bg-slate-100 dark:hover:bg-[#132335] border-slate-200 dark:border-[#1E3347]'
                            }`}
                          >
                            <div
                              className={`text-xs font-bold leading-tight ${
                                isSelected ? 'text-[#075B8A] dark:text-[#18C3D0]' : 'text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              {lang.native}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                              {lang.label}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* SECTION: APP EXPERIENCE */}
                <div className="space-y-2">
                  <div className="px-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t('settings.appExperience', 'APP EXPERIENCE')}
                  </div>

                  <div className="rounded-2xl bg-white dark:bg-[#0E1C2A] border border-slate-200 dark:border-[#1E3347] shadow-xs divide-y divide-slate-100 dark:divide-[#1E3347] overflow-hidden transition-colors">
                    {/* Appearance */}
                    <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-[#132335]/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                          {colorScheme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{t('settings.appearance', 'Appearance')}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {colorScheme === 'dark' ? t('settings.darkTheme', 'Dark Theme') : t('settings.lightTheme', 'Light Theme')}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                          colorScheme === 'dark' ? 'bg-[#075B8A]' : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            colorScheme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Notifications */}
                    <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-[#132335]/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                          <Bell className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{t('settings.notifications', 'Notifications')}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{t('settings.notifSub', 'Weather & safety alerts')}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                          notificationsEnabled ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Live Location */}
                    <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-[#132335]/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-[#18C3D0] flex items-center justify-center">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{t('settings.liveLocation', 'Live Location')}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{t('settings.locationSub', 'Used for weather & routes')}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => setLiveLocationEnabled(!liveLocationEnabled)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                          liveLocationEnabled ? 'bg-[#075B8A]' : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            liveLocationEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* SECTION: SUPPORT & ACCESS */}
                <div className="space-y-2">
                  <div className="px-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t('settings.supportAndAccess', 'SUPPORT & ACCESS')}
                  </div>

                  <div className="rounded-2xl bg-white dark:bg-[#0E1C2A] border border-slate-200 dark:border-[#1E3347] shadow-xs divide-y divide-slate-100 dark:divide-[#1E3347] overflow-hidden transition-colors">
                    {/* Family Contacts Row */}
                    <button
                      onClick={() => setCurrentView('family-contacts')}
                      className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#132335] transition-colors text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#075B8A] dark:group-hover:text-[#18C3D0] transition-colors flex items-center gap-1.5">
                            <span>{t('settings.familyContacts', 'Family Contacts')}</span>
                            <span className="text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded-full">
                              {profile.familyContacts.length}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{t('settings.trustedContacts', 'Trusted safe contacts')}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors" />
                    </button>

                    {/* Permissions Row */}
                    <button
                      onClick={() => setCurrentView('permissions')}
                      className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#132335] transition-colors text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#075B8A] dark:group-hover:text-[#18C3D0] transition-colors">
                            {t('settings.permissions', 'Permissions')}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{t('settings.permissionsSub', 'Location, photos, notifications')}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors" />
                    </button>

                    {/* Help Desk Row */}
                    <button
                      onClick={() => setCurrentView('help-desk')}
                      className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#132335] transition-colors text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                          <HelpCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#075B8A] dark:group-hover:text-[#18C3D0] transition-colors">
                            {t('settings.helpDesk', 'Help Desk')}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">help@agiesalert.app</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors" />
                    </button>

                    {/* Companion App Link Row */}
                    <a
                      href="http://localhost:8081"
                      target="_blank"
                      rel="noreferrer"
                      className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#132335] transition-colors text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-[#18C3D0] flex items-center justify-center">
                          <Smartphone className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#075B8A] dark:group-hover:text-[#18C3D0] transition-colors flex items-center gap-1.5">
                            <span>AEGIS Mobile App</span>
                            <span className="text-[10px] font-mono text-sky-600 dark:text-[#18C3D0] bg-sky-100 dark:bg-sky-950/50 px-1.5 py-0.2 rounded font-bold">
                              PORT 8081
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">Open Companion Mobile Web</div>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors" />
                    </a>
                  </div>
                </div>

                {/* Reset Profile */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      if (window.confirm('Reset emergency profile and preferences to defaults?')) {
                        resetToDefaults();
                      }
                    }}
                    className="w-full py-3 px-4 rounded-2xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-[#0E1C2A] hover:bg-red-50/80 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('settings.resetProfile', 'Reset Profile to Default')}</span>
                  </button>
                </div>
              </div>

              {/* Drawer Bottom Bar */}
              <div className="p-4 bg-white dark:bg-[#0E1C2A] border-t border-slate-200 dark:border-[#1E3347] flex items-center justify-between text-xs transition-colors">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Profile Synced • AEGIS v2.4</span>
                </div>
                <button
                  onClick={onClose}
                  className="bg-[#075B8A] hover:bg-[#0B6E9E] dark:bg-[#18C3D0] dark:hover:bg-[#14adb8] text-white dark:text-[#075B8A] font-bold px-4 py-2 rounded-xl transition-colors text-xs"
                >
                  {t('common.done', 'Done')}
                </button>
              </div>
            </div>
          )}

          {/* VIEW 2: EDIT PROFILE SUB-VIEW */}
          {currentView === 'edit-profile' && (
            <div className="flex flex-col h-full animate-in slide-in-from-right duration-200">
              {/* Header */}
              <div className="px-5 pt-4 pb-3 border-b border-slate-200 dark:border-[#1E3347] flex items-center justify-between bg-white dark:bg-[#0E1C2A] transition-colors">
                <button
                  onClick={() => setCurrentView('main')}
                  className="flex items-center gap-1 text-xs font-bold text-[#075B8A] dark:text-[#18C3D0] hover:text-[#0B6E9E] py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#132335]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{t('settings.title', 'Settings')}</span>
                </button>
                <div className="text-center">
                  <span className="text-[10px] font-bold text-[#075B8A] dark:text-[#18C3D0] uppercase tracking-wider font-mono block">
                    {t('settings.personalDetails', 'PERSONAL DETAILS')}
                  </span>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                    {t('settings.editProfile', 'Edit Profile')}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#132335]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveProfile} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {t('settings.fullName', 'Full Name')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#1E3347] bg-white dark:bg-[#0E1C2A] text-slate-900 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-[#075B8A] dark:focus:ring-[#18C3D0] focus:border-[#075B8A] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {t('settings.phoneNumber', 'Mobile Phone Number')}
                  </label>
                  <input
                    type="tel"
                    value={tempPhone}
                    onChange={(e) => setTempPhone(e.target.value)}
                    placeholder="+91 98765 00000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#1E3347] bg-white dark:bg-[#0E1C2A] text-slate-900 dark:text-slate-100 text-xs font-mono font-medium focus:ring-2 focus:ring-[#075B8A] dark:focus:ring-[#18C3D0] focus:border-[#075B8A] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    {t('settings.bloodGroup', 'Blood Group')}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {BLOOD_GROUPS.map((bg) => {
                      const isSelected = tempBlood === bg;
                      return (
                        <button
                          type="button"
                          key={bg}
                          onClick={() => setTempBlood(bg)}
                          className={`py-2 px-1 rounded-xl text-xs font-extrabold font-mono border transition-all ${
                            isSelected
                              ? 'bg-red-600 text-white border-red-600 shadow-sm'
                              : 'bg-white dark:bg-[#0E1C2A] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#1E3347] hover:bg-slate-100 dark:hover:bg-[#132335]'
                          }`}
                        >
                          {bg}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {t('settings.familyMembers', 'Family Members in Household')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={tempPeople}
                    onChange={(e) => setTempPeople(e.target.value)}
                    placeholder="3"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#1E3347] bg-white dark:bg-[#0E1C2A] text-slate-900 dark:text-slate-100 text-xs font-mono font-medium focus:ring-2 focus:ring-[#075B8A] dark:focus:ring-[#18C3D0] focus:border-[#075B8A] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {t('settings.medicalNotes', 'Medical Notes & Allergies')}
                  </label>
                  <textarea
                    rows={3}
                    value={tempMedical}
                    onChange={(e) => setTempMedical(e.target.value)}
                    placeholder="e.g. Diabetic, Asthma, Penicillin allergy"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#1E3347] bg-white dark:bg-[#0E1C2A] text-slate-900 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-[#075B8A] dark:focus:ring-[#18C3D0] focus:border-[#075B8A] outline-none leading-relaxed"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className={`w-full py-3 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all ${
                      saveSuccess
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-[#075B8A] hover:bg-[#0B6E9E] dark:bg-[#18C3D0] dark:hover:bg-[#14adb8] dark:text-[#075B8A]'
                    }`}
                  >
                    {saveSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 animate-bounce" />
                        <span>Saved Successfully!</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{t('settings.saveProfile', 'Save Profile')}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* VIEW 3: FAMILY CONTACTS SUB-VIEW */}
          {currentView === 'family-contacts' && (
            <div className="flex flex-col h-full animate-in slide-in-from-right duration-200">
              <div className="px-5 pt-4 pb-3 border-b border-slate-200 dark:border-[#1E3347] flex items-center justify-between bg-white dark:bg-[#0E1C2A] transition-colors">
                <button
                  onClick={() => setCurrentView('main')}
                  className="flex items-center gap-1 text-xs font-bold text-[#075B8A] dark:text-[#18C3D0] hover:text-[#0B6E9E] py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#132335]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{t('settings.title', 'Settings')}</span>
                </button>
                <div className="text-center">
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider font-mono block">
                    {t('settings.emergencyDispatch', 'EMERGENCY DISPATCH')}
                  </span>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                    {t('settings.familyContacts', 'Family Contacts')} ({profile.familyContacts.length})
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#132335]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-3 flex-1">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  These trusted contacts receive real-time SOS alerts with your GPS coordinates and safety check-ins automatically.
                </p>

                <div className="space-y-2.5">
                  {profile.familyContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="p-3.5 rounded-2xl bg-white dark:bg-[#0E1C2A] border border-slate-200 dark:border-[#1E3347] flex items-center justify-between gap-3 text-xs shadow-xs transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 dark:text-slate-100 truncate">
                            {contact.name}
                          </span>
                          <span className="text-[10px] font-bold bg-[#075B8A]/10 dark:bg-[#18C3D0]/10 text-[#075B8A] dark:text-[#18C3D0] px-2 py-0.2 rounded-full">
                            {contact.relationship}
                          </span>
                          {contact.isPrimary && (
                            <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded-full">
                              ★ Primary
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-600 dark:text-slate-300 mt-0.5">
                          {contact.phone}
                        </div>
                        {contact.notes && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 italic truncate">
                            {contact.notes}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={`tel:${contact.phone}`}
                          className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition-colors"
                          title="Call Contact"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => removeFamilyContact(contact.id)}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-[#07131D] text-slate-600 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-950/50 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                          title="Delete Contact"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {!showAddContactForm ? (
                  <button
                    onClick={() => setShowAddContactForm(true)}
                    className="w-full py-2.5 rounded-xl border-2 border-dashed border-[#075B8A]/40 dark:border-[#18C3D0]/40 text-[#075B8A] dark:text-[#18C3D0] hover:bg-[#075B8A]/5 dark:hover:bg-[#18C3D0]/5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all mt-3"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('settings.addContact', 'Add Emergency Contact')}</span>
                  </button>
                ) : (
                  <form
                    onSubmit={handleAddContact}
                    className="p-4 rounded-2xl bg-white dark:bg-[#0E1C2A] border border-slate-300 dark:border-[#1E3347] shadow-sm space-y-3 mt-3 text-xs transition-colors"
                  >
                    <div className="font-bold text-slate-900 dark:text-slate-100">{t('settings.newContact', 'New Emergency Contact')}</div>
                    <div className="space-y-2">
                      <input
                        type="text"
                        required
                        placeholder="Contact Name *"
                        value={newContactName}
                        onChange={(e) => setNewContactName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#1E3347] bg-white dark:bg-[#07131D] text-slate-900 dark:text-slate-100 text-xs outline-none focus:ring-1 focus:ring-[#075B8A] dark:focus:ring-[#18C3D0]"
                      />
                      <input
                        type="tel"
                        required
                        placeholder="Phone Number *"
                        value={newContactPhone}
                        onChange={(e) => setNewContactPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#1E3347] bg-white dark:bg-[#07131D] text-slate-900 dark:text-slate-100 text-xs font-mono outline-none focus:ring-1 focus:ring-[#075B8A] dark:focus:ring-[#18C3D0]"
                      />
                      <input
                        type="text"
                        placeholder="Relationship (e.g. Spouse, Father)"
                        value={newContactRel}
                        onChange={(e) => setNewContactRel(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#1E3347] bg-white dark:bg-[#07131D] text-slate-900 dark:text-slate-100 text-xs outline-none focus:ring-1 focus:ring-[#075B8A] dark:focus:ring-[#18C3D0]"
                      />
                      <input
                        type="text"
                        placeholder="Notes (e.g. Senior citizen)"
                        value={newContactNotes}
                        onChange={(e) => setNewContactNotes(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#1E3347] bg-white dark:bg-[#07131D] text-slate-900 dark:text-slate-100 text-xs outline-none focus:ring-1 focus:ring-[#075B8A] dark:focus:ring-[#18C3D0]"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddContactForm(false)}
                        className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#132335] text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-lg bg-[#075B8A] dark:bg-[#18C3D0] text-white dark:text-[#075B8A] text-xs font-bold hover:bg-[#0B6E9E] dark:hover:bg-[#14adb8]"
                      >
                        Save Contact
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* VIEW 4: PERMISSIONS SUB-VIEW */}
          {currentView === 'permissions' && (
            <div className="flex flex-col h-full animate-in slide-in-from-right duration-200">
              <div className="px-5 pt-4 pb-3 border-b border-slate-200 dark:border-[#1E3347] flex items-center justify-between bg-white dark:bg-[#0E1C2A] transition-colors">
                <button
                  onClick={() => setCurrentView('main')}
                  className="flex items-center gap-1 text-xs font-bold text-[#075B8A] dark:text-[#18C3D0] hover:text-[#0B6E9E] py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#132335]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{t('settings.title', 'Settings')}</span>
                </button>
                <div className="text-center">
                  <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider font-mono block">
                    {t('settings.securityAndHardware', 'SECURITY & HARDWARE')}
                  </span>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                    {t('settings.systemPermissions', 'System Permissions')}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#132335]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-3 text-xs flex-1 overflow-y-auto">
                <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-emerald-950 dark:text-emerald-300 text-sm">Precise GPS Location</div>
                    <div className="text-xs text-emerald-800 dark:text-emerald-400 mt-0.5 leading-relaxed">
                      Granted for meteorological radar clustering, proximity hazard alerts, and emergency responder navigation routing.
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-emerald-950 dark:text-emerald-300 text-sm">Critical Safety Notifications</div>
                    <div className="text-xs text-emerald-800 dark:text-emerald-400 mt-0.5 leading-relaxed">
                      Granted for immediate IMD cyclones, flash flood alarms, and SDMA disaster broadcasts.
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-sky-50/80 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/50 flex items-start gap-3">
                  <Lock className="w-5 h-5 text-sky-700 dark:text-[#18C3D0] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-sky-950 dark:text-sky-300 text-sm">Hardware Keystore Encryption</div>
                    <div className="text-xs text-sky-800 dark:text-sky-400 mt-0.5 leading-relaxed">
                      All sensitive medical notes, blood group, and emergency contacts are encrypted client-side using hardware-backed SecureStore.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 5: HELP DESK SUB-VIEW */}
          {currentView === 'help-desk' && (
            <div className="flex flex-col h-full animate-in slide-in-from-right duration-200">
              <div className="px-5 pt-4 pb-3 border-b border-slate-200 dark:border-[#1E3347] flex items-center justify-between bg-white dark:bg-[#0E1C2A] transition-colors">
                <button
                  onClick={() => setCurrentView('main')}
                  className="flex items-center gap-1 text-xs font-bold text-[#075B8A] dark:text-[#18C3D0] hover:text-[#0B6E9E] py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#132335]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{t('settings.title', 'Settings')}</span>
                </button>
                <div className="text-center">
                  <span className="text-[10px] font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wider font-mono block">
                    {t('settings.assistanceAndSupport', 'ASSISTANCE & SUPPORT')}
                  </span>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                    {t('settings.helpDesk', 'Help Desk')}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#132335]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs flex-1 overflow-y-auto">
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  For emergency responder integration, false alarm revocations, or citizen safety support:
                </p>

                <div className="p-4 rounded-2xl bg-white dark:bg-[#0E1C2A] border border-slate-200 dark:border-[#1E3347] space-y-2 font-mono text-xs shadow-xs transition-colors">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px]">DIRECT EMAIL</span>
                    <strong className="text-slate-900 dark:text-slate-100 text-sm">help@agiesalert.app</strong>
                  </div>
                  <div className="pt-1 border-t border-slate-100 dark:border-[#1E3347]">
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px]">NDMA NATIONAL HELPLINE</span>
                    <strong className="text-red-700 dark:text-red-400 text-sm">1078</strong>
                  </div>
                  <div className="pt-1 border-t border-slate-100 dark:border-[#1E3347]">
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px]">ALL-INDIA EMERGENCY NUMBER</span>
                    <strong className="text-red-700 dark:text-red-400 text-sm">112</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
