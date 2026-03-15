import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppHeader from './AppHeader';

describe('AppHeader', () => {
  it('renders title and status messaging', async () => {
    const onNavigateHome = jest.fn();

    render(
      <AppHeader
        view="checkin"
        onNavigateHome={onNavigateHome}
        supabaseStatus="All good"
        error=""
        isSupabaseEnabled={false}
        supabaseConfigMessage="Supabase missing"
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /coventry celebkids & Teens/i }));
    expect(onNavigateHome).toHaveBeenCalledTimes(1);

    expect(screen.getByText(/supabase missing/i)).toBeInTheDocument();
    expect(screen.getByText(/all good/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  it('hides the checkin home shortcut outside checkin view', () => {
    render(
      <AppHeader
        view="home"
        onNavigateHome={() => {}}
        supabaseStatus=""
        error=""
        isSupabaseEnabled
        supabaseConfigMessage=""
      />
    );

    expect(screen.queryByRole('button', { name: /^home$/i })).toBeNull();
  });
});
