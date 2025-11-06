import { describe, it, expect, beforeEach } from 'vitest';
import {
  filterFutureAppointments,
  isAppointmentInPast,
  groupAppointmentsByTime,
} from './appointmentUtils';
import type { Appointment } from './api';

describe('appointmentUtils', () => {
  let today: Date;

  beforeEach(() => {
    // Use a fixed reference date for consistent testing
    today = new Date('2025-11-05T12:00:00Z');
  });

  describe('filterFutureAppointments', () => {
    it('should filter out appointments older than today', () => {
      const appointments: Appointment[] = [
        {
          id: 1,
          schedule: '2025-11-04T10:00:00Z', // Yesterday
          duration: 60,
          user_id: 1,
        },
        {
          id: 2,
          schedule: '2025-11-05T14:00:00Z', // Today
          duration: 60,
          user_id: 2,
        },
        {
          id: 3,
          schedule: '2025-11-06T09:00:00Z', // Tomorrow
          duration: 60,
          user_id: 3,
        },
      ];

      const result = filterFutureAppointments(appointments, today);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(2);
      expect(result[1].id).toBe(3);
    });

    it('should include appointments scheduled for today', () => {
      const appointments: Appointment[] = [
        {
          id: 1,
          schedule: '2025-11-05T08:00:00Z', // Today, early morning
          duration: 60,
          user_id: 1,
        },
        {
          id: 2,
          schedule: '2025-11-05T23:59:59Z', // Today, late night
          duration: 60,
          user_id: 2,
        },
      ];

      const result = filterFutureAppointments(appointments, today);

      expect(result).toHaveLength(2);
    });

    it('should return empty array for empty input', () => {
      const result = filterFutureAppointments([], today);
      expect(result).toHaveLength(0);
    });

    it('should handle appointments at start of day boundary', () => {
      const appointments: Appointment[] = [
        {
          id: 1,
          schedule: '2025-11-04T23:59:59.999Z', // One millisecond before today
          duration: 60,
          user_id: 1,
        },
        {
          id: 2,
          schedule: '2025-11-05T00:00:00.000Z', // Exactly at start of today
          duration: 60,
          user_id: 2,
        },
      ];

      const result = filterFutureAppointments(appointments, today);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });

    it('should filter out all past appointments', () => {
      const appointments: Appointment[] = [
        {
          id: 1,
          schedule: '2025-11-01T10:00:00Z',
          duration: 60,
          user_id: 1,
        },
        {
          id: 2,
          schedule: '2025-11-02T14:00:00Z',
          duration: 60,
          user_id: 2,
        },
        {
          id: 3,
          schedule: '2025-11-03T09:00:00Z',
          duration: 60,
          user_id: 3,
        },
      ];

      const result = filterFutureAppointments(appointments, today);

      expect(result).toHaveLength(0);
    });

    it('should handle invalid date strings gracefully', () => {
      const appointments: Appointment[] = [
        {
          id: 1,
          schedule: 'invalid-date',
          duration: 60,
          user_id: 1,
        },
        {
          id: 2,
          schedule: '2025-11-06T10:00:00Z',
          duration: 60,
          user_id: 2,
        },
      ];

      const result = filterFutureAppointments(appointments, today);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });

    it('should use current date as default reference', () => {
      const appointment: Appointment = {
        id: 1,
        schedule: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // Tomorrow from now
        duration: 60,
        user_id: 1,
      };

      const result = filterFutureAppointments([appointment]);

      expect(result).toHaveLength(1);
    });

    it('should preserve appointment order', () => {
      const appointments: Appointment[] = [
        {
          id: 3,
          schedule: '2025-11-10T10:00:00Z',
          duration: 60,
          user_id: 3,
        },
        {
          id: 1,
          schedule: '2025-11-06T10:00:00Z',
          duration: 60,
          user_id: 1,
        },
        {
          id: 2,
          schedule: '2025-11-08T10:00:00Z',
          duration: 60,
          user_id: 2,
        },
      ];

      const result = filterFutureAppointments(appointments, today);

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe(3);
      expect(result[1].id).toBe(1);
      expect(result[2].id).toBe(2);
    });
  });

  describe('isAppointmentInPast', () => {
    it('should return true for past appointments', () => {
      const appointment: Appointment = {
        id: 1,
        schedule: '2025-11-04T10:00:00Z',
        duration: 60,
        user_id: 1,
      };

      expect(isAppointmentInPast(appointment, today)).toBe(true);
    });

    it('should return false for today\'s appointments', () => {
      const appointment: Appointment = {
        id: 1,
        schedule: '2025-11-05T14:00:00Z',
        duration: 60,
        user_id: 1,
      };

      expect(isAppointmentInPast(appointment, today)).toBe(false);
    });

    it('should return false for future appointments', () => {
      const appointment: Appointment = {
        id: 1,
        schedule: '2025-11-06T10:00:00Z',
        duration: 60,
        user_id: 1,
      };

      expect(isAppointmentInPast(appointment, today)).toBe(false);
    });

    it('should handle appointments at start of day boundary', () => {
      const pastBoundary: Appointment = {
        id: 1,
        schedule: '2025-11-04T23:59:59.999Z',
        duration: 60,
        user_id: 1,
      };

      const todayBoundary: Appointment = {
        id: 2,
        schedule: '2025-11-05T00:00:00.000Z',
        duration: 60,
        user_id: 2,
      };

      expect(isAppointmentInPast(pastBoundary, today)).toBe(true);
      expect(isAppointmentInPast(todayBoundary, today)).toBe(false);
    });

    it('should handle invalid date strings gracefully', () => {
      const appointment: Appointment = {
        id: 1,
        schedule: 'invalid-date',
        duration: 60,
        user_id: 1,
      };

      // Invalid dates are treated as past to be safe
      expect(isAppointmentInPast(appointment, today)).toBe(true);
    });
  });

  describe('groupAppointmentsByTime', () => {
    it('should separate past and future appointments', () => {
      const appointments: Appointment[] = [
        {
          id: 1,
          schedule: '2025-11-04T10:00:00Z', // Past
          duration: 60,
          user_id: 1,
        },
        {
          id: 2,
          schedule: '2025-11-05T14:00:00Z', // Today
          duration: 60,
          user_id: 2,
        },
        {
          id: 3,
          schedule: '2025-11-06T09:00:00Z', // Future
          duration: 60,
          user_id: 3,
        },
        {
          id: 4,
          schedule: '2025-11-03T08:00:00Z', // Past
          duration: 60,
          user_id: 4,
        },
      ];

      const result = groupAppointmentsByTime(appointments, today);

      expect(result.past).toHaveLength(2);
      expect(result.future).toHaveLength(2);
      expect(result.past.map((a) => a.id)).toEqual([1, 4]);
      expect(result.future.map((a) => a.id)).toEqual([2, 3]);
    });

    it('should return empty arrays for empty input', () => {
      const result = groupAppointmentsByTime([], today);

      expect(result.past).toHaveLength(0);
      expect(result.future).toHaveLength(0);
    });

    it('should handle all past appointments', () => {
      const appointments: Appointment[] = [
        {
          id: 1,
          schedule: '2025-11-04T10:00:00Z',
          duration: 60,
          user_id: 1,
        },
        {
          id: 2,
          schedule: '2025-11-03T14:00:00Z',
          duration: 60,
          user_id: 2,
        },
      ];

      const result = groupAppointmentsByTime(appointments, today);

      expect(result.past).toHaveLength(2);
      expect(result.future).toHaveLength(0);
    });

    it('should handle all future appointments', () => {
      const appointments: Appointment[] = [
        {
          id: 1,
          schedule: '2025-11-06T10:00:00Z',
          duration: 60,
          user_id: 1,
        },
        {
          id: 2,
          schedule: '2025-11-07T14:00:00Z',
          duration: 60,
          user_id: 2,
        },
      ];

      const result = groupAppointmentsByTime(appointments, today);

      expect(result.past).toHaveLength(0);
      expect(result.future).toHaveLength(2);
    });

    it('should handle invalid dates gracefully', () => {
      const appointments: Appointment[] = [
        {
          id: 1,
          schedule: 'invalid-date',
          duration: 60,
          user_id: 1,
        },
        {
          id: 2,
          schedule: '2025-11-06T10:00:00Z',
          duration: 60,
          user_id: 2,
        },
      ];

      const result = groupAppointmentsByTime(appointments, today);

      expect(result.past).toHaveLength(1);
      expect(result.future).toHaveLength(1);
      expect(result.past[0].id).toBe(1);
      expect(result.future[0].id).toBe(2);
    });

    it('should preserve order within groups', () => {
      const appointments: Appointment[] = [
        {
          id: 3,
          schedule: '2025-11-06T15:00:00Z',
          duration: 60,
          user_id: 3,
        },
        {
          id: 1,
          schedule: '2025-11-04T10:00:00Z',
          duration: 60,
          user_id: 1,
        },
        {
          id: 4,
          schedule: '2025-11-10T09:00:00Z',
          duration: 60,
          user_id: 4,
        },
        {
          id: 2,
          schedule: '2025-11-03T14:00:00Z',
          duration: 60,
          user_id: 2,
        },
      ];

      const result = groupAppointmentsByTime(appointments, today);

      expect(result.past).toEqual([appointments[1], appointments[3]]);
      expect(result.future).toEqual([appointments[0], appointments[2]]);
    });
  });
});
