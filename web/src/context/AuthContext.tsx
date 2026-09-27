import React, { createContext, useContext, useState, useEffect } from 'react';
import { ApiClient } from '../services/apiClient';

export type UserRole = 'citizen' | 'responder' | 'operator' | 'official' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  agency?: string;
  badgeNumber?: string;
  is_active: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string, role?: UserRole) => Promise<boolean>;
  register: (fullName: string, email: string, password?: string, role?: UserRole) => Promise<boolean>;
  sendOtp: (email: string, fullName?: string) => Promise<{ success: boolean; message: string; otp_code?: string }>;
  verifyOtp: (email: string, otp: string, fullName?: string, role?: UserRole) => Promise<boolean>;
  requestForgotPasswordOtp: (email: string) => Promise<{ success: boolean; message: string; otp_code?: string }>;
  resetPasswordWithOtp: (email: string, otp: string, newPassword: string) => Promise<boolean>;
  googleLogin: (email: string, fullName: string, googleId?: string) => Promise<boolean>;
  switchRole: (newRole: UserRole) => void;
  logout: () => void;
  hasRole: (requiredRole: UserRole) => boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
}

const ROLE_HIERARCHY: Record<UserRole, number> = {
  citizen: 1,
  responder: 2,
  operator: 3,
  official: 4,
  admin: 5,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('aegis_auth_token');
    }
    return null;
  });

  const [role, setRole] = useState<UserRole>(() => {
    if (typeof localStorage !== 'undefined') {
      return (localStorage.getItem('aegis_user_role') as UserRole) || 'citizen';
    }
    return 'citizen';
  });

  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Sync token to backend identity
  useEffect(() => {
    async function verifySession() {
      const storedToken = localStorage.getItem('aegis_auth_token');
      if (!storedToken) {
        setUser(null);
        return;
      }

      try {
        setIsLoading(true);
        const me = await ApiClient.get<any>('/auth/me', undefined, { skipCache: true, timeoutMs: 3000 });
        if (me && (me.id || me.email)) {
          const fetchedRole = (me.role || role) as UserRole;
          setUser({
            id: me.id || `usr-${Date.now().toString(36)}`,
            name: me.name || me.full_name || me.email?.split('@')[0] || 'Citizen',
            email: me.email || '',
            role: fetchedRole,
            agency: me.agency || (fetchedRole === 'citizen' ? 'Verified Citizen' : 'Disaster Operations Command'),
            badgeNumber: me.badge_number || `OP-${(me.id || '100').substring(0, 6)}`,
            is_active: me.is_active !== false,
          });
          setRole(fetchedRole);
        } else {
          // If token was invalid, clear
          localStorage.removeItem('aegis_auth_token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.warn('[AuthContext] /auth/me session check:', err);
      } finally {
        setIsLoading(false);
      }
    }

    void verifySession();
  }, []);

  const login = async (email: string, password: string = 'password123', requestedRole: UserRole = 'citizen'): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await ApiClient.post<any>('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      if (!res || (!res.access_token && !res.token)) {
        throw new Error('Account not found or invalid credentials. Please Sign Up first.');
      }

      const authToken = res.access_token || res.token;
      const userData = res.user;
      const finalRole = (userData?.role || requestedRole) as UserRole;

      localStorage.setItem('aegis_auth_token', authToken);
      localStorage.setItem('aegis_user_role', finalRole);
      setToken(authToken);
      setRole(finalRole);

      const authenticatedUser: AuthUser = {
        id: userData?.id || `usr-${Date.now().toString(36)}`,
        name: userData?.full_name || userData?.name || email.split('@')[0],
        email: email.trim().toLowerCase(),
        role: finalRole,
        agency: finalRole === 'official' ? 'Ministry of Home Affairs / NDMA' : (finalRole === 'operator' ? 'State Command Desk' : 'Verified Citizen'),
        badgeNumber: `CMD-${finalRole.toUpperCase()}-702`,
        is_active: true,
      };

      setUser(authenticatedUser);
      return true;
    } catch (err: any) {
      console.warn('[AuthContext] Login error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (fullName: string, email: string, password: string = 'password123', requestedRole: UserRole = 'citizen'): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await ApiClient.post<any>('/auth/register', {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: requestedRole,
      });

      if (!res || (!res.access_token && !res.token)) {
        throw new Error('Registration failed. Please check your information.');
      }

      const authToken = res.access_token || res.token;
      const userData = res.user;
      const finalRole = (userData?.role || requestedRole) as UserRole;

      localStorage.setItem('aegis_auth_token', authToken);
      localStorage.setItem('aegis_user_role', finalRole);
      setToken(authToken);
      setRole(finalRole);

      setUser({
        id: userData?.id || `usr-${Date.now().toString(36)}`,
        name: userData?.full_name || fullName.trim(),
        email: email.trim().toLowerCase(),
        role: finalRole,
        agency: finalRole === 'citizen' ? 'Verified Citizen' : 'Disaster Operations Command',
        badgeNumber: `CMD-${finalRole.toUpperCase()}-702`,
        is_active: true,
      });
      return true;
    } catch (err: any) {
      console.warn('[AuthContext] Register error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const sendOtp = async (email: string, fullName?: string): Promise<{ success: boolean; message: string; otp_code?: string }> => {
    try {
      setIsLoading(true);
      const res = await ApiClient.post<any>('/auth/otp/send', {
        email: email.trim().toLowerCase(),
        full_name: fullName?.trim() || '',
      });
      return {
        success: true,
        message: res?.message || 'Verification code dispatched.',
        otp_code: res?.otp_code,
      };
    } catch (err: any) {
      console.warn('[AuthContext] sendOtp error:', err);
      return { success: false, message: err?.message || 'Failed to send OTP code.' };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (email: string, otp: string, fullName?: string, requestedRole: UserRole = 'citizen'): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await ApiClient.post<any>('/auth/otp/verify', {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        full_name: fullName?.trim() || '',
        role: requestedRole,
      });

      const authToken = res?.access_token || res?.token || `token-${Date.now()}`;
      const userData = res?.user;
      const finalRole = (userData?.role || requestedRole) as UserRole;

      localStorage.setItem('aegis_auth_token', authToken);
      localStorage.setItem('aegis_user_role', finalRole);
      setToken(authToken);
      setRole(finalRole);

      setUser({
        id: userData?.id || `usr-${Date.now().toString(36)}`,
        name: userData?.full_name || fullName || email.split('@')[0],
        email: email.trim().toLowerCase(),
        role: finalRole,
        agency: finalRole === 'citizen' ? 'Verified Citizen' : 'Disaster Operations Command',
        badgeNumber: `CMD-${finalRole.toUpperCase()}-702`,
        is_active: true,
      });
      return true;
    } catch (err: any) {
      console.warn('[AuthContext] verifyOtp error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (email: string, fullName: string, googleId?: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await ApiClient.post<any>('/auth/google', {
        email: email.trim().toLowerCase(),
        full_name: fullName.trim(),
        google_id: googleId || `goog_${Date.now()}`,
        role: 'citizen',
      });

      const authToken = res?.access_token || res?.token || `token-${Date.now()}`;
      const userData = res?.user;

      localStorage.setItem('aegis_auth_token', authToken);
      localStorage.setItem('aegis_user_role', 'citizen');
      setToken(authToken);
      setRole('citizen');

      setUser({
        id: userData?.id || `usr-${Date.now().toString(36)}`,
        name: userData?.full_name || fullName.trim(),
        email: email.trim().toLowerCase(),
        role: 'citizen',
        agency: 'Google Authenticated Citizen',
        badgeNumber: `GOOGLE-AUTH`,
        is_active: true,
      });
      return true;
    } catch (err: any) {
      console.warn('[AuthContext] googleLogin error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };


  const requestForgotPasswordOtp = async (email: string): Promise<{ success: boolean; message: string; otp_code?: string }> => {
    try {
      setIsLoading(true);
      const res = await ApiClient.post<any>('/auth/forgot-password/request', {
        email: email.trim().toLowerCase(),
      });
      return {
        success: true,
        message: res?.message || `6-digit reset OTP sent to ${email}.`,
        otp_code: res?.otp_code,
      };
    } catch (err: any) {
      console.warn('[AuthContext] requestForgotPasswordOtp error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPasswordWithOtp = async (email: string, otp: string, newPassword: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await ApiClient.post<any>('/auth/forgot-password/reset', {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        new_password: newPassword.trim(),
      });

      const authToken = res?.access_token || res?.token;
      const userData = res?.user;
      const finalRole = (userData?.role || 'citizen') as UserRole;

      if (authToken) {
        localStorage.setItem('aegis_auth_token', authToken);
        localStorage.setItem('aegis_user_role', finalRole);
        setToken(authToken);
        setRole(finalRole);
        setUser({
          id: userData?.id || `usr-${Date.now().toString(36)}`,
          name: userData?.full_name || email.split('@')[0],
          email: email.trim().toLowerCase(),
          role: finalRole,
          agency: finalRole === 'citizen' ? 'Verified Citizen' : 'Disaster Operations Command',
          badgeNumber: `CMD-${finalRole.toUpperCase()}-702`,
          is_active: true,
        });
      }
      return true;
    } catch (err: any) {
      console.warn('[AuthContext] resetPasswordWithOtp error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    localStorage.setItem('aegis_user_role', newRole);
    if (user) {
      setUser({ ...user, role: newRole });
    }
  };

  const logout = () => {
    localStorage.removeItem('aegis_auth_token');
    localStorage.removeItem('aegis_user_role');
    localStorage.removeItem('aegis_user_emergency_profile');
    setToken(null);
    setRole('citizen');
    setUser(null);
  };

  const hasRole = (requiredRole: UserRole): boolean => {
    return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[requiredRole];
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        isAuthenticated: Boolean(user && user.is_active),
        isLoading,
        login,
        register,
        sendOtp,
        verifyOtp,
        requestForgotPasswordOtp,
        resetPasswordWithOtp,
        googleLogin,
        switchRole,
        logout,
        hasRole,
        isAuthModalOpen,
        setIsAuthModalOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
