// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Suppress React Router future flag warnings in tests
const originalConsoleWarn = console.warn;
console.warn = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('React Router Future Flag Warning')
  ) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};

// Suppress JSDOM network errors in tests
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('AggregateError') ||
     args[0].includes('xhr-utils') ||
     args[0].includes('XMLHttpRequest'))
  ) {
    return;
  }
  if (
    args[0] instanceof Error &&
    args[0].name === 'AggregateError'
  ) {
    return;
  }
  originalConsoleError.apply(console, args);
};

// Mock i18next HTTP backend to prevent network requests
jest.mock('i18next-http-backend', () => {
  return {
    __esModule: true,
    default: class MockHttpBackend {
      static type = 'backend';
      init() {}
      read(language: string, namespace: string, callback: Function) {
        // Return empty translations to prevent network requests
        callback(null, {});
      }
    }
  };
});

// Mock fetch to prevent network requests during tests
Object.defineProperty(window, 'fetch', {
  writable: true,
  value: jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
    })
  ),
});

// Prevent actual HTTP requests during tests
global.XMLHttpRequest = jest.fn(() => ({
  open: jest.fn(),
  send: jest.fn(),
  abort: jest.fn(),
  setRequestHeader: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
})) as any;
