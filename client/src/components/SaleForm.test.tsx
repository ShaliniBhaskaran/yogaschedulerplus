import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import SaleForm from './SaleForm';
import * as salesApi from '../api/sales';
import * as customersApi from '../api/customers';
import * as packagesApi from '../api/packages';

vi.mock('../api/sales');
vi.mock('../api/customers');
vi.mock('../api/packages');

const mockCustomer = {
  _id: '1',
  customerId: 'C00001',
  firstName: 'Lena',
  lastName: 'Ortiz',
  address: '22 River Rd',
  phone: '555-3001',
  email: 'lena.ortiz@example.com',
  preferredContact: 'email' as const,
  classBalance: 0,
  isUnlimited: false,
};

const mockPackage = {
  _id: '1',
  packageId: 'P00001',
  packageName: 'General 10-Class Pack',
  packageCategory: 'General' as const,
  numberOfClasses: '10' as const,
  classType: 'General' as const,
  startDate: '2026-10-01',
  endDate: '2027-01-01',
  price: 150,
};

describe('SaleForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(customersApi.listCustomers).mockResolvedValue([mockCustomer]);
    vi.mocked(packagesApi.listPackages).mockResolvedValue([mockPackage]);
  });

  it('shows a message instead of the form when there are no customers or packages yet', async () => {
    vi.mocked(customersApi.listCustomers).mockResolvedValue([]);
    render(<SaleForm onCreated={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/add a customer first/i)).toBeInTheDocument();
    });
  });

  it('auto-fills amount and validity when a package is selected, and records the sale', async () => {
    vi.mocked(salesApi.createSale).mockResolvedValue({
      sale: {
        _id: 's1',
        customerId: 'C00001',
        packageId: 'P00001',
        amountPaid: 150,
        modeOfPayment: 'Card',
        paymentDate: '2026-10-15T20:00:00.000Z',
        validityStartDate: '2026-10-01',
        validityEndDate: '2027-01-01',
      },
      newClassBalance: 10,
      confirmationMessage: 'Sale recorded for Lena Ortiz. New class balance: 10.',
    });
    const onCreated = vi.fn();
    const user = userEvent.setup();
    render(<SaleForm onCreated={onCreated} />);

    await waitFor(() => screen.getByLabelText(/customer/i));
    await user.selectOptions(screen.getByLabelText(/customer/i), 'C00001');
    await user.selectOptions(screen.getByLabelText(/type of package/i), 'P00001');

    await waitFor(() => {
      expect(screen.getByText(/^\$150$/)).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText(/mode of payment/i), 'Card');
    await user.click(screen.getByRole('button', { name: /record sale/i }));

    await waitFor(() => {
      expect(screen.getByText(/New class balance: 10/i)).toBeInTheDocument();
    });
    expect(onCreated).toHaveBeenCalled();
  });
});
