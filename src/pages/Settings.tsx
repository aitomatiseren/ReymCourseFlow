import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { UserRoleManager } from '@/components/admin/UserRoleManager';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon, Users, Shield, Database } from 'lucide-react';

export default function Settings() {
    return (
        <Layout>
            <div className="space-y-6 p-6">
                <div className="flex items-center gap-2">
                    <SettingsIcon className="h-8 w-8" />
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
                        <p className="text-gray-600 mt-1">Configure system settings and manage user permissions.</p>
                    </div>
                </div>

                <Tabs defaultValue="user-management" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="user-management" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            User Management
                        </TabsTrigger>
                        <TabsTrigger value="permissions" className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Permissions
                        </TabsTrigger>
                        <TabsTrigger value="system" className="flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            System
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="user-management" className="space-y-4">
                        <UserRoleManager />
                    </TabsContent>

                    <TabsContent value="permissions" className="space-y-4">
                        <PermissionGate permissions={['view_audit_logs']}>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="h-5 w-5" />
                                        Permission System Overview
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-lg font-medium mb-4">Role Overview</h3>
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <p className="text-sm text-gray-600 mb-3">
                                                    The system uses role-based access control with the following roles:
                                                </p>
                                                <ul className="text-sm space-y-1 text-gray-700">
                                                    <li>• <strong>Employee</strong> - Basic access to own information</li>
                                                    <li>• <strong>Instructor</strong> - Training session management</li>
                                                    <li>• <strong>Manager</strong> - Team oversight and approvals</li>
                                                    <li>• <strong>HR</strong> - Company-wide employee and training management</li>
                                                    <li>• <strong>Admin</strong> - Full system access and administration</li>
                                                </ul>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-medium mb-4">Permission System</h3>
                                            <p className="text-sm text-gray-600 mb-4">
                                                Each user is assigned a role that determines their specific access permissions.
                                                Roles have independent permission sets tailored to their responsibilities.
                                            </p>
                                        </div>

                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <h4 className="font-semibold text-blue-900 mb-2">How Permissions Work</h4>
                                            <p className="text-sm text-blue-800">
                                                Each user is assigned a role that grants them specific permissions for their job function.
                                                Roles are independent and have their own unique set of permissions.
                                                Permissions are checked both in the UI (to show/hide features) and in the backend
                                                (to enforce data access rules).
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
                                        System Configuration
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                            <h4 className="font-semibold text-yellow-900 mb-2">System Settings</h4>
                                            <p className="text-sm text-yellow-800">
                                                System configuration options will be available here. This includes
                                                database settings, integration configurations, and system-wide preferences.
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="border rounded-lg p-4">
                                                <h3 className="font-semibold mb-2">Database Status</h3>
                                                <p className="text-sm text-green-600">✓ Connected to Supabase</p>
                                                <p className="text-sm text-green-600">✓ Row Level Security enabled</p>
                                                <p className="text-sm text-green-600">✓ User roles configured</p>
                                            </div>
                                            <div className="border rounded-lg p-4">
                                                <h3 className="font-semibold mb-2">Features</h3>
                                                <p className="text-sm text-green-600">✓ User management system</p>
                                                <p className="text-sm text-green-600">✓ Permission-based access</p>
                                                <p className="text-sm text-green-600">✓ Role-based permissions</p>
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