/**
 * AccessibilitySettings Component Tests
 * Tests for accessibility features and keyboard navigation
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { AccessibilitySettings } from '../AccessibilitySettings';

// Mock i18n
jest.mock('../../../utils/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'settings.enableScreenReader': 'Enable Screen Reader',
        'settings.enableKeyboardNavigation': 'Enable Keyboard Navigation',
        'settings.enableHighContrast': 'Enable High Contrast',
        'settings.enableReducedMotion': 'Enable Reduced Motion',
        'settings.screenReaderDescription': 'Enhanced support for screen readers with ARIA labels',
        'settings.keyboardNavigationDescription': 'Full keyboard navigation support',
        'settings.highContrastDescription': 'High contrast colors for better visibility',
        'settings.reducedMotionDescription': 'Reduce animations and transitions',
      };
      return translations[key] || key;
    },
  }),
}));

describe('AccessibilitySettings Component', () => {
  const defaultProps = {
    enableScreenReader: false,
    enableKeyboardNavigation: true,
    enableHighContrast: false,
    enableReducedMotion: false,
    onScreenReaderChange: jest.fn(),
    onKeyboardNavigationChange: jest.fn(),
    onHighContrastChange: jest.fn(),
    onReducedMotionChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all accessibility features', () => {
      render(<AccessibilitySettings {...defaultProps} />);
      
      expect(screen.getByText('Enable Screen Reader')).toBeInTheDocument();
      expect(screen.getByText('Enable Keyboard Navigation')).toBeInTheDocument();
      expect(screen.getByText('Enable High Contrast')).toBeInTheDocument();
      expect(screen.getByText('Enable Reduced Motion')).toBeInTheDocument();
    });

    it('renders feature descriptions', () => {
      render(<AccessibilitySettings {...defaultProps} />);
      
      expect(screen.getByText('Enhanced support for screen readers with ARIA labels')).toBeInTheDocument();
      expect(screen.getByText('Full keyboard navigation support')).toBeInTheDocument();
      expect(screen.getByText('High contrast colors for better visibility')).toBeInTheDocument();
      expect(screen.getByText('Reduce animations and transitions')).toBeInTheDocument();
    });

    it('renders accessibility status summary', () => {
      render(<AccessibilitySettings {...defaultProps} />);
      
      expect(screen.getByText('Accessibility Status')).toBeInTheDocument();
      expect(screen.getByText('Screen Reader Support')).toBeInTheDocument();
      expect(screen.getByText('Keyboard Navigation')).toBeInTheDocument();
      expect(screen.getByText('High Contrast')).toBeInTheDocument();
      expect(screen.getByText('Reduced Motion')).toBeInTheDocument();
    });
  });

  describe('Switch Controls', () => {
    it('renders switches with correct ARIA attributes', () => {
      render(<AccessibilitySettings {...defaultProps} />);
      
      const screenReaderSwitch = screen.getByRole('switch', { name: /screen reader/i });
      expect(screenReaderSwitch).toHaveAttribute('aria-checked', 'false');
      
      const keyboardNavSwitch = screen.getByRole('switch', { name: /keyboard navigation/i });
      expect(keyboardNavSwitch).toHaveAttribute('aria-checked', 'true');
    });

    it('reflects current state in switch positions', () => {
      const props = {
        ...defaultProps,
        enableScreenReader: true,
        enableHighContrast: true,
      };
      
      render(<AccessibilitySettings {...props} />);
      
      const screenReaderSwitch = screen.getByRole('switch', { name: /screen reader/i });
      expect(screenReaderSwitch).toHaveAttribute('aria-checked', 'true');
      
      const highContrastSwitch = screen.getByRole('switch', { name: /high contrast/i });
      expect(highContrastSwitch).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('User Interactions', () => {
    it('handles screen reader toggle', async () => {
      const user = userEvent.setup();
      render(<AccessibilitySettings {...defaultProps} />);
      
      const screenReaderSwitch = screen.getByRole('switch', { name: /screen reader/i });
      await user.click(screenReaderSwitch);
      
      expect(defaultProps.onScreenReaderChange).toHaveBeenCalledWith(true);
    });

    it('handles keyboard navigation toggle', async () => {
      const user = userEvent.setup();
      render(<AccessibilitySettings {...defaultProps} />);
      
      const keyboardNavSwitch = screen.getByRole('switch', { name: /keyboard navigation/i });
      await user.click(keyboardNavSwitch);
      
      expect(defaultProps.onKeyboardNavigationChange).toHaveBeenCalledWith(false);
    });

    it('handles high contrast toggle', async () => {
      const user = userEvent.setup();
      render(<AccessibilitySettings {...defaultProps} />);
      
      const highContrastSwitch = screen.getByRole('switch', { name: /high contrast/i });
      await user.click(highContrastSwitch);
      
      expect(defaultProps.onHighContrastChange).toHaveBeenCalledWith(true);
    });

    it('handles reduced motion toggle', async () => {
      const user = userEvent.setup();
      render(<AccessibilitySettings {...defaultProps} />);
      
      const reducedMotionSwitch = screen.getByRole('switch', { name: /reduced motion/i });
      await user.click(reducedMotionSwitch);
      
      expect(defaultProps.onReducedMotionChange).toHaveBeenCalledWith(true);
    });
  });

  describe('Keyboard Navigation', () => {
    it('shows keyboard shortcuts when keyboard navigation is enabled', () => {
      const props = {
        ...defaultProps,
        enableKeyboardNavigation: true,
      };
      
      render(<AccessibilitySettings {...props} />);
      
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
      expect(screen.getByText('Close Settings:')).toBeInTheDocument();
      expect(screen.getByText('Reset Settings:')).toBeInTheDocument();
      expect(screen.getByText('Navigate:')).toBeInTheDocument();
      expect(screen.getByText('Activate:')).toBeInTheDocument();
    });

    it('hides keyboard shortcuts when keyboard navigation is disabled', () => {
      const props = {
        ...defaultProps,
        enableKeyboardNavigation: false,
      };
      
      render(<AccessibilitySettings {...props} />);
      
      expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
    });
  });

  describe('High Contrast Mode', () => {
    it('shows high contrast notice when enabled', () => {
      const props = {
        ...defaultProps,
        enableHighContrast: true,
      };
      
      render(<AccessibilitySettings {...props} />);
      
      expect(screen.getByText(/high contrast mode is enabled/i)).toBeInTheDocument();
    });

    it('hides high contrast notice when disabled', () => {
      render(<AccessibilitySettings {...defaultProps} />);
      
      expect(screen.queryByText(/high contrast mode is enabled/i)).not.toBeInTheDocument();
    });
  });

  describe('Status Indicators', () => {
    it('shows correct status colors for enabled features', () => {
      const props = {
        ...defaultProps,
        enableScreenReader: true,
        enableKeyboardNavigation: true,
      };
      
      render(<AccessibilitySettings {...props} />);
      
      const statusItems = screen.getAllByText('Screen Reader Support');
      const statusItem = statusItems.find(item => 
        item.parentElement?.querySelector('.bg-green-500')
      );
      expect(statusItem).toBeInTheDocument();
    });

    it('shows correct status colors for disabled features', () => {
      render(<AccessibilitySettings {...defaultProps} />);
      
      const statusItems = screen.getAllByText('Screen Reader Support');
      const statusItem = statusItems.find(item => 
        item.parentElement?.querySelector('.bg-gray-300')
      );
      expect(statusItem).toBeInTheDocument();
    });
  });

  describe('Accessibility Compliance', () => {
    it('provides proper labels for all interactive elements', () => {
      render(<AccessibilitySettings {...defaultProps} />);
      
      const switches = screen.getAllByRole('switch');
      switches.forEach(switchElement => {
        expect(switchElement).toHaveAttribute('aria-labelledby');
        expect(switchElement).toHaveAttribute('aria-describedby');
      });
    });

    it('uses semantic HTML structure', () => {
      render(<AccessibilitySettings {...defaultProps} />);
      
      // Check for proper heading structure
      expect(screen.getByText('Accessibility Status')).toBeInTheDocument();
      
      // Check for proper list structure in status summary
      const statusSection = screen.getByText('Accessibility Status').closest('div');
      expect(statusSection).toBeInTheDocument();
    });

    it('supports keyboard interaction', async () => {
      const user = userEvent.setup();
      render(<AccessibilitySettings {...defaultProps} />);
      
      const firstSwitch = screen.getAllByRole('switch')[0];
      
      // Focus the switch
      firstSwitch.focus();
      expect(document.activeElement).toBe(firstSwitch);
      
      // Activate with Enter key
      await user.keyboard('{Enter}');
      expect(defaultProps.onScreenReaderChange).toHaveBeenCalled();
    });
  });

  describe('Visual Feedback', () => {
    it('provides visual feedback for feature states', () => {
      const props = {
        ...defaultProps,
        enableScreenReader: true,
        enableHighContrast: true,
      };
      
      render(<AccessibilitySettings {...props} />);
      
      // Check for enabled state styling
      const enabledSwitches = screen.getAllByRole('switch').filter(
        switchEl => switchEl.getAttribute('aria-checked') === 'true'
      );
      
      expect(enabledSwitches.length).toBeGreaterThan(0);
    });

    it('shows hover states for interactive elements', () => {
      render(<AccessibilitySettings {...defaultProps} />);
      
      const featureItems = screen.getAllByText(/Enable/);
      featureItems.forEach(item => {
        const container = item.closest('.accessibility-feature');
        expect(container).toHaveClass('hover:bg-gray-50');
      });
    });
  });
});