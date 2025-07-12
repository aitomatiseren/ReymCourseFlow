import React from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/layout/Layout';
import { UserRoleManager } from '@/components/admin/UserRoleManager';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { LanguageSelector } from '@/components/settings/LanguageSelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon, Users, Shield, Database, Globe } from 'lucide-react';

export default function Settings() {
    const { t } = useTranslation(['common', 'auth']);

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{t('common:settings.title')}</h1>
                        <p className="text-gray-600 mt-1">{t('common:settings.subtitle')}</p>
                    </div>
                </div>

                <Tabs defaultValue="preferences" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="preferences" className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            {t('common:settings.preferences')}
                        </TabsTrigger>
                        <TabsTrigger value="user-management" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {t('common:settings.userManagement')}
                        </TabsTrigger>
                        <TabsTrigger value="permissions" className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            {t('common:settings.permissions')}
                        </TabsTrigger>
                        <TabsTrigger value="system" className="flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            {t('common:settings.system')}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="preferences" className="space-y-4">
                        <LanguageSelector />
                    </TabsContent>

                    <TabsContent value="user-management" className="space-y-4">
                        <UserRoleManager />
                    </TabsContent>

                    <TabsContent value="permissions" className="space-y-4">
                        <PermissionGate permissions={['view_audit_logs']}>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="h-5 w-5" />
                                        {t('common:settings.permissionSystemOverview')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-lg font-medium mb-4">{t('common:settings.roleOverview')}</h3>
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <p className="text-sm text-gray-600 mb-3">
                                                    {t('common:settings.roleDescription')}
                                                </p>
                                                <ul className="text-sm space-y-1 text-gray-700">
                                                    <li>• {t('common:settings.employeeRole')}</li>
                                                    <li>• {t('common:settings.instructorRole')}</li>
                                                    <li>• {t('common:settings.managerRole')}</li>
                                                    <li>• {t('common:settings.hrRole')}</li>
                                                    <li>• {t('common:settings.adminRole')}</li>
                                                </ul>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-medium mb-4">{t('common:settings.permissionSystem')}</h3>
                                            <p className="text-sm text-gray-600 mb-4">
                                                {t('common:settings.permissionDescription')}
                                            </p>
                                        </div>

                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <h4 className="font-semibold text-blue-900 mb-2">{t('common:settings.howPermissionsWork')}</h4>
                                            <p className="text-sm text-blue-800">
                                                {t('common:settings.permissionWorkDescription')}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </PermissionGate>
                    </TabsContent>

                    <TabsContent value="system" className="space-y-4">
                        <PermissionGate permissions={['manage_system_settings']}>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Database className="h-5 w-5" />
                                        {t('common:settings.systemConfiguration')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                            <h4 className="font-semibold text-yellow-900 mb-2">{t('common:settings.title')}</h4>
                                            <p className="text-sm text-yellow-800">
                                                {t('common:settings.systemSettingsNote')}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="border rounded-lg p-4">
                                                <h3 className="font-semibold mb-2">{t('common:settings.databaseStatus')}</h3>
                                                <p className="text-sm text-green-600">{t('common:settings.connectedToSupabase')}</p>
                                                <p className="text-sm text-green-600">{t('common:settings.rlsEnabled')}</p>
                                                <p className="text-sm text-green-600">{t('common:settings.userRolesConfigured')}</p>
                                            </div>
                                            <div className="border rounded-lg p-4">
                                                <h3 className="font-semibold mb-2">{t('common:settings.features')}</h3>
                                                <p className="text-sm text-green-600">{t('common:settings.userManagementSystem')}</p>
                                                <p className="text-sm text-green-600">{t('common:settings.permissionBasedAccess')}</p>
                                                <p className="text-sm text-green-600">{t('common:settings.roleBasedPermissions')}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </PermissionGate>
                    </TabsContent>
                </Tabs>
            </div>
        </Layout>
    );
} 