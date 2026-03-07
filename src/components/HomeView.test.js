import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomeView from './HomeView';

describe('HomeView', () => {
  it('renders actions and announcements', async () => {
    const onRegister = jest.fn();
    const onCheckin = jest.fn();
    const onSelectAnnouncement = jest.fn();

    render(
      <HomeView
        isLoading={false}
        onRegister={onRegister}
        onCheckin={onCheckin}
        announcements={[{ id: '1', title: 'Hello', message: 'Welcome parents!' }]}
        announcementsStatus=""
        onSelectAnnouncement={onSelectAnnouncement}
        truncateMessage={(message) => message}
      />
    );

  await userEvent.click(screen.getByRole('button', { name: /register your child/i }));
  await userEvent.click(screen.getByRole('button', { name: /drop off/i }));

    expect(onRegister).toHaveBeenCalledTimes(1);
    expect(onCheckin).toHaveBeenCalledTimes(1);

  await userEvent.click(screen.getByRole('button', { name: /hello/i }));
    expect(onSelectAnnouncement).toHaveBeenCalledWith({
      id: '1',
      title: 'Hello',
      message: 'Welcome parents!',
    });
  });
});
