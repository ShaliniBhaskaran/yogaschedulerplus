import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import InstructorForm from './InstructorForm';
import * as instructorsApi from '../api/instructors';

vi.mock('../api/instructors');

describe('InstructorForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('goes straight to details when the name is not a duplicate', async () => {
    vi.mocked(instructorsApi.checkInstructorName).mockResolvedValue(false);
    const user = userEvent.setup();
    render(<InstructorForm onCreated={() => {}} />);

    await user.type(screen.getByLabelText(/first name/i), 'Priya');
    await user.type(screen.getByLabelText(/last name/i), 'Menon');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
    });
  });

  it('shows a duplicate-confirmation step when the name already exists', async () => {
    vi.mocked(instructorsApi.checkInstructorName).mockResolvedValue(true);
    const user = userEvent.setup();
    render(<InstructorForm onCreated={() => {}} />);

    await user.type(screen.getByLabelText(/first name/i), 'Asha');
    await user.type(screen.getByLabelText(/last name/i), 'Rao');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/already exists/i)).toBeInTheDocument();
    });
  });

  it('shows the confirmation message after a successful save', async () => {
    vi.mocked(instructorsApi.checkInstructorName).mockResolvedValue(false);
    vi.mocked(instructorsApi.createInstructor).mockResolvedValue({
      instructor: {
        _id: '1',
        instructorId: 'I00001',
        firstName: 'Priya',
        lastName: 'Menon',
        address: '1 Main St',
        phone: '555-0000',
        email: 'priya@example.com',
        preferredContact: 'email',
      },
      confirmationMessage: "Welcome to Yoga'Hom! ... Your instructor id is I00001.",
    });
    const onCreated = vi.fn();
    const user = userEvent.setup();
    render(<InstructorForm onCreated={onCreated} />);

    await user.type(screen.getByLabelText(/first name/i), 'Priya');
    await user.type(screen.getByLabelText(/last name/i), 'Menon');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => screen.getByLabelText(/address/i));
    await user.type(screen.getByLabelText(/address/i), '1 Main St');
    await user.type(screen.getByLabelText(/phone/i), '555-0000');
    await user.type(screen.getByLabelText(/email/i), 'priya@example.com');
    await user.click(screen.getByRole('button', { name: /save instructor/i }));

    await waitFor(() => {
      expect(screen.getByText(/Your instructor id is I00001/i)).toBeInTheDocument();
    });
    expect(onCreated).toHaveBeenCalled();
  });

  it('saves a duplicate-named instructor with confirmDuplicate:true after "Yes, continue"', async () => {
    vi.mocked(instructorsApi.checkInstructorName).mockResolvedValue(true);
    vi.mocked(instructorsApi.createInstructor).mockResolvedValue({
      instructor: {
        _id: '2',
        instructorId: 'I00002',
        firstName: 'Asha',
        lastName: 'Rao',
        address: '2 Main St',
        phone: '555-1111',
        email: 'asha2@example.com',
        preferredContact: 'email',
      },
      confirmationMessage: "Welcome to Yoga'Hom! ... Your instructor id is I00002.",
    });
    const user = userEvent.setup();
    render(<InstructorForm onCreated={() => {}} />);

    await user.type(screen.getByLabelText(/first name/i), 'Asha');
    await user.type(screen.getByLabelText(/last name/i), 'Rao');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => screen.getByText(/already exists/i));
    await user.click(screen.getByRole('button', { name: /yes, continue/i }));

    await waitFor(() => screen.getByLabelText(/address/i));
    await user.type(screen.getByLabelText(/address/i), '2 Main St');
    await user.type(screen.getByLabelText(/phone/i), '555-1111');
    await user.type(screen.getByLabelText(/email/i), 'asha2@example.com');
    await user.click(screen.getByRole('button', { name: /save instructor/i }));

    await waitFor(() => {
      expect(screen.getByText(/Your instructor id is I00002/i)).toBeInTheDocument();
    });
    expect(instructorsApi.createInstructor).toHaveBeenCalledWith(
      expect.objectContaining({ confirmDuplicate: true })
    );
  });
});
