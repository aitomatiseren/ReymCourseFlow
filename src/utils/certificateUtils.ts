
import { Certificate } from '@/types';
import { differenceInDays, parseISO, isBefore } from 'date-fns';

export const calculateCertificateStatus = (expiryDate: string): 'valid' | 'expiring' | 'expired' => {
  const today = new Date();
  const expiry = parseISO(expiryDate);
  const daysUntilExpiry = differenceInDays(expiry, today);
  
  if (isBefore(expiry, today)) {
    return 'expired';
  } else if (daysUntilExpiry <= 30) {
    return 'expiring';
  } else {
    return 'valid';
  }
};

export const getExpiringCertificates = (certificates: Certificate[], daysAhead: number = 30): Certificate[] => {
  const today = new Date();
  
  return certificates.filter(cert => {
    const expiry = parseISO(cert.expiryDate);
    const daysUntilExpiry = differenceInDays(expiry, today);
    return daysUntilExpiry <= daysAhead && daysUntilExpiry > 0;
  });
};

export const getReplacementCertificateType = (certificateType: string): string | null => {
  const replacements: Record<string, string> = {
    'HDO': 'HDO-M',
    'VCA': 'VCA-VOL',
  };
  
  return replacements[certificateType] || null;
};

export const calculateCode95Points = (certificates: Certificate[]): { total: number; required: number } => {
  const code95Certificates = certificates.filter(cert => cert.code95Points && cert.code95Points > 0);
  const totalPoints = code95Certificates.reduce((sum, cert) => sum + (cert.code95Points || 0), 0);
  
  return {
    total: totalPoints,
    required: 35 // Standard Code 95 requirement
  };
};
