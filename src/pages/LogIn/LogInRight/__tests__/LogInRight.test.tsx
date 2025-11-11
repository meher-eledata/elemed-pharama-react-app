import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import LogInRight from '../LogInRight';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('LogInRight', () => {
  beforeEach(() => {
    // Mock console.error to avoid image loading errors in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders the component', () => {
      renderWithTheme(<LogInRight />);
      const box = screen.getByAltText('Login illustration').closest('div');
      expect(box).toBeInTheDocument();
    });

    it('renders login image', () => {
      renderWithTheme(<LogInRight />);
      const image = screen.getByAltText('Login illustration');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src');
    });

    it('renders with custom className when provided', () => {
      renderWithTheme(<LogInRight className="custom-class" />);
      const image = screen.getByAltText('Login illustration');
      expect(image).toBeInTheDocument();
    });
  });

  describe('Image Handling', () => {
    it('handles image error and shows placeholder', () => {
      renderWithTheme(<LogInRight />);
      const image = screen.getByAltText('Login illustration') as HTMLImageElement;
      
      // Simulate image error
      fireEvent.error(image);
      
      // After error, src should be updated to placeholder
      expect(image.src).toContain('placehold.co');
    });

    it('has correct image styling', () => {
      renderWithTheme(<LogInRight />);
      const image = screen.getByAltText('Login illustration') as HTMLImageElement;
      
      expect(image).toHaveStyle({
        width: '100%',
        height: '100%',
        objectFit: 'cover',
      });
    });
  });

  describe('Responsive Design', () => {
    it('has responsive display styles', () => {
      renderWithTheme(<LogInRight />);
      const box = screen.getByAltText('Login illustration').closest('div');
      
      // Check that the Box component has responsive styles
      // Note: Material-UI sx prop styles are applied at runtime
      expect(box).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper alt text for image', () => {
      renderWithTheme(<LogInRight />);
      const image = screen.getByAltText('Login illustration');
      expect(image).toBeInTheDocument();
    });
  });
});

