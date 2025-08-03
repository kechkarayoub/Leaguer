
import { Dict } from 'styled-components/dist/types';
import HomeIcon from '../components/icons/HomeIcon';
import SettingsIcon from '../components/icons/SettingsIcon';

/**
 * Utility function to get menu items based on user permissions
 * 
 * @param user - User object containing permissions
 * @param t - Translation function
 * @returns Array of menu items
 */
export const getMenuItems = (user: Dict, t: (key: string) => string) => {
  const menuItems = [
    {
      key: 'home',
      label: t('navigation:home'),
      path: '/',
      icon: HomeIcon,
    },
  ];

  if (user?.isAdmin) {
  }
  
  menuItems.push({
    key: 'settings',
    label: t('navigation:settings'),
    path: '/settings',
    icon: SettingsIcon,
  });

  return menuItems;
};

