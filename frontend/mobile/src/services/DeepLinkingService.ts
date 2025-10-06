/**
 * Deep Linking Service
 * 
 * Handles deep linking and URL parsing for the mobile app
 */

import { Linking } from 'react-native';
import { NavigationContainerRef } from '@react-navigation/native';

interface ResetPasswordParams {
  uid: string;
  token: string;
}

interface EmailVerificationParams {
  uid: string;
  token: string;
}

class DeepLinkingService {
  private navigationRef: React.RefObject<NavigationContainerRef<any> | null> | null = null;
  private pendingUrl: string | null = null;
  private isNavigationReady = false;
  private isAuthenticated: boolean = false;
  private logoutFunction: (() => Promise<void>) | null = null;

  setNavigationRef(ref: React.RefObject<NavigationContainerRef<any> | null>) {
    this.navigationRef = ref;
  }

  setAuthState(isAuthenticated: boolean, logoutFunction: () => Promise<void>) {
    this.isAuthenticated = isAuthenticated;
    this.logoutFunction = logoutFunction;
  }

  onNavigationReady() {
    this.isNavigationReady = true;
    // Handle any pending URL that came in before navigation was ready
    if (this.pendingUrl) {
      this.handleUrl(this.pendingUrl);
      this.pendingUrl = null;
    }
  }

  /**
   * Parse URL and extract reset password parameters
   */
  parseResetPasswordUrl(url: string): ResetPasswordParams | null {
    try {
      const urlObj = new URL(url);
      const uid = urlObj.searchParams.get('uid');
      const token = urlObj.searchParams.get('token');

      if (uid && token) {
        return { uid, token };
      }
    } catch (error) {
      console.error('Failed to parse URL:', error);
    }
    
    return null;
  }

  /**
   * Parse URL and extract email verification parameters
   */
  parseEmailVerificationUrl(url: string): EmailVerificationParams | null {
    try {
      const urlObj = new URL(url);
      const uid = urlObj.searchParams.get('uid');
      const token = urlObj.searchParams.get('token');

      if (uid && token) {
        return { uid, token };
      }
    } catch (error) {
      console.error('Failed to parse email verification URL:', error);
    }
    
    return null;
  }

  /**
   * Handle incoming URL
   */
  async handleUrl(url: string) {
    console.log('Handling deep link URL:', url);

    // If navigation isn't ready yet, store the URL for later
    if (!this.isNavigationReady || !this.navigationRef?.current) {
      console.log('Navigation not ready, storing URL for later:', url);
      this.pendingUrl = url;
      return;
    }

    // Check if it's a reset password URL
    if (url.includes('/auth/reset-password')) {
      const params = this.parseResetPasswordUrl(url);
      
      if (params) {
        // If user is authenticated, logout first then navigate
        if (this.isAuthenticated && this.logoutFunction) {
          console.log('User is authenticated, logging out before reset password');
          try {
            await this.logoutFunction();
            // Wait a bit for logout to complete and navigation to update
            setTimeout(() => {
              this.navigateToResetPassword(params);
            }, 500);
          } catch (error) {
            console.error('Failed to logout before reset password:', error);
            // Still try to navigate even if logout fails
            this.navigateToResetPassword(params);
          }
        } else {
          // User not authenticated, navigate directly
          this.navigateToResetPassword(params);
        }
      }
    }
    // Check if it's an email verification URL
    else if (url.includes('/verify-email')) {
      const params = this.parseEmailVerificationUrl(url);
      
      if (params) {
        // If user is authenticated, logout first then navigate
        if (this.isAuthenticated && this.logoutFunction) {
          console.log('User is authenticated, logging out before email verification');
          try {
            await this.logoutFunction();
            // Wait a bit for logout to complete and navigation to update
            setTimeout(() => {
              this.navigateToEmailVerification(params);
            }, 500);
          } catch (error) {
            console.error('Failed to logout before email verification:', error);
            // Still try to navigate even if logout fails
            this.navigateToEmailVerification(params);
          }
        } else {
          // User not authenticated, navigate directly
          this.navigateToEmailVerification(params);
        }
      }
    }
  }

  private navigateToResetPassword(params: ResetPasswordParams) {
    // Wait a bit to ensure navigation is fully initialized
    setTimeout(() => {
      if (this.navigationRef?.current) {
        console.log('Navigating to ResetPassword with params:', params);
        try {
          this.navigationRef.current.navigate('AuthStack', {
            screen: 'ResetPassword',
            params: {
              uid: params.uid,
              token: params.token,
            },
          });
        } catch (error) {
          console.error('Navigation error:', error);
        }
      }
    }, 100);
  }

  private navigateToEmailVerification(params: EmailVerificationParams) {
    // Wait a bit to ensure navigation is fully initialized
    setTimeout(() => {
      if (this.navigationRef?.current) {
        console.log('Navigating to VerifyEmail with params:', params);
        try {
          this.navigationRef.current.navigate('AuthStack', {
            screen: 'VerifyEmail',
            params: {
              uid: params.uid,
              token: params.token,
            },
          });
        } catch (error) {
          console.error('Navigation error:', error);
        }
      }
    }, 100);
  }

  /**
   * Initialize deep linking listeners
   */
  init() {
    // Handle initial URL if app was opened from a link
    Linking.getInitialURL().then((url) => {
      if (url) {
        this.handleUrl(url);
      }
    });

    // Handle URLs when app is already running
    const subscription = Linking.addEventListener('url', (event) => {
      this.handleUrl(event.url);
    });

    return () => {
      subscription?.remove();
    };
  }
}

export default new DeepLinkingService();