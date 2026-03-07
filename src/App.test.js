import { render, screen } from '@testing-library/react';
import App from './App';

test('renders register button on the home view', () => {
  render(<App />);
  const buttonElement = screen.getByRole('button', { name: /register/i });
  expect(buttonElement).toBeInTheDocument();
});
