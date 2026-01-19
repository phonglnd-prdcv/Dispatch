import { render, screen } from '@testing-library/react-native';
import React from 'react';

import SideMenu from '../side-menu';

describe('SideMenu', () => {
  it('should render without crashing', () => {
    render(<SideMenu />);

    // The current SideMenu component is a stub that just renders "Side Menu"
    expect(screen.getByText('Side Menu')).toBeTruthy();
  });

  it('should accept onNavigate prop', () => {
    const mockOnNavigate = jest.fn();
    render(<SideMenu onNavigate={mockOnNavigate} />);

    expect(screen.getByText('Side Menu')).toBeTruthy();
  });
});
