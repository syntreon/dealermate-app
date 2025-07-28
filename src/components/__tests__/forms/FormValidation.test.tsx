import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Test form schema
const testSchema = z.object({
  email: z.string().email('Invalid email format').min(1, 'Email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

type TestFormData = z.infer<typeof testSchema>;

// Test form component
const TestForm = ({ onSubmit }: { onSubmit: (data: TestFormData) => void }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} data-testid="test-form">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          aria-invalid={errors.email ? 'true' : 'false'}
        />
        {errors.email && (
          <span role="alert" className="error">
            {errors.email.message}
          </span>
        )}
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          {...register('password')}
          aria-invalid={errors.password ? 'true' : 'false'}
        />
        {errors.password && (
          <span role="alert" className="error">
            {errors.password.message}
          </span>
        )}
      </div>

      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          type="text"
          {...register('name')}
          aria-invalid={errors.name ? 'true' : 'false'}
        />
        {errors.name && (
          <span role="alert" className="error">
            {errors.name.message}
          </span>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </Button>
    </form>
  );
};

describe('Form Validation', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderTestForm = () => {
    return render(<TestForm onSubmit={mockOnSubmit} />);
  };

  it('renders form fields with proper labels', () => {
    renderTestForm();
    
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('shows validation errors for empty required fields', async () => {
    renderTestForm();
    
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      // The form shows "Invalid email format" for empty email, not "Email is required"
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
      expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows validation error for invalid email format', async () => {
    renderTestForm();
    
    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: 'Submit' });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows validation error for short password', async () => {
    renderTestForm();
    
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Submit' });

    fireEvent.change(passwordInput, { target: { value: '123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows validation error for short name', async () => {
    renderTestForm();
    
    const nameInput = screen.getByLabelText('Name');
    const submitButton = screen.getByRole('button', { name: 'Submit' });

    fireEvent.change(nameInput, { target: { value: 'A' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    renderTestForm();
    
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const nameInput = screen.getByLabelText('Name');
    const submitButton = screen.getByRole('button', { name: 'Submit' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        {
          email: 'test@example.com',
          password: 'password123',
          name: 'John Doe',
        },
        expect.any(Object) // The form event
      );
    });
  });

  it('clears validation errors when valid input is provided', async () => {
    renderTestForm();
    
    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: 'Submit' });

    // First, trigger validation error
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });

    // Then, provide valid input
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    await waitFor(() => {
      expect(screen.queryByText('Invalid email format')).not.toBeInTheDocument();
    });
  });

  it('has proper accessibility attributes', () => {
    renderTestForm();
    
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const nameInput = screen.getByLabelText('Name');

    expect(emailInput).toHaveAttribute('type', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(nameInput).toHaveAttribute('type', 'text');

    // Check for proper form structure
    expect(screen.getByTestId('test-form')).toBeInTheDocument();
  });

  it('shows loading state during submission', async () => {
    // Mock slow submission
    mockOnSubmit.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    renderTestForm();
    
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const nameInput = screen.getByLabelText('Name');
    const submitButton = screen.getByRole('button', { name: 'Submit' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.click(submitButton);

    // Should show loading state
    expect(screen.getByText('Submitting...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('sets aria-invalid attribute correctly', async () => {
    renderTestForm();
    
    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: 'Submit' });

    // Initially should not be invalid
    expect(emailInput).toHaveAttribute('aria-invalid', 'false');

    // Trigger validation error
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    });

    // Fix the error
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    await waitFor(() => {
      expect(emailInput).toHaveAttribute('aria-invalid', 'false');
    });
  });
});