import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Import translation resources
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enTraining from './locales/en/training.json';
import enEmployees from './locales/en/employees.json';
import enCertificates from './locales/en/certificates.json';
import enProviders from './locales/en/providers.json';
import enReports from './locales/en/reports.json';
import enAi from './locales/en/ai.json';

import nlCommon from './locales/nl/common.json';
import nlAuth from './locales/nl/auth.json';
import nlTraining from './locales/nl/training.json';
import nlEmployees from './locales/nl/employees.json';
import nlCertificates from './locales/nl/certificates.json';
import nlProviders from './locales/nl/providers.json';
import nlReports from './locales/nl/reports.json';
import nlAi from './locales/nl/ai.json';

const resources = {
    en: {
        common: enCommon,
        auth: enAuth,
        training: enTraining,
        employees: enEmployees,
        certificates: enCertificates,
        providers: enProviders,
        reports: enReports,
        ai: enAi,
    },
    nl: {
        common: nlCommon,
        auth: nlAuth,
        training: nlTraining,
        employees: nlEmployees,
        certificates: nlCertificates,
        providers: nlProviders,
        reports: nlReports,
        ai: nlAi,
    },
};

i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        lng: 'nl', // Default to Dutch for Dutch business market
        fallbackLng: 'en',

        // Namespace configuration
        ns: ['common', 'auth', 'training', 'employees', 'certificates', 'providers', 'reports', 'ai'],
        defaultNS: 'common',

        debug: process.env.NODE_ENV === 'development',

        interpolation: {
            escapeValue: false, // React already escapes by default
        },

        detection: {
            order: ['localStorage', 'sessionStorage', 'navigator', 'htmlTag'],
            lookupLocalStorage: 'reym-language',
            lookupSessionStorage: 'reym-language',
            caches: ['localStorage', 'sessionStorage'],
        },

        react: {
            useSuspense: false,
        },
    });

export default i18n; 