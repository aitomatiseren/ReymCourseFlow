import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Building2, Phone, Mail, MapPin, Star, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock data for providers - in a real app, this would come from the database
const mockProviders = [
    {
        id: "1",
        name: "Safety First Training",
        type: "Safety Training",
        contact: "John Smith",
        email: "contact@safetyfirst.com",
        phone: "+31 20 123 4567",
        address: "Amsterdam, Netherlands",
        rating: 4.8,
        coursesOffered: ["ADR Training", "VCA Certification", "BHV Training"],
        status: "active",
        lastUsed: "2024-01-15"
    },
    {
        id: "2",
        name: "TechSkills Academy",
        type: "Technical Training",
        contact: "Sarah Johnson",
        email: "info@techskills.com",
        phone: "+31 30 987 6543",
        address: "Utrecht, Netherlands",
        rating: 4.6,
        coursesOffered: ["Forklift Operation", "Crane Operation", "Technical Maintenance"],
        status: "active",
        lastUsed: "2024-01-10"
    },
    {
        id: "3",
        name: "Professional Development Group",
        type: "Management Training",
        contact: "Mike Wilson",
        email: "contact@pdgroup.com",
        phone: "+31 10 456 7890",
        address: "Rotterdam, Netherlands",
        rating: 4.9,
        coursesOffered: ["Leadership Training", "Project Management", "Communication Skills"],
        status: "active",
        lastUsed: "2024-01-08"
    }
];

export default function Providers() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedType, setSelectedType] = useState("all");
    const [providers] = useState(mockProviders);
    const { toast } = useToast();

    const filteredProviders = providers.filter(provider => {
        const matchesSearch = provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            provider.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
            provider.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = selectedType === "all" || provider.type === selectedType;

        return matchesSearch && matchesType;
    });

    const handleAddProvider = () => {
        toast({
            title: "Coming Soon",
            description: "Add provider functionality will be implemented soon.",
        });
    };

    const handleEditProvider = (providerId: string) => {
        toast({
            title: "Coming Soon",
            description: "Edit provider functionality will be implemented soon.",
        });
    };

    const handleDeleteProvider = (providerId: string) => {
        toast({
            title: "Coming Soon",
            description: "Delete provider functionality will be implemented soon.",
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'inactive': return 'bg-gray-100 text-gray-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Training Providers</h1>
                        <p className="text-gray-600 mt-1">Manage external training providers and their course offerings.</p>
                    </div>
                    <Button onClick={handleAddProvider}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Provider
                    </Button>
                </div>

                {/* Search and Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search providers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Types</option>
                        <option value="Safety Training">Safety Training</option>
                        <option value="Technical Training">Technical Training</option>
                        <option value="Management Training">Management Training</option>
                    </select>
                </div>

                {/* Providers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProviders.map((provider) => (
                        <Card key={provider.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <Building2 className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{provider.name}</CardTitle>
                                            <CardDescription>{provider.type}</CardDescription>
                                        </div>
                                    </div>
                                    <Badge className={getStatusColor(provider.status)}>
                                        {provider.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                        <Mail className="h-4 w-4" />
                                        <span>{provider.email}</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                        <Phone className="h-4 w-4" />
                                        <span>{provider.phone}</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                        <MapPin className="h-4 w-4" />
                                        <span>{provider.address}</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                        <Star className="h-4 w-4 text-yellow-500" />
                                        <span>{provider.rating}/5.0</span>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium text-sm mb-2">Courses Offered:</h4>
                                    <div className="flex flex-wrap gap-1">
                                        {provider.coursesOffered.map((course, index) => (
                                            <Badge key={index} variant="secondary" className="text-xs">
                                                {course}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex space-x-2 pt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEditProvider(provider.id)}
                                        className="flex-1"
                                    >
                                        <Edit className="h-4 w-4 mr-1" />
                                        Edit
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteProvider(provider.id)}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {filteredProviders.length === 0 && (
                    <div className="text-center py-12">
                        <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No providers found</h3>
                        <p className="text-gray-600">
                            {searchTerm ? "Try adjusting your search criteria." : "Get started by adding your first training provider."}
                        </p>
                    </div>
                )}
            </div>
        </Layout>
    );
} 