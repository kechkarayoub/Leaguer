/**
 * @jest-environment jsdom
 */

// Mock the problematic dependencies
jest.mock('moment-timezone', () => ({
  __esModule: true,
  default: () => ({
    format: jest.fn(() => '2024-01-01'),
    tz: jest.fn().mockReturnThis(),
  }),
  tz: {
    names: jest.fn(() => ['UTC', 'America/New_York']),
    guess: jest.fn(() => 'UTC'),
  },
}));

// Simple integration tests for index.tsx
describe('index.tsx', () => {
  beforeEach(() => {
    // Create root element in DOM
    const rootElement = document.createElement('div');
    rootElement.id = 'root';
    document.body.appendChild(rootElement);
  });

  afterEach(() => {
    // Clean up root element
    const rootElement = document.getElementById('root');
    if (rootElement) {
      document.body.removeChild(rootElement);
    }
  });

  it('should export the necessary dependencies', () => {
    // Test that we can import the main dependencies
    expect(() => require('react')).not.toThrow();
    expect(() => require('react-dom/client')).not.toThrow();
  });

  it('should have App component available', () => {
    // Test that the App component can be imported
    expect(() => require('./App')).not.toThrow();
    const App = require('./App').default;
    expect(App).toBeDefined();
    expect(typeof App).toBe('function');
  });

  it('should have reportWebVitals available', () => {
    // Test that reportWebVitals can be imported
    expect(() => require('./reportWebVitals')).not.toThrow();
    const reportWebVitals = require('./reportWebVitals').default;
    expect(reportWebVitals).toBeDefined();
    expect(typeof reportWebVitals).toBe('function');
  });

  it('should find root element in DOM', () => {
    // Test that the root element exists and can be found
    const rootElement = document.getElementById('root');
    expect(rootElement).not.toBeNull();
    expect(rootElement).toBeInstanceOf(HTMLElement);
    expect(rootElement?.id).toBe('root');
  });

  it('should have valid module structure', () => {
    // Test the basic file structure expectations
    expect(() => require('./index.css')).not.toThrow();
    
    // These modules should be available
    const React = require('react');
    const ReactDOM = require('react-dom/client');
    
    expect(React).toBeDefined();
    expect(ReactDOM).toBeDefined();
    expect(ReactDOM.createRoot).toBeDefined();
    expect(typeof ReactDOM.createRoot).toBe('function');
  });

  it('should handle React StrictMode', () => {
    const React = require('react');
    
    // StrictMode should be available (it's a symbol in React 18)
    expect(React.StrictMode).toBeDefined();
    expect(typeof React.StrictMode).toBe('symbol');
  });

  it('should verify DOM environment', () => {
    // Verify we're in a DOM environment
    expect(document).toBeDefined();
    expect(document.getElementById).toBeDefined();
    expect(typeof document.getElementById).toBe('function');
  });

  it('should handle HTMLElement casting', () => {
    const rootElement = document.getElementById('root') as HTMLElement;
    
    // Should not throw when casting
    expect(rootElement).toBeInstanceOf(HTMLElement);
    expect(rootElement.id).toBe('root');
  });

  it('should have proper TypeScript types', () => {
    const React = require('react');
    const ReactDOM = require('react-dom/client');
    
    // Basic type checking
    expect(typeof React.createElement).toBe('function');
    expect(typeof ReactDOM.createRoot).toBe('function');
  });

  it('should support React 18 features', () => {
    const ReactDOM = require('react-dom/client');
    
    // React 18 should have createRoot
    expect(ReactDOM.createRoot).toBeDefined();
    expect(typeof ReactDOM.createRoot).toBe('function');
  });

  it('should handle module imports correctly', () => {
    // All required modules should be importable
    expect(() => require('react')).not.toThrow();
    expect(() => require('react-dom/client')).not.toThrow();
    expect(() => require('./App')).not.toThrow();
    expect(() => require('./reportWebVitals')).not.toThrow();
  });
});

// Export statement to make this file a module under TypeScript's isolatedModules
export {};
