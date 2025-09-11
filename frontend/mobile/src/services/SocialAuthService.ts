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
      const clientId = Platform.select({
        ios: config.social.google.iosClientId,
        android: config.social.google.androidClientId,
        default: config.social.google.webClientId,
      });

      if (!clientId) {
        console.error('Google client ID not configured for this platform');
        return;
      }

      await GoogleSignin.configure({
        webClientId: config.social.google.webClientId,
        iosClientId: config.social.google.iosClientId,
        offlineAccess: true,
        hostedDomain: '',
        forceCodeForRefreshToken: true,
      });

      this.isGoogleConfigured = true;
      console.log('Google Sign-In configured successfully');
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
      
      if (!signInResponse.data?.idToken) {
        throw new Error('No ID token received from Google');
      }

      const { data } = signInResponse;
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
      console.error('Google Sign-In Error:', error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error('Google Sign-In was cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error('Google Sign-In is already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services not available');
      } else {
        throw new Error('Google Sign-In failed');
      }
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
