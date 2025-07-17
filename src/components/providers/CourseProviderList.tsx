import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProviders } from "@/hooks/useProviders";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Search,
  Eye,
} from "lucide-react";

interface ProviderLocation {
  name: string;
  address: string;
  postcode?: string;
  city?: string;
  country?: string;
}

interface CourseProvider {
  id: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  additional_locations: ProviderLocation[] | string[] | null;
  instructors: string[] | null;
  active: boolean;
  course_provider_courses: {
    course_id: string;
    courses: {
      id: string;
      title: string;
    };
  }[];
}

interface CourseProviderListProps {
  searchTerm?: string;
}

export function CourseProviderList({ searchTerm = "" }: CourseProviderListProps) {
  const navigate = useNavigate();

  const { data: providers, isLoading } = useProviders(true) as { data: CourseProvider[] | undefined, isLoading: boolean };

  const filteredProviders = providers?.filter(
    (provider) =>
      provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.contact_person?.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const handleView = (provider: CourseProvider) => {
    navigate(`/providers/${provider.id}`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading providers...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Provider</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Website</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProviders?.map((provider) => (
              <TableRow key={provider.id} className="hover:bg-gray-50">
                <TableCell>
                  <div className="font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    {provider.name}
                  </div>
                  {provider.city && (
                    <div className="text-sm text-gray-500">{provider.city}</div>
                  )}
                </TableCell>
                <TableCell>
                  {provider.phone ? (
                    <a href={`tel:${provider.phone}`} className="text-blue-600 hover:underline text-sm">
                      {provider.phone}
                    </a>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {provider.email ? (
                    <a href={`mailto:${provider.email}`} className="text-blue-600 hover:underline text-sm">
                      {provider.email}
                    </a>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {provider.website ? (
                    <a 
                      href={provider.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      {provider.website}
                    </a>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={provider.active ? "default" : "secondary"}
                    className={provider.active ? "bg-green-100 text-green-800" : ""}
                  >
                    {provider.active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    className="bg-slate-800 text-white hover:bg-slate-900"
                    onClick={() => handleView(provider)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredProviders?.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No providers found matching your search
          </div>
        )}
      </CardContent>
    </Card>
  );
}