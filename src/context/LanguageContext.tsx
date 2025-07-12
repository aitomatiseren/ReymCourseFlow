import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';

export type Language = 'en' | 'nl';

interface LanguageContextType {
    language: Language;
    setLanguage: (language: Language) => void;
    isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
    children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
    const { i18n } = useTranslation();
    const [language, setLanguageState] = useState<Language>('nl'); // Default to Dutch
    const [isLoading, setIsLoading] = useState(true);

    // Load user language preference on mount
    useEffect(() => {
        const loadLanguagePreference = async () => {
            try {
                // First, check localStorage for immediate language setting
                const savedLanguage = localStorage.getItem('reym-language') as Language;
                if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'nl')) {
                    setLanguageState(savedLanguage);
                    i18n.changeLanguage(savedLanguage);
                }

                // Then, check if user is logged in and has a preference in the database
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase
                        .from('user_profiles')
                        .select('language_preference')
                        .eq('id', user.id)
                        .single();

                    if (profile?.language_preference && profile.language_preference !== savedLanguage) {
                        const dbLanguage = profile.language_preference as Language;
                        setLanguageState(dbLanguage);
                        i18n.changeLanguage(dbLanguage);
                        localStorage.setItem('reym-language', dbLanguage);
                    }
                }
            } catch (error) {
                console.error('Error loading language preference:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadLanguagePreference();
    }, [i18n]);

    const setLanguage = async (newLanguage: Language) => {
        try {
            setLanguageState(newLanguage);
            i18n.changeLanguage(newLanguage);
            localStorage.setItem('reym-language', newLanguage);

            // Save to database if user is logged in
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase
                    .from('user_profiles')
                    .upsert({
                        id: user.id,
                        language_preference: newLanguage,
                        updated_at: new Date().toISOString()
                    });
            }
        } catch (error) {
            console.error('Error saving language preference:', error);
        }
    };

    const value: LanguageContextType = {
        language,
        setLanguage,
        isLoading,
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
} 