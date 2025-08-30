import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ForgotPasswordForm } from '../apps/web/components/auth/ForgotPasswordForm';
import { useAuth } from '../lib/auth/use-auth';
import '@testing-library/jest-dom';

// Mock the useAuth hook
jest.mock('../lib/auth/use-auth');

const mockResetPassword = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useAuth as jest.Mock).mockReturnValue({
    resetPassword: mockResetPassword,
    isLoading: false,
    error: null,
  });
});

describe('ForgotPasswordForm', () => {
  it('renders the form correctly', () => {
    render(<ForgotPasswordForm />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  it('validates email input', async () => {
    render(<ForgotPasswordForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    
    // Test with invalid email
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);
    
    expect(await screen.findByText(/please enter a valid email address/i)).toBeInTheDocument();
    expect(mockResetPassword).not.toHaveBeenCalled();
    
    // Test with valid email
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('shows loading state', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      resetPassword: mockResetPassword,
      isLoading: true,
      error: null,
    });
    
    render(<ForgotPasswordForm />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('shows success message', async () => {
    mockResetPassword.mockResolvedValueOnce({ success: true });
    
    render(<ForgotPasswordForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);
    
    expect(await screen.findByText(/check your email for a reset link/i)).toBeInTheDocument();
  });

  it('shows error message', async () => {
    const errorMessage = 'Failed to send reset email';
    mockResetPassword.mockResolvedValueOnce({ success: false, error: errorMessage });
    
    render(<ForgotPasswordForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);
    
    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
  });
});
