import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CustomerForm from './CustomerForm';
import * as customersApi from '../api/customers';

vi.mock('../api/customers');

describe('CustomerForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('goes straight to details when the name is not a duplicate', async () => {
    vi.mocked(customersApi.checkCustomerName).mockResolvedValue(false);
    const user = userEvent.setup();
    render(<CustomerForm onCreated={() => {}} />);

    await user.type(screen.getByLabelText(/first name/i), 'Nina');
    await user.type(screen.getByLabelText(/last name/i), 'Park');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
    });
  });

  it('shows a duplicate-confirmation step when the name already exists', async () => {
    vi.mocked(customersApi.checkCustomerName).mockResolvedValue(true);
    const user = userEvent.setup();
    render(<CustomerForm onCreated={() => {}} />);

    await user.type(screen.getByLabelText(/first name/i), 'Lena');
    await user.type(screen.getByLabelText(/last name/i), 'Ortiz');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/already exists/i)).toBeInTheDocument();
    });
  });

  it('shows the confirmation message after a successful save', async () => {
    vi.mocked(customersApi.checkCustomerName).mockResolvedValue(false);
    vi.mocked(customersApi.createCustomer).mockResolvedValue({
      customer: {
        _id: '1',
        customerId: 'C00001',
        firstName: 'Nina',
        lastName: 'Park',
        address: '1 Main St',
        phone: '555-0000',
        email: 'nina@example.com',
        preferredContact: 'email',
        classBalance: 0,
        isUnlimited: false,
      },
      confirmationMessage: "Welcome to Yoga'Hom! ... Your customer id is C00001.",
    });
    const onCreated = vi.fn();
    const user = userEvent.setup();
    render(<CustomerForm onCreated={onCreated} />);

    await user.type(screen.getByLabelText(/first name/i), 'Nina');
    await user.type(screen.getByLabelText(/last name/i), 'Park');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => screen.getByLabelText(/address/i));
    await user.type(screen.getByLabelText(/address/i), '1 Main St');
    await user.type(screen.getByLabelText(/phone/i), '555-0000');
    await user.type(screen.getByLabelText(/email/i), 'nina@example.com');
    await user.click(screen.getByRole('button', { name: /save customer/i }));

    await waitFor(() => {
      expect(screen.getByText(/Your customer id is C00001/i)).toBeInTheDocument();
    });
    expect(onCreated).toHaveBeenCalled();
  });
});
