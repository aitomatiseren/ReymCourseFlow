import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Shield, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { UserRole, UserProfile } from '@/types/permissions';

interface UserProfileWithRole extends UserProfile {
    role: UserRole;
    employee: {
        name: string;
        email: string;
        department: string;
    };
}

export function UserRoleManager() {
    const [userProfiles, setUserProfiles] = useState<UserProfileWithRole[]>([]);
    const [roles, setRoles] = useState<UserRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch roles
            const { data: rolesData, error: rolesError } = await supabase
                .from('user_roles')
                .select('*')
                .eq('is_active', true)
                .order('name', { ascending: true });

            if (rolesError) throw rolesError;

            // Fetch user profiles with roles and employee data
            const { data: profilesData, error: profilesError } = await supabase
                .from('user_profiles')
                .select(`
                    *,
                    role:user_roles(*),
                    employee:employees(name, email, department)
                `)
                .eq('is_active', true);

            if (profilesError) throw profilesError;

            setRoles(rolesData || []);
            setUserProfiles(profilesData?.filter(p => p.employee && p.role) || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load user data');
        } finally {
            setLoading(false);
        }
    };

    const updateUserRole = async (userId: string, newRoleId: string) => {
        try {
            setUpdating(userId);

            const { error } = await supabase
                .from('user_profiles')
                .update({ role_id: newRoleId })
                .eq('id', userId);

            if (error) throw error;

            toast.success('User role updated successfully');
            fetchData(); // Refresh data
        } catch (error) {
            console.error('Error updating user role:', error);
            toast.error('Failed to update user role');
        } finally {
            setUpdating(null);
        }
    };

    const getRoleBadgeColor = (roleName: string) => {
        switch (roleName) {
            case 'admin': return 'bg-red-100 text-red-800 border-red-200';
            case 'hr': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'manager': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'instructor': return 'bg-green-100 text-green-800 border-green-200';
            case 'employee': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                Loading user data...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            User Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm font-medium">Total Users:</span>
                                <span className="text-sm">{userProfiles.length}</span>
                            </div>
                            {roles.map(role => (
                                <div key={role.id} className="flex justify-between">
                                    <span className="text-sm">{role.display_name}:</span>
                                    <span className="text-sm">
                                        {userProfiles.filter(p => p.role?.id === role.id).length}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Available Roles
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {roles.map(role => (
                                <div key={role.id} className="flex items-center justify-between">
                                    <div>
                                        <span className="text-sm font-medium">{role.display_name}</span>
                                        <p className="text-xs text-gray-500">{role.description}</p>
                                    </div>
                                    <Badge className={getRoleBadgeColor(role.name)}>
                                        {role.name}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        User Role Management
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {userProfiles.length === 0 ? (
                        <div className="text-center py-8">
                            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No users found</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Current Role</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {userProfiles.map((profile) => (
                                    <TableRow key={profile.id}>
                                        <TableCell>
                                            <div className="font-medium">{profile.employee.name}</div>
                                        </TableCell>
                                        <TableCell>{profile.employee.email}</TableCell>
                                        <TableCell>{profile.employee.department}</TableCell>
                                        <TableCell>
                                            <Badge className={getRoleBadgeColor(profile.role.name)}>
                                                {profile.role.display_name}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                value={profile.role_id || ''}
                                                onValueChange={(value) => updateUserRole(profile.id, value)}
                                                disabled={updating === profile.id}
                                            >
                                                <SelectTrigger className="w-40">
                                                    <SelectValue placeholder="Select role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {roles.map(role => (
                                                        <SelectItem key={role.id} value={role.id}>
                                                            {role.display_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 