// Local storage service for MVP
// In production, this would connect to a backend API

import { UserProfile, Estimate, SavedBill, Appointment } from '../types';

const STORAGE_KEYS = {
  USER_PROFILE: 'billharmony_user_profile',
  ESTIMATES: 'billharmony_estimates',
  BILLS: 'billharmony_bills',
  APPOINTMENTS: 'billharmony_appointments',
  ONBOARDING_COMPLETE: 'billharmony_onboarding_complete',
};

export const storageService = {
  // User Profile
  getUserProfile(): UserProfile | null {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  },

  saveUserProfile(profile: UserProfile): void {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  },

  deleteUserProfile(): void {
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
  },

  // Estimates
  getEstimates(): Estimate[] {
    const stored = localStorage.getItem(STORAGE_KEYS.ESTIMATES);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  },

  getEstimate(id: string): Estimate | null {
    const estimates = this.getEstimates();
    return estimates.find(e => e.id === id) || null;
  },

  saveEstimate(estimate: Estimate): void {
    const estimates = this.getEstimates();
    const existingIndex = estimates.findIndex(e => e.id === estimate.id);
    if (existingIndex >= 0) {
      estimates[existingIndex] = estimate;
    } else {
      estimates.push(estimate);
    }
    localStorage.setItem(STORAGE_KEYS.ESTIMATES, JSON.stringify(estimates));
  },

  deleteEstimate(id: string): void {
    const estimates = this.getEstimates();
    const filtered = estimates.filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.ESTIMATES, JSON.stringify(filtered));
  },

  // Bills
  getBills(): SavedBill[] {
    const stored = localStorage.getItem(STORAGE_KEYS.BILLS);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  },

  getBill(id: string): SavedBill | null {
    const bills = this.getBills();
    return bills.find(b => b.id === id) || null;
  },

  saveBill(bill: SavedBill): void {
    const bills = this.getBills();
    const existingIndex = bills.findIndex(b => b.id === bill.id);
    if (existingIndex >= 0) {
      bills[existingIndex] = bill;
    } else {
      bills.push(bill);
    }
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));
  },

  deleteBill(id: string): void {
    const bills = this.getBills();
    const filtered = bills.filter(b => b.id !== id);
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(filtered));
  },

  // Appointments
  getAppointments(): Appointment[] {
    const stored = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  },

  getAppointment(id: string): Appointment | null {
    const appointments = this.getAppointments();
    return appointments.find(a => a.id === id) || null;
  },

  saveAppointment(appointment: Appointment): void {
    const appointments = this.getAppointments();
    const existingIndex = appointments.findIndex(a => a.id === appointment.id);
    if (existingIndex >= 0) {
      appointments[existingIndex] = appointment;
    } else {
      appointments.push(appointment);
    }
    // Sort by date (upcoming first)
    appointments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('appointmentsUpdated'));
  },

  saveAppointments(appointments: Appointment[]): void {
    // Sort by date (upcoming first)
    const sorted = [...appointments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(sorted));
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('appointmentsUpdated'));
  },

  deleteAppointment(id: string): void {
    const appointments = this.getAppointments();
    const filtered = appointments.filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(filtered));
  },

  // Onboarding
  isOnboardingComplete(): boolean {
    return localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE) === 'true';
  },

  setOnboardingComplete(complete: boolean): void {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, String(complete));
  },
};

