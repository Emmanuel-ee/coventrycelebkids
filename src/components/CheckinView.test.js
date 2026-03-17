import { fireEvent, render, screen } from '@testing-library/react';
import CheckinView from './CheckinView';

describe('CheckinView', () => {
  it('renders the scanner toggle button and helper text', () => {
    const handleToggle = jest.fn();

    render(
      <CheckinView
        isScannerActive={false}
        onToggleScanner={handleToggle}
        scanNotice=""
        onScan={jest.fn()}
        onScanError={jest.fn()}
        isCheckinAllowed
      />
    );

    const toggleButton = screen.getByRole('button', { name: /open camera/i });
    expect(toggleButton).toBeInTheDocument();
    expect(
      screen.getByText(/use the camera to scan a child qr code to sign in or out/i)
    ).toBeInTheDocument();

    fireEvent.click(toggleButton);
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });
});
