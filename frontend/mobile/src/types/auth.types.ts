/**
 * Authentication Types
 * 
 * TypeScript definitions for authentication-related data structures
 */

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
//   firstName?: string; // Keep for backward compatibility
//   lastName?: string; // Keep for backward compatibility
  user_phone_number?: string;
  user_image_url?: string;
  profileImage?: string; // Keep for backward compatibility
  isEmailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  user_theme?: string;
  user_language?: string;
  user_timezone?: string;
  username?: string;
  user_address?: string;
  user_birthday?: string;
  user_cin?: string;
  user_country?: string;
  user_gender?: string;
}

export interface UserProfileUpdate {
  email: string;
  first_name: string;
  last_name: string;
  user_phone_number: string;
  user_address: string;
  user_birthday: string | Date | null;
  user_cin: string;
  user_country: string;
  user_gender: string;
  username: string;
  profile_image?: File | null | String;
  image_updated: boolean | String;
}

export interface LoginCredentials {
  email_or_username: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  username: string;
}

export interface SocialLoginCredentials {
  email: string;
  id_token: string;
  type_third_party: 'google' | 'facebook' | 'apple';
  from_platform: 'web' | 'android' | 'ios';
  selected_language?: string;
}

export interface SocialRegisterCredentials {
  email: string;
  id_token: string;
  type_third_party: 'google' | 'facebook' | 'apple';
  from_platform: 'web' | 'android' | 'ios';
  selected_language?: string;
  first_name: string;
  last_name: string;
  user_image_url?: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  success: boolean;
  message?: string;
  is_new_user?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
