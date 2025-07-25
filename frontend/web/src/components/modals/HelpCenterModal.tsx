/**
 * HelpCenterModal Component
 * 
 * Modal displaying help center with FAQ sections, support categories, and search functionality
 */

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import BaseModal from './BaseModal';
import leaguerLogo from '../../logo.png';

interface HelpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactSupport: () => void;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface SupportCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactElement;
}

const HelpCenterModal: React.FC<HelpCenterModalProps> = ({ isOpen, onClose, onContactSupport }) => {
  const { t } = useTranslation();
  
  // State for search and category filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  // Get support email from environment variables
  const supportEmail = process.env.REACT_APP_SUPPORT_EMAIL || 'support@leaguer.com';

  // Support categories
  const supportCategories: SupportCategory[] = [
    {
      id: 'all',
      name: t('common:helpCenter.allCategories', { defaultValue: 'All Categories' }),
      description: t('common:helpCenter.allCategories', { defaultValue: 'Browse all help topics' }),
      icon: (
        <svg viewBox="0 0 24 24" className="help-category-icon">
          <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M11,16.5L6.5,12L7.91,10.59L11,13.67L16.59,8.09L18,9.5L11,16.5Z" fill="currentColor"/>
        </svg>
      )
    },
    {
      id: 'account',
      name: t('common:helpCenter.categories.accountSettings', { defaultValue: 'Account Settings' }),
      description: t('common:helpCenter.categories.accountSettings', { defaultValue: 'Account settings, profile management' }),
      icon: (
        <svg viewBox="0 0 24 24" className="help-category-icon">
          <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" fill="currentColor"/>
        </svg>
      )
    },
    {
      id: 'leagues',
      name: t('common:helpCenter.categories.teamsManagement', { defaultValue: 'Teams Management' }),
      description: t('common:helpCenter.categories.teamsManagement', { defaultValue: 'Creating and managing teams' }),
      icon: (
        <svg viewBox="0 0 24 24" className="help-category-icon">
          <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,12.5A1.5,1.5 0 0,0 10.5,11A1.5,1.5 0 0,0 9,12.5A1.5,1.5 0 0,0 10.5,14A1.5,1.5 0 0,0 12,12.5M12,7.5A1.5,1.5 0 0,0 10.5,6A1.5,1.5 0 0,0 9,7.5A1.5,1.5 0 0,0 10.5,9A1.5,1.5 0 0,0 12,7.5M18,12.5A1.5,1.5 0 0,0 16.5,11A1.5,1.5 0 0,0 15,12.5A1.5,1.5 0 0,0 16.5,14A1.5,1.5 0 0,0 18,12.5M6,7.5A1.5,1.5 0 0,0 4.5,6A1.5,1.5 0 0,0 3,7.5A1.5,1.5 0 0,0 4.5,9A1.5,1.5 0 0,0 6,7.5Z" fill="currentColor"/>
        </svg>
      )
    },
    {
      id: 'technical',
      name: t('common:helpCenter.categories.troubleshooting', { defaultValue: 'Troubleshooting' }),
      description: t('common:helpCenter.categories.troubleshooting', { defaultValue: 'App problems, bugs, connectivity' }),
      icon: (
        <svg viewBox="0 0 24 24" className="help-category-icon">
          <path d="M22.7,19L13.6,9.9C14.5,7.6 14,4.9 12.1,3C10.1,1 7.1,0.6 4.7,1.7L9,6L6,9L1.6,4.7C0.4,7.1 0.9,10.1 2.9,12.1C4.8,14 7.5,14.5 9.8,13.6L18.9,22.7C19.3,23.1 19.9,23.1 20.3,22.7L22.6,20.4C23.1,20 23.1,19.3 22.7,19Z" fill="currentColor"/>
        </svg>
      )
    },
    {
      id: 'billing',
      name: t('common:helpCenter.categories.billingPayments', { defaultValue: 'Billing & Payments' }),
      description: t('common:helpCenter.categories.billingPayments', { defaultValue: 'Subscriptions, payments, invoices' }),
      icon: (
        <svg viewBox="0 0 24 24" className="help-category-icon">
          <path d="M11.8,10.9C9.53,10.31 8.8,9.7 8.8,8.75C8.8,7.66 9.81,6.9 11.5,6.9C13.28,6.9 13.94,7.75 14,9H16.21C16.14,7.28 15.09,5.7 13,5.19V3H10V5.16C8.06,5.58 6.5,6.84 6.5,8.77C6.5,11.08 8.41,12.23 11.2,12.9C13.7,13.5 14.2,14.38 14.2,15.31C14.2,16 13.71,17.1 11.5,17.1C9.44,17.1 8.63,16.18 8.5,15H6.32C6.44,17.19 8.08,18.42 10,18.83V21H13V18.85C14.95,18.5 16.5,17.35 16.5,15.3C16.5,12.46 14.07,11.5 11.8,10.9Z" fill="currentColor"/>
        </svg>
      )
    },
    {
      id: 'mobile',
      name: t('common:helpCenter.categories.gettingStarted', { defaultValue: 'Getting Started' }),
      description: t('common:helpCenter.categories.gettingStarted', { defaultValue: 'Getting started and setup guides' }),
      icon: (
        <svg viewBox="0 0 24 24" className="help-category-icon">
          <path d="M17,19H7V5H17M17,1H7C5.89,1 5,1.89 5,3V21A2,2 0 0,0 7,23H17A2,2 0 0,0 19,21V3C19,1.89 18.1,1 17,1Z" fill="currentColor"/>
        </svg>
      )
    }
  ];

  // FAQ items
  const faqItems: FAQItem[] = [
    // Account & Profile FAQs
    {
      id: 'account-1',
      category: 'account',
      question: t('common:helpCenter.faqs.accountSettings.changePassword.question', { defaultValue: 'How do I change my password?' }),
      answer: t('common:helpCenter.faqs.accountSettings.changePassword.answer', { 
        defaultValue: 'Go to your Account Settings, click on Security, and select Change Password. You will need to enter your current password and then create a new one.' 
      })
    },
    {
      id: 'account-2',
      category: 'account',
      question: t('common:helpCenter.faqs.accountSettings.updateEmail.question', { defaultValue: 'How do I update my email address?' }),
      answer: t('common:helpCenter.faqs.accountSettings.updateEmail.answer', { 
        defaultValue: 'In your Account Settings, go to Personal Information and click Edit next to your email address. You will need to verify the new email address before the change takes effect.' 
      })
    },
    {
      id: 'account-3',
      category: 'account',
      question: t('common:helpCenter.faqs.privacySecurity.deleteAccount.question', { defaultValue: 'How do I delete my account?' }),
      answer: t('common:helpCenter.faqs.privacySecurity.deleteAccount.answer', { 
        defaultValue: 'To delete your account, go to Account Settings, select Privacy & Security, and click Delete Account. Note that this action is permanent and cannot be undone.' 
      })
    },
    
    // Teams Management FAQs
    {
      id: 'leagues-1',
      category: 'leagues',
      question: t('common:helpCenter.faqs.teamsManagement.createTeam.question', { defaultValue: 'How do I create a new team?' }),
      answer: t('common:helpCenter.faqs.teamsManagement.createTeam.answer', { 
        defaultValue: 'Go to your dashboard and click Create Team. Fill in your team details including name, sport, location, and team description. You can then invite players to join your team.' 
      })
    },
    {
      id: 'leagues-2',
      category: 'leagues',
      question: t('common:helpCenter.faqs.gettingStarted.howToJoinTeam.question', { defaultValue: 'How do I join a team?' }),
      answer: t('common:helpCenter.faqs.gettingStarted.howToJoinTeam.answer', { 
        defaultValue: 'You can join a team by receiving an invitation from a team manager or by searching for public teams in your area. Go to Teams in your dashboard and use the search function or browse available teams.' 
      })
    },
    {
      id: 'leagues-3',
      category: 'leagues',
      question: t('common:helpCenter.faqs.teamsManagement.manageRoster.question', { defaultValue: 'How do I manage my team roster?' }),
      answer: t('common:helpCenter.faqs.teamsManagement.manageRoster.answer', { 
        defaultValue: 'In your team management panel, you can view all team members, assign roles (captain, co-captain), manage player status (active, inactive), and remove players if necessary.' 
      })
    },
    
    // Technical Issues FAQs
    {
      id: 'technical-1',
      category: 'technical',
      question: t('common:helpCenter.faqs.troubleshooting.performanceIssues.question', { defaultValue: 'The app is running slowly' }),
      answer: t('common:helpCenter.faqs.troubleshooting.performanceIssues.answer', { 
        defaultValue: 'Try refreshing the page or restarting the app. Clear your browser cache and ensure you have a stable internet connection. If problems persist, try using a different browser or updating your current one.' 
      })
    },
    {
      id: 'technical-2',
      category: 'technical',
      question: t('common:helpCenter.faqs.troubleshooting.notificationsNotWorking.question', { defaultValue: 'I\'m not receiving notifications' }),
      answer: t('common:helpCenter.faqs.troubleshooting.notificationsNotWorking.answer', { 
        defaultValue: 'Check your notification settings to ensure they are enabled. Also verify your email address is correct and check your spam/junk folder. For mobile notifications, ensure the app has permission to send notifications.' 
      })
    },
    {
      id: 'technical-3',
      category: 'technical',
      question: t('common:helpCenter.faqs.troubleshooting.loginIssues.question', { defaultValue: 'I can\'t log into my account' }),
      answer: t('common:helpCenter.faqs.troubleshooting.loginIssues.answer', { 
        defaultValue: 'First, check that you are using the correct email and password. If you have forgotten your password, use the Forgot Password link. If issues persist, clear your browser cache or try a different browser.' 
      })
    },
    
    // Billing & Payments FAQs
    {
      id: 'billing-1',
      category: 'billing',
      question: t('common:helpCenter.faqs.billingPayments.subscriptionPlans.question', { defaultValue: 'What subscription plans are available?' }),
      answer: t('common:helpCenter.faqs.billingPayments.subscriptionPlans.answer', { 
        defaultValue: 'We offer Free, Premium, and Team plans. The Free plan includes basic features, Premium adds advanced analytics and priority support, while Team plans include additional management tools and higher limits.' 
      })
    },
    {
      id: 'billing-2',
      category: 'billing',
      question: t('common:helpCenter.faqs.billingPayments.refundPolicy.question', { defaultValue: 'What is your refund policy?' }),
      answer: t('common:helpCenter.faqs.billingPayments.refundPolicy.answer', { 
        defaultValue: 'We offer a 30-day money-back guarantee for all paid subscriptions. If you are not satisfied, contact our support team within 30 days of your purchase for a full refund.' 
      })
    },
    {
      id: 'billing-3',
      category: 'billing',
      question: t('common:helpCenter.faqs.billingPayments.changePaymentMethod.question', { defaultValue: 'How do I update my payment method?' }),
      answer: t('common:helpCenter.faqs.billingPayments.changePaymentMethod.answer', { 
        defaultValue: 'Go to your Account Settings, select Billing, and click Payment Methods. You can add a new card, update existing payment information, or set a different card as your primary payment method.' 
      })
    },
    
    // Getting Started FAQs
    {
      id: 'mobile-1',
      category: 'mobile',
      question: t('common:helpCenter.faqs.gettingStarted.howToCreateAccount.question', { defaultValue: 'How do I create an account?' }),
      answer: t('common:helpCenter.faqs.gettingStarted.howToCreateAccount.answer', { 
        defaultValue: 'To create an account, click on the Sign Up button in the top right corner of our homepage. Fill in your email, create a password, and verify your email address to get started.' 
      })
    },
    {
      id: 'mobile-2',
      category: 'mobile',
      question: t('common:helpCenter.faqs.gettingStarted.profileSetup.question', { defaultValue: 'How do I set up my profile?' }),
      answer: t('common:helpCenter.faqs.gettingStarted.profileSetup.answer', { 
        defaultValue: 'After creating your account, go to your profile settings to add your personal information, sports preferences, skill level, and profile picture. A complete profile helps other players and teams find you.' 
      })
    },
    
    // Privacy & Security FAQs
    {
      id: 'privacy-1',
      category: 'privacy',
      question: t('common:helpCenter.faqs.privacySecurity.dataProtection.question', { defaultValue: 'How do you protect my personal data?' }),
      answer: t('common:helpCenter.faqs.privacySecurity.dataProtection.answer', { 
        defaultValue: 'We use industry-standard encryption and security measures to protect your data. We never sell your personal information and only share data as outlined in our Privacy Policy.' 
      })
    },
    {
      id: 'privacy-2',
      category: 'privacy',
      question: t('common:helpCenter.faqs.privacySecurity.whoCanSeeProfile.question', { defaultValue: 'Who can see my profile information?' }),
      answer: t('common:helpCenter.faqs.privacySecurity.whoCanSeeProfile.answer', { 
        defaultValue: 'You can control your profile visibility in Privacy Settings. You can choose to make your profile public, visible to team members only, or completely private.' 
      })
    }
  ];

  // Filter FAQs based on search and category
  const filteredFAQs = useMemo(() => {
    let filtered = faqItems;
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(faq => faq.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(faq => 
        faq.question.toLowerCase().includes(query) || 
        faq.answer.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [searchQuery, selectedCategory]);

  // Toggle FAQ expansion
  const toggleFAQ = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  // Reset filters when modal closes
  const handleClose = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setExpandedFAQ(null);
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('common:helpCenter.title', { defaultValue: 'Help Center' })}
      size="large"
    >
      <div className="help-center-modal-content">
        {/* Hero Section */}
        <div className="modal-section">
          <div className="modal-hero">
            <div className="modal-hero-logo">
              <img 
                src={leaguerLogo} 
                alt="Leaguer Logo" 
                className="modal-hero-logo-img"
              />
            </div>
            <h3 className="modal-hero-title">
              {t('common:helpCenter.title', { defaultValue: 'Help Center' })}
            </h3>
            <p className="modal-hero-subtitle">
              {t('common:helpCenter.searchPlaceholder', { 
                defaultValue: 'Search for help...' 
              })}
            </p>
          </div>
        </div>

        {/* Search Section */}
        <div className="modal-section">
          <div className="help-search-container">
            <div className="help-search-box">
              <svg viewBox="0 0 24 24" className="help-search-icon">
                <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" fill="currentColor"/>
              </svg>
              <input
                type="text"
                placeholder={t('common:helpCenter.searchPlaceholder', { defaultValue: 'Search for help...' })}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="help-search-input"
              />
            </div>
          </div>
        </div>

        {/* Categories Section */}
        <div className="modal-section">
          <h4 className="modal-section-title">
            {t('common:helpCenter.allCategories', { defaultValue: 'All Categories' })}
          </h4>
          <div className="help-categories-grid">
            {supportCategories.map(category => (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setExpandedFAQ(null);
                }}
                className={`help-category-card ${selectedCategory === category.id ? 'active' : ''}`}
              >
                <div className="help-category-icon-container">
                  {category.icon}
                </div>
                <h5 className="help-category-name">{category.name}</h5>
                <p className="help-category-description">{category.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="modal-section">
          <div className="help-faq-header">
            <h4 className="modal-section-title">
              {selectedCategory === 'all' 
                ? t('common:helpCenter.popularArticles', { defaultValue: 'Popular Articles' })
                : supportCategories.find(c => c.id === selectedCategory)?.name
              }
            </h4>
            {searchQuery && (
              <p className="help-search-results">
                {filteredFAQs.length} {t('common:helpCenter.searchResults', { 
                  defaultValue: 'results found'
                })}
              </p>
            )}
          </div>

          {filteredFAQs.length > 0 ? (
            <div className="help-faq-list">
              {filteredFAQs.map(faq => (
                <div key={faq.id} className="help-faq-item">
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className="help-faq-question"
                  >
                    <span className="help-faq-question-text">{faq.question}</span>
                    <svg 
                      viewBox="0 0 24 24" 
                      className={`help-faq-chevron ${expandedFAQ === faq.id ? 'expanded' : ''}`}
                    >
                      <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z" fill="currentColor"/>
                    </svg>
                  </button>
                  {expandedFAQ === faq.id && (
                    <div className="help-faq-answer">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="help-no-results">
              <svg viewBox="0 0 24 24" className="help-no-results-icon">
                <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M13,17H11V15H13V17M13,13H11V7H13V13Z" fill="currentColor"/>
              </svg>
              <h5 className="help-no-results-title">
                {t('common:helpCenter.noResults', { defaultValue: 'No articles found for your search.' })}
              </h5>
              <p className="help-no-results-text">
                {t('common:helpCenter.noResultsSuggestion', { 
                  defaultValue: 'Try different keywords or check out our popular articles below.' 
                })}
              </p>
            </div>
          )}
        </div>

        {/* Contact Support Section */}
        <div className="modal-section">
          <div className="help-contact-support">
            <div className="help-contact-support-content">
              <h4 className="help-contact-support-title">
                {t('common:helpCenter.contactSupport.title', { defaultValue: 'Need More Help?' })}
              </h4>
              <p className="help-contact-support-text">
                {t('common:helpCenter.contactSupport.description', { 
                  defaultValue: 'Can\'t find what you\'re looking for? Our support team is here to help you with any questions or issues.' 
                })}
              </p>
              <div className="help-contact-support-actions">
                <a 
                  href={`mailto:${supportEmail}`}
                  className="help-contact-support-button primary"
                >
                  <svg viewBox="0 0 24 24" className="help-contact-support-icon">
                    <path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z" fill="currentColor"/>
                  </svg>
                  {t('common:helpCenter.contactSupport.button', { defaultValue: 'Contact Support' })}
                </a>
                <button
                  onClick={() => {
                    handleClose();
                    onContactSupport();
                  }}
                  className="help-contact-support-button secondary"
                >
                  <svg viewBox="0 0 24 24" className="help-contact-support-icon">
                    <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z" fill="currentColor"/>
                  </svg>
                  {t('common:helpCenter.contactSupport.button', { defaultValue: 'Contact Support' })}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export default HelpCenterModal;
