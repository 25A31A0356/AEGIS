export interface FamilyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary?: boolean;
  notes?: string;
}

export interface EmergencyProfile {
  fullName: string;
  phoneNumber: string;
  bloodGroup: string;
  medicalNotes: string;
  peopleCount: number;
  familyContacts: FamilyContact[];
  customSosMessage?: string;
  customSafeMessage?: string;
  avatarUrl?: string;
  avatarUri?: string;
  homeCity?: string;
  homePoliceStation?: string;
  homePoliceNumber?: string;
}

export interface LanguageOption {
  code: string;
  label: string;
  native: string;
}

export const APP_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
];

export const BLOOD_GROUPS = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'];

export const DEFAULT_FAMILY_CONTACTS: FamilyContact[] = [];

export const DEFAULT_EMERGENCY_PROFILE: EmergencyProfile = {
  fullName: '',
  phoneNumber: '',
  bloodGroup: '',
  medicalNotes: '',
  peopleCount: 1,
  familyContacts: [],
  customSosMessage: 'EMERGENCY SOS: I need immediate help! Please dispatch rescue to my location.',
  customSafeMessage: 'I am safe and secure. Sharing my location with family through AEGIS ALERT.',
  avatarUrl: '',
  avatarUri: '',
  homeCity: '',
  homePoliceStation: '',
  homePoliceNumber: '',
};
