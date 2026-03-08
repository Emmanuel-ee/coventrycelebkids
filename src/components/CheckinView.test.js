import { fireEvent, render, screen } from '@testing-library/react';
import CheckinView from './CheckinView';

describe('CheckinView', () => {
  it('renders the scanner toggle button and helper text', () => {
    const handleToggle = jest.fn();

    render(
      <CheckinView
        searchTerm=""
        onSearchChange={jest.fn()}
        filteredChildren={[]}
        signedInChildren={[]}
        requestSignIn={jest.fn()}
        requestSignOut={jest.fn()}
        onSelectChild={jest.fn()}
        isBirthdayToday={jest.fn()}
        isScannerActive={false}
        onToggleScanner={handleToggle}
        scanNotice=""
        onScan={jest.fn()}
        onScanError={jest.fn()}
      />
    );

    const toggleButton = screen.getByRole('button', { name: /open camera/i });
    expect(toggleButton).toBeInTheDocument();
    expect(screen.getByText(/camera stays off/i)).toBeInTheDocument();

    fireEvent.click(toggleButton);
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });
});
