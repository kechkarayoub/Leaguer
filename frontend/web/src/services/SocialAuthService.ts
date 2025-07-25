/**
 * SocialAuthService
 * 
 * Service for handling social media authentication (Google, Facebook, Apple)
 */

interface GoogleUser {
  id: string;
  sub?: string;
  name: string;
  email: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

interface SocialLoginResult {
  provider: 'google' | 'facebook' | 'apple';
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    picture?: string;
  };
  accessToken: string;
}

class SocialAuthService {
  private static instance: SocialAuthService;

  private constructor() {
    this.initializeGoogleSignIn();
  }

  public static getInstance(): SocialAuthService {
    if (!SocialAuthService.instance) {
      SocialAuthService.instance = new SocialAuthService();
    }
    return SocialAuthService.instance;
  }

  /**
   * Initialize Google Sign-In
   */
  private async initializeGoogleSignIn(): Promise<void> {
    if (!this.isGoogleLoginEnabled()) return;

    try {
      // Load Google Sign-In script
      await this.loadGoogleScript();
      
      // Initialize Google Sign-In
      window.google?.accounts.id.initialize({
        client_id: process.env.REACT_APP_GOOGLE_SIGN_IN_WEB_CLIENT_ID || '',
        callback: this.handleGoogleResponse.bind(this),
        auto_select: false,
        cancel_on_tap_outside: true,
      });
    } catch (error) {
      console.error('Failed to initialize Google Sign-In:', error);
    }
  }

  /**
   * Load Google Sign-In script
   */
  private loadGoogleScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.google) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Sign-In script'));
      document.head.appendChild(script);
    });
  }

  /**
   * Handle Google Sign-In response
   */
  private handleGoogleResponse(response: any): void {
    try {
      const payload = this.parseJwt(response.credential);
      const user: GoogleUser = payload;

      const result: SocialLoginResult = {
        provider: 'google',
        user: {
          id: user.id || user.sub || "",
          email: user.email,
          firstName: user.given_name || user.name?.split(' ')[0] || '',
          lastName: user.family_name || user.name?.split(' ').slice(1).join(' ') || '',
          picture: user.picture,
        },
        accessToken: response.credential,
      };

      // Trigger custom event for handling in components
      window.dispatchEvent(new CustomEvent('googleSignInSuccess', { detail: result }));
    } catch (error) {
      console.error('Failed to process Google Sign-In response:', error);
      window.dispatchEvent(new CustomEvent('googleSignInError', { detail: error }));
    }
  }

  /**
   * Parse JWT token
   */
  private parseJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error('Invalid JWT token');
    }
  }

  /**
   * Sign in with Google
   */
  public async signInWithGoogle(): Promise<void> {
    if (!this.isGoogleLoginEnabled()) {
      throw new Error('Google login is not enabled');
    }

    try {
      await this.loadGoogleScript();
      window.google?.accounts.id.prompt();
    } catch (error) {
      console.error('Google Sign-In failed:', error);
      throw error;
    }
  }

  /**
   * Sign in with Google using popup
   */
  public async signInWithGooglePopup(): Promise<void> {
    if (!this.isGoogleLoginEnabled()) {
      throw new Error('Google login is not enabled');
    }

    try {
      await this.loadGoogleScript();
      
      // Create and show Google One Tap
      window.google?.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fall back to popup
          this.showGooglePopup();
        }
      });
    } catch (error) {
      console.error('Google popup Sign-In failed:', error);
      throw error;
    }
  }

  /**
   * Show Google popup
   */
  private showGooglePopup(): void {
    const popup = window.open(
      `https://accounts.google.com/oauth/authorize?client_id=${process.env.REACT_APP_GOOGLE_SIGN_IN_WEB_CLIENT_ID}&redirect_uri=${window.location.origin}/auth/google/callback&response_type=code&scope=openid email profile`,
      'googleSignIn',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );

    // Check if popup is closed
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed);
        window.dispatchEvent(new CustomEvent('googleSignInCancelled'));
      }
    }, 1000);
  }

  /**
   * Check if Google login is enabled
   */
  public isGoogleLoginEnabled(): boolean {
    console.log('Checking Google login enabled:', process.env.REACT_APP_ENABLE_GOOGLE_LOGIN, process.env.REACT_APP_GOOGLE_SIGN_IN_WEB_CLIENT_ID);
    return process.env.REACT_APP_ENABLE_GOOGLE_LOGIN === 'true' && 
           !!process.env.REACT_APP_GOOGLE_SIGN_IN_WEB_CLIENT_ID;
  }

  /**
   * Check if Facebook login is enabled
   */
  public isFacebookLoginEnabled(): boolean {
    return process.env.REACT_APP_ENABLE_FACEBOOK_LOGIN === 'true' && 
           !!process.env.REACT_APP_FACEBOOK_SIGN_IN_WEB_CLIENT_ID;
  }

  /**
   * Check if Apple login is enabled
   */
  public isAppleLoginEnabled(): boolean {
    return process.env.REACT_APP_ENABLE_APPLE_LOGIN === 'true' && 
           !!process.env.REACT_APP_APPLE_SIGN_IN_WEB_CLIENT_ID;
  }

  /**
   * Get available social login providers
   */
  public getAvailableProviders(): string[] {
    const providers: string[] = [];
    
    if (this.isGoogleLoginEnabled()) providers.push('google');
    if (this.isFacebookLoginEnabled()) providers.push('facebook');
    if (this.isAppleLoginEnabled()) providers.push('apple');
    
    return providers;
  }
}

// Global type declarations
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          renderButton: (element: HTMLElement, config: any) => void;
        };
      };
    };
  }
}

export default SocialAuthService;
