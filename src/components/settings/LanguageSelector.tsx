import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage, Language } from '@/context/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Globe } from 'lucide-react';

export function LanguageSelector() {
    const { t } = useTranslation(['common', 'auth']);
    const { language, setLanguage, isLoading } = useLanguage();

    const languages = [
        { code: 'nl' as Language, name: 'Nederlands', flag: '🇳🇱' },
        { code: 'en' as Language, name: 'English', flag: '🇺🇸' },
    ];

    const handleLanguageChange = (newLanguage: string) => {
        setLanguage(newLanguage as Language);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    {t('common:common.language')}
                </CardTitle>
                <CardDescription>
                    {t('auth:profile.preferences')} - Kies je voorkeurstaal / Choose your preferred language
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <RadioGroup
                        value={language}
                        onValueChange={handleLanguageChange}
                        disabled={isLoading}
                        className="grid grid-cols-1 gap-4"
                    >
                        {languages.map((lang) => (
                            <div key={lang.code} className="flex items-center space-x-3">
                                <RadioGroupItem
                                    value={lang.code}
                                    id={`language-${lang.code}`}
                                    className="peer sr-only"
                                />
                                <Label
                                    htmlFor={`language-${lang.code}`}
                                    className="flex items-center justify-between w-full p-4 border-2 border-muted bg-background hover:bg-accent hover:text-accent-foreground peer-checked:border-primary peer-checked:bg-primary/5 rounded-lg cursor-pointer transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{lang.flag}</span>
                                        <div>
                                            <div className="font-medium">{lang.name}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {lang.code === 'nl' ? 'Nederlandse interface' : 'English interface'}
                                            </div>
                                        </div>
                                    </div>
                                    {language === lang.code && (
                                        <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                            <div className="w-2 h-2 rounded-full bg-white" />
                                        </div>
                                    )}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>

                    {isLoading && (
                        <div className="text-sm text-muted-foreground">
                            {t('common:common.loading')}
                        </div>
                    )}

                    <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted/50 rounded-lg">
                        <strong>Note:</strong> Language changes take effect immediately. Your preference will be saved to your profile.
                        <br />
                        <strong>Opmerking:</strong> Taalwijzigingen worden direct toegepast. Je voorkeur wordt opgeslagen in je profiel.
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 