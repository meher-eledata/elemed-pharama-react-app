import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ComplianceNav from '../components/ComplianceNav';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

beforeEach(() => mockNavigate.mockClear());

const renderNav = (pathname: string) =>
  render(
    <MemoryRouter initialEntries={[pathname]}>
      <ComplianceNav />
    </MemoryRouter>,
  );

it('leads with Calendar, the module landing surface', () => {
  renderNav('/compliance/calendar');
  const tabs = screen.getAllByRole('tab');
  expect(tabs.map((tab) => tab.textContent)).toEqual(['Calendar', 'Documents']);
  expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
});

it('exposes Settings only inside the admin portal', () => {
  renderNav('/admin/compliance/calendar');
  expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
    'Calendar',
    'Documents',
    'Settings',
  ]);
});

it('navigates to the portal-correct documents path', () => {
  renderNav('/admin/compliance/calendar');
  fireEvent.click(screen.getByRole('tab', { name: 'Documents' }));
  expect(mockNavigate).toHaveBeenCalledWith('/admin/compliance/documents');
});

// Every page now has exactly one canonical URL, so the active tab is a real match
// rather than the old index-0 fallback that highlighted the wrong tab.
it('marks Documents active on the documents URL', () => {
  renderNav('/compliance/documents');
  expect(screen.getByRole('tab', { name: 'Documents' })).toHaveAttribute('aria-selected', 'true');
});
