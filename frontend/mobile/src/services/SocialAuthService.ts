/**
 * Social Authentication Service
 * 
 * Handles social media authentication (Google, Facebook, Apple) for React Native
 */

import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

import config from '../config/config';

export interface SocialUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  photo?: string;
}

export interface SocialAuthResult {
  provider: 'google' | 'facebook' | 'apple';
  user: SocialUser;
  idToken: string;
  accessToken?: string;
}

class SocialAuthService {
  private static instance: SocialAuthService;
  private isGoogleConfigured = false;

  private constructor() {
    this.initializeServices();
  }

  public static getInstance(): SocialAuthService {
    if (!SocialAuthService.instance) {
      SocialAuthService.instance = new SocialAuthService();
    }
    return SocialAuthService.instance;
  }

  /**
   * Initialize social auth services
   */
  private async initializeServices(): Promise<void> {
    await this.initializeGoogle();
  }

  /**
   * Initialize Google Sign-In
   */
  private async initializeGoogle(): Promise<void> {
    if (!config.features.enableGoogleLogin) {
      console.log('Google Sign-In is disabled');
      return;
    }

    try {
      const webClientId = config.social.google.webClientId;
      if (!webClientId || !/\.apps\.googleusercontent\.com$/.test(webClientId)) {
        console.error(
          'Google webClientId is missing or invalid. Expected an OAuth client ID ending with ".apps.googleusercontent.com". Check REACT_APP_GOOGLE_SIGN_IN_WEB_CLIENT_ID in .env.'
        );
        this.isGoogleConfigured = false;
        return;
      }

      await GoogleSignin.configure({
        webClientId,
        iosClientId: config.social.google.iosClientId,
        offlineAccess: true,
        hostedDomain: '',
        forceCodeForRefreshToken: true,
      });

      this.isGoogleConfigured = true;
      const masked = webClientId.replace(/^[^-.]+/, '***');
      console.log('Google Sign-In configured successfully with webClientId:', masked);
    } catch (error) {
      console.error('Failed to configure Google Sign-In:', error);
      this.isGoogleConfigured = false;
    }
  }

  /**
   * Check if Google Sign-In is available
   */
  public isGoogleSignInAvailable(): boolean {
    return config.features.enableGoogleLogin && this.isGoogleConfigured;
  }

  /**
   * Check if Facebook Sign-In is available
   */
  public isFacebookSignInAvailable(): boolean {
    return config.features.enableFacebookLogin;
  }

  /**
   * Check if Apple Sign-In is available
   */
  public isAppleSignInAvailable(): boolean {
    return config.features.enableAppleLogin && Platform.OS === 'ios';
  }

  /**
   * Get available social login providers
   */
  public getAvailableProviders(): string[] {
    const providers: string[] = [];
    
    if (this.isGoogleSignInAvailable()) providers.push('google');
    if (this.isFacebookSignInAvailable()) providers.push('facebook');
    if (this.isAppleSignInAvailable()) providers.push('apple');
    
    return providers;
  }

  /**
   * Sign in with Google
   */
  public async signInWithGoogle(): Promise<SocialAuthResult> {
    if (!this.isGoogleSignInAvailable()) {
      throw new Error('Google Sign-In is not available');
    }

    try {
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Get the user's sign in response
      const signInResponse = await GoogleSignin.signIn();
      console.log('Google Sign-In response:', signInResponse);
      if (!signInResponse.data?.idToken) {
        throw new Error('No ID token received from Google');
      }

      const { data } = signInResponse;
      console.log('Google Sign-In data:', data);
      const { idToken, user } = data;

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      
      // Sign-in the user with the credential
      const userCredential = await auth().signInWithCredential(googleCredential);
      
      // Extract user information
      const firebaseUser = userCredential.user;
      const nameParts = user.name?.split(' ') || [];
      
      const socialUser: SocialUser = {
        id: user.id,
        email: user.email,
        firstName: user.givenName || nameParts[0] || '',
        lastName: user.familyName || nameParts.slice(1).join(' ') || '',
        name: user.name || '',
        photo: user.photo || undefined,
      };

      return {
        provider: 'google',
        user: socialUser,
        idToken: idToken || '',
        accessToken: await firebaseUser.getIdToken(),
      };
    } catch (error: any) {
      // Log full error object for debugging
      try {
        const full = JSON.stringify(error, Object.getOwnPropertyNames(error));
        console.error('Google Sign-In Error (full):', full);
      } catch {
        console.error('Google Sign-In Error:', error);
      }

      // Map known error codes to actionable messages
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error('Google Sign-In was cancelled');
      }
      if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error('Google Sign-In is already in progress');
      }
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services not available');
      }
      // Common Android misconfig errors
      if (error.code === 'DEVELOPER_ERROR' || error.code === 10) {
        throw new Error('Google Sign-In misconfiguration (DEVELOPER_ERROR). Ensure debug SHA-1/SH-256 are added to Firebase and webClientId matches your project.');
      }
      if (error.code === '12500') {
        throw new Error('Google Sign-In failed (12500). This often means an OAuth client ID mismatch or missing SHA-1 in Firebase.');
      }

      // Fallback: include upstream message when present
      throw new Error(error?.message || 'Google Sign-In failed');
    }
  }

  /**
   * Sign in with Facebook (placeholder)
   */
  public async signInWithFacebook(): Promise<SocialAuthResult> {
    throw new Error('Facebook Sign-In not implemented yet');
  }

  /**
   * Sign in with Apple (placeholder)
   */
  public async signInWithApple(): Promise<SocialAuthResult> {
    throw new Error('Apple Sign-In not implemented yet');
  }

  /**
   * Sign out from all social providers
   */
  public async signOut(): Promise<void> {
    try {
      // Sign out from Firebase
      await auth().signOut();
      
      // Sign out from Google if available
      if (this.isGoogleSignInAvailable()) {
        await GoogleSignin.signOut();
      }
      
      console.log('Signed out from all social providers');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  /**
   * Get current Firebase user
   */
  public getCurrentUser(): FirebaseAuthTypes.User | null {
    return auth().currentUser;
  }

  /**
   * Check if user is signed in
   */
  public isSignedIn(): boolean {
    return auth().currentUser !== null;
  }
}

export default SocialAuthService;
