import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import axios from 'axios';
import ClassForm from './ClassForm';
import * as classesApi from '../api/classes';
import * as instructorsApi from '../api/instructors';

vi.mock('../api/classes');
vi.mock('../api/instructors');

const mockInstructor = {
  _id: '1',
  instructorId: 'I00001',
  firstName: 'Asha',
  lastName: 'Rao',
  address: '12 Lotus Lane',
  phone: '555-1234',
  email: 'asha@example.com',
  preferredContact: 'email' as const,
};

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await waitFor(() => screen.getByLabelText(/instructor/i));
  await user.selectOptions(screen.getByLabelText(/instructor/i), 'I00001');
  await user.selectOptions(screen.getByLabelText(/day/i), '1');
  fireEvent.change(screen.getByLabelText(/start time/i), { target: { value: '10:00' } });
  await user.type(screen.getByLabelText(/duration/i), '60');
  await user.type(screen.getByLabelText(/pay rate/i), '30');
  await user.selectOptions(screen.getByLabelText(/class type/i), 'General');
}

describe('ClassForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(instructorsApi.listInstructors).mockResolvedValue([mockInstructor]);
  });

  it('shows a message instead of the form when there are no instructors yet', async () => {
    vi.mocked(instructorsApi.listInstructors).mockResolvedValue([]);
    render(<ClassForm onCreated={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/add an instructor first/i)).toBeInTheDocument();
    });
  });

  it('shows a confirmation message after successfully scheduling a class', async () => {
    vi.mocked(classesApi.createClass).mockResolvedValue({
      class: {
        _id: 'c1',
        instructorId: 'I00001',
        dayOfWeek: 1,
        startTime: '10:00',
        durationMinutes: 60,
        classType: 'General',
        payRate: 30,
        status: 'published',
      },
      confirmationMessage: 'New class scheduled: General on day 1 at 10:00.',
    });
    const onCreated = vi.fn();
    const user = userEvent.setup();
    render(<ClassForm onCreated={onCreated} />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /schedule class/i }));

    await waitFor(() => {
      expect(screen.getByText(/New class scheduled/i)).toBeInTheDocument();
    });
    expect(onCreated).toHaveBeenCalled();
  });

  it('shows suggested alternative times when the slot conflicts', async () => {
    const axiosError = Object.assign(new Error('Conflict'), {
      isAxiosError: true,
      response: { status: 409, data: { conflict: true, suggestions: ['06:00', '06:30', '07:00'] } },
    });
    vi.mocked(classesApi.createClass).mockRejectedValue(axiosError);
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

    const user = userEvent.setup();
    render(<ClassForm onCreated={() => {}} />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /schedule class/i }));

    await waitFor(() => {
      expect(screen.getByText(/already taken/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: '06:00' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '06:30' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '07:00' })).toBeInTheDocument();
  });
});
