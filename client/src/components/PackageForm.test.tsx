import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import PackageForm from './PackageForm';
import * as packagesApi from '../api/packages';

vi.mock('../api/packages');

describe('PackageForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a confirmation message after successfully saving a package', async () => {
    vi.mocked(packagesApi.createPackage).mockResolvedValue({
      package: {
        _id: '1',
        packageId: 'P00001',
        packageName: 'General 10-Class Pack',
        packageCategory: 'General',
        numberOfClasses: '10',
        classType: 'General',
        startDate: '2026-10-01',
        endDate: '2027-01-01',
        price: 150,
      },
      confirmationMessage: 'Package "General 10-Class Pack" has been added with id P00001.',
    });
    const onCreated = vi.fn();
    const user = userEvent.setup();
    render(<PackageForm onCreated={onCreated} />);

    await user.type(screen.getByLabelText(/package name/i), 'General 10-Class Pack');
    await user.selectOptions(screen.getByLabelText(/category/i), 'General');
    await user.selectOptions(screen.getByLabelText(/# of classes/i), '10');
    await user.selectOptions(screen.getByLabelText(/class type/i), 'General');
    await user.type(screen.getByLabelText(/start date/i), '2026-10-01');
    await user.type(screen.getByLabelText(/end date/i), '2027-01-01');
    await user.type(screen.getByLabelText(/price/i), '150');
    await user.click(screen.getByRole('button', { name: /add package/i }));

    await waitFor(() => {
      expect(screen.getByText(/has been added with id P00001/i)).toBeInTheDocument();
    });
    expect(onCreated).toHaveBeenCalled();
  });

  it('shows an error message when saving fails', async () => {
    vi.mocked(packagesApi.createPackage).mockRejectedValue(new Error('network error'));
    const user = userEvent.setup();
    render(<PackageForm onCreated={() => {}} />);

    await user.type(screen.getByLabelText(/package name/i), 'General 10-Class Pack');
    await user.selectOptions(screen.getByLabelText(/category/i), 'General');
    await user.selectOptions(screen.getByLabelText(/# of classes/i), '10');
    await user.selectOptions(screen.getByLabelText(/class type/i), 'General');
    await user.type(screen.getByLabelText(/start date/i), '2026-10-01');
    await user.type(screen.getByLabelText(/end date/i), '2027-01-01');
    await user.type(screen.getByLabelText(/price/i), '150');
    await user.click(screen.getByRole('button', { name: /add package/i }));

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });
});
