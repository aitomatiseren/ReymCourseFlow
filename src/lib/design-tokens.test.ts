import { describe, it, expect } from 'vitest';
import { 
  DesignTokens, 
  getStatusColors, 
  getTrainingColors, 
  getCertificateColors,
  BadgeVariants 
} from './design-tokens';

describe('DesignTokens', () => {
  it('has all required status colors', () => {
    expect(DesignTokens.status).toHaveProperty('active');
    expect(DesignTokens.status).toHaveProperty('inactive');
    expect(DesignTokens.status).toHaveProperty('onLeave');
    expect(DesignTokens.status).toHaveProperty('sickShort');
    expect(DesignTokens.status).toHaveProperty('sickLong');
    expect(DesignTokens.status).toHaveProperty('vacation');
    expect(DesignTokens.status).toHaveProperty('unavailable');
    expect(DesignTokens.status).toHaveProperty('terminated');
  });

  it('has all required training colors', () => {
    expect(DesignTokens.training).toHaveProperty('scheduled');
    expect(DesignTokens.training).toHaveProperty('inProgress');
    expect(DesignTokens.training).toHaveProperty('completed');
    expect(DesignTokens.training).toHaveProperty('cancelled');
  });

  it('has all required certificate colors', () => {
    expect(DesignTokens.certificate).toHaveProperty('valid');
    expect(DesignTokens.certificate).toHaveProperty('expiringSoon');
    expect(DesignTokens.certificate).toHaveProperty('expired');
    expect(DesignTokens.certificate).toHaveProperty('suspended');
  });

  it('status colors have required properties', () => {
    const activeStatus = DesignTokens.status.active;
    expect(activeStatus).toHaveProperty('background');
    expect(activeStatus).toHaveProperty('text');
    expect(activeStatus).toHaveProperty('border');
    expect(activeStatus).toHaveProperty('ring');
    expect(activeStatus).toHaveProperty('css');
  });

  it('has consistent color structure across all status types', () => {
    Object.values(DesignTokens.status).forEach(status => {
      expect(status).toHaveProperty('background');
      expect(status).toHaveProperty('text');
      expect(status).toHaveProperty('border');
      expect(status).toHaveProperty('ring');
      expect(status).toHaveProperty('css');
    });
  });

  it('helper functions return correct colors', () => {
    const activeColors = getStatusColors('active');
    expect(activeColors).toEqual(DesignTokens.status.active);

    const scheduledColors = getTrainingColors('scheduled');
    expect(scheduledColors).toEqual(DesignTokens.training.scheduled);

    const validColors = getCertificateColors('valid');
    expect(validColors).toEqual(DesignTokens.certificate.valid);
  });

  it('has typography scale', () => {
    expect(DesignTokens.typography).toHaveProperty('xs');
    expect(DesignTokens.typography).toHaveProperty('sm');
    expect(DesignTokens.typography).toHaveProperty('base');
    expect(DesignTokens.typography).toHaveProperty('lg');
    expect(DesignTokens.typography).toHaveProperty('xl');
    expect(DesignTokens.typography).toHaveProperty('2xl');
  });

  it('has spacing system', () => {
    expect(DesignTokens.spacing).toHaveProperty('xs');
    expect(DesignTokens.spacing).toHaveProperty('sm');
    expect(DesignTokens.spacing).toHaveProperty('md');
    expect(DesignTokens.spacing).toHaveProperty('lg');
    expect(DesignTokens.spacing).toHaveProperty('xl');
  });

  it('badge variants include default classes', () => {
    expect(BadgeVariants.default).toContain('inline-flex');
    expect(BadgeVariants.default).toContain('items-center');
    expect(BadgeVariants.default).toContain('rounded-full');
  });
});