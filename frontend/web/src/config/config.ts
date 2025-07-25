// React Web App Configuration
export interface Config {
  backendEndpoint: string;
  wsEndpoint: string;
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  app: {
    name: string;
    version: string;
  };
}

const config: Config = {
  backendEndpoint: process.env.REACT_APP_BACKEND_ENDPOINT || 'http://localhost:8000',
  wsEndpoint: process.env.REACT_APP_WS_BACKEND_HOST && process.env.REACT_APP_WS_BACKEND_PORT ? `ws://${process.env.REACT_APP_WS_BACKEND_HOST}:${process.env.REACT_APP_WS_BACKEND_PORT}` : 'ws://localhost:9000',
  firebase: {
    apiKey: process.env.REACT_APP_FIREBASE_WEB_API_KEY || '',
    authDomain: process.env.REACT_APP_FIREBASE_WEB_AUTH_DOMAIN || '',
    projectId: process.env.REACT_APP_FIREBASE_WEB_PROJECT_ID || '',
    storageBucket: process.env.REACT_APP_FIREBASE_WEB_STORAGE_BUCKET || '',
    messagingSenderId: process.env.REACT_APP_FIREBASE_WEB_MESSAGING_SENDER_ID || '',
    appId: process.env.REACT_APP_FIREBASE_WEB_APP_ID || '',
  },
  app: {
    name: process.env.REACT_APP_APP_NAME || 'Leaguer',
    version: process.env.REACT_APP_VERSION || '1.0.0',
  },
};

export default config;
