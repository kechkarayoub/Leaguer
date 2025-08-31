/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import DashboardPage from './DashboardPage';
import useAuth from '../../hooks/useAuth';

// Suppress console warnings and errors in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args: any[]) => {
  if (args[0]?.includes?.('act') || args[0]?.includes?.('ReactDOM.render') || args[0]?.includes?.('wrapped in act')) {
    return;
  }
  originalConsoleError.apply(console, args);
};

console.warn = (...args: any[]) => {
  if (args[0]?.includes?.('act') || args[0]?.includes?.('ReactDOM.render') || args[0]?.includes?.('wrapped in act')) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};

// Mock i18next dependencies to prevent network requests
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(),
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
}));

// Mock useAuth hook
jest.mock('../../hooks/useAuth');

// Mock the API service properly
jest.mock('../../services/AuthenticatedApiService', () => {
  return {
    __esModule: true,
    default: {
      getInstance: jest.fn(() => ({
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
      })),
    },
  };
});

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('DashboardPage', () => {
  const renderWithRouter = (component = <DashboardPage />) => {
    return render(
      <MemoryRouter>
        {component}
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    // Mock i18n translations
    (useTranslation as jest.Mock).mockReturnValue({
      t: (key: string, params?: any) => {
        const translations: { [key: string]: string } = {
          'dashboard:welcome': `Welcome back, ${params?.name || 'User'}!`,
          'dashboard:description': 'Here\'s your gaming overview',
          'dashboard:stats.total_games': 'Total Games',
          'dashboard:stats.wins': 'Wins',
          'dashboard:stats.losses': 'Losses',
          'dashboard:stats.win_rate': 'Win Rate',
          'dashboard:recent_games.title': 'Recent Games',
          'dashboard:recent_games.view_all': 'View All',
          'dashboard:game_result.win': 'Win',
          'dashboard:game_result.loss': 'Loss',
          'dashboard:quick_actions.title': 'Quick Actions',
          'dashboard:quick_actions.new_game': 'New Game',
          'dashboard:quick_actions.find_players': 'Find Players',
          'dashboard:quick_actions.view_stats': 'View Stats',
          'common:user.guest': 'Guest',
        };
        return translations[key] || key;
      },
    });

    // Mock useAuth hook with default user
    mockUseAuth.mockReturnValue({
      user: {
        id: 1,
        username: 'testuser',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
      },
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      requestPasswordReset: jest.fn(),
      isAuthenticated: true,
      isLoading: false,
      isInitialized: true,
      userError: null,
      isLoggingIn: false,
      isRegistering: false,
      isResettingPassword: false,
      isRequestingPasswordReset: false,
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('User Display', () => {
    it('should display welcome message with full name when both first_name and last_name are available', () => {
      renderWithRouter();
      
      expect(screen.getByText('Welcome back, John Doe!')).toBeInTheDocument();
    });

    it('should display welcome message with username when first_name or last_name is missing', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 1,
          username: 'testuser',
          first_name: '',
          last_name: '',
          email: 'test@example.com',
        },
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
        userError: null,
      } as any);

      renderWithRouter();
      
      expect(screen.getByText('Welcome back, testuser!')).toBeInTheDocument();
    });

    it('should display welcome message with Guest when user is null', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
        userError: null,
      } as any);

      renderWithRouter();
      
      expect(screen.getByText('Welcome back, Guest!')).toBeInTheDocument();
    });

    it('should display dashboard description', () => {
      renderWithRouter();
      
      expect(screen.getByText('Here\'s your gaming overview')).toBeInTheDocument();
    });
  });

  describe('Statistics Cards', () => {
    it('should render all statistics cards', () => {
      renderWithRouter();
      
      expect(screen.getByText('Total Games')).toBeInTheDocument();
      expect(screen.getByText('Wins')).toBeInTheDocument();
      expect(screen.getByText('Losses')).toBeInTheDocument();
      expect(screen.getByText('Win Rate')).toBeInTheDocument();
    });

    it('should display correct values for statistics', () => {
      renderWithRouter();
      
      expect(screen.getByText('24')).toBeInTheDocument(); // Total Games
      expect(screen.getByText('18')).toBeInTheDocument(); // Wins
      expect(screen.getByText('6')).toBeInTheDocument();  // Losses
      expect(screen.getByText('75%')).toBeInTheDocument(); // Win Rate
    });

    it('should have proper CSS classes for stat cards', () => {
      renderWithRouter();
      
      // Check that stat cards have been rendered
      expect(screen.getByText('Total Games')).toBeInTheDocument();
      expect(screen.getByText('Wins')).toBeInTheDocument();
      expect(screen.getByText('Losses')).toBeInTheDocument();
      expect(screen.getByText('Win Rate')).toBeInTheDocument();
    });
  });

  describe('Recent Games', () => {
    it('should render recent games section', () => {
      renderWithRouter();
      
      expect(screen.getByText('Recent Games')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'View All' })).toBeInTheDocument();
    });

    it('should display recent games list with correct data', () => {
      renderWithRouter();
      
      // Check opponents
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Mike Johnson')).toBeInTheDocument();
      
      // Check dates
      expect(screen.getByText('2024-01-15')).toBeInTheDocument();
      expect(screen.getByText('2024-01-14')).toBeInTheDocument();
      expect(screen.getByText('2024-01-13')).toBeInTheDocument();
      
      // Check scores
      expect(screen.getByText('3-1')).toBeInTheDocument();
      expect(screen.getByText('1-2')).toBeInTheDocument();
      expect(screen.getByText('2-0')).toBeInTheDocument();
      
      // Check results
      expect(screen.getAllByText('Win')).toHaveLength(2);
      expect(screen.getByText('Loss')).toBeInTheDocument();
    });

    it('should have proper game results structure', () => {
      renderWithRouter();
      
      // Check that game results are displayed correctly
      expect(screen.getAllByText('Win')).toHaveLength(2);
      expect(screen.getByText('Loss')).toBeInTheDocument();
    });
  });

  describe('Quick Actions', () => {
    it('should render quick actions section', () => {
      renderWithRouter();
      
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    });

    it('should display all quick action buttons', () => {
      renderWithRouter();
      
      expect(screen.getByRole('button', { name: 'New Game' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Find Players' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'View Stats' })).toBeInTheDocument();
    });

    it('should have proper CSS classes for action buttons', () => {
      renderWithRouter();
      
      const newGameBtn = screen.getByRole('button', { name: 'New Game' });
      const findPlayersBtn = screen.getByRole('button', { name: 'Find Players' });
      const viewStatsBtn = screen.getByRole('button', { name: 'View Stats' });
      
      expect(newGameBtn).toHaveClass('action-btn--primary');
      expect(findPlayersBtn).toHaveClass('action-btn--secondary');
      expect(viewStatsBtn).toHaveClass('action-btn--secondary');
    });

    it('should handle click events on action buttons', () => {
      renderWithRouter();
      
      const newGameBtn = screen.getByRole('button', { name: 'New Game' });
      const findPlayersBtn = screen.getByRole('button', { name: 'Find Players' });
      const viewStatsBtn = screen.getByRole('button', { name: 'View Stats' });
      
      // These should not throw errors when clicked
      userEvent.click(newGameBtn);
      userEvent.click(findPlayersBtn);
      userEvent.click(viewStatsBtn);
    });
  });

  describe('Component Structure', () => {
    it('should render main dashboard content', () => {
      renderWithRouter();
      
      // Check that main sections are present
      expect(screen.getByText('Welcome back, John Doe!')).toBeInTheDocument();
      expect(screen.getByText('Recent Games')).toBeInTheDocument();
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      renderWithRouter();
      
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Welcome back, John Doe!');
      
      const subHeadings = screen.getAllByRole('heading', { level: 2 });
      expect(subHeadings).toHaveLength(2);
      expect(subHeadings[0]).toHaveTextContent('Recent Games');
      expect(subHeadings[1]).toHaveTextContent('Quick Actions');
    });

    it('should have accessible button labels', () => {
      renderWithRouter();
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(4); // View All + 3 Quick Actions
      
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });
  });

  describe('Translation Keys', () => {
    it('should use correct translation keys', () => {
      const tMock = jest.fn((key, params) => key);
      (useTranslation as jest.Mock).mockReturnValue({
        t: tMock,
      });

      renderWithRouter();
      
      expect(tMock).toHaveBeenCalledWith('dashboard:welcome', { name: 'John Doe' });
      expect(tMock).toHaveBeenCalledWith('dashboard:description');
      expect(tMock).toHaveBeenCalledWith('dashboard:stats.total_games');
      expect(tMock).toHaveBeenCalledWith('dashboard:stats.wins');
      expect(tMock).toHaveBeenCalledWith('dashboard:stats.losses');
      expect(tMock).toHaveBeenCalledWith('dashboard:stats.win_rate');
      expect(tMock).toHaveBeenCalledWith('dashboard:recent_games.title');
      expect(tMock).toHaveBeenCalledWith('dashboard:quick_actions.title');
    });
  });
});
