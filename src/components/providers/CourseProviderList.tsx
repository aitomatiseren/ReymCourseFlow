import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  Edit,
  Eye,
} from "lucide-react";
import { EditProviderDialog } from "./EditProviderDialog";
import { ProviderDetailsDialog } from "./ProviderDetailsDialog";

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
  default_location: string | null;
  active: boolean;
  course_provider_courses: {
    course_id: string;
    courses: {
      id: string;
      title: string;
      category: string | null;
    };
  }[];
}

export function CourseProviderList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<CourseProvider | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const { data: providers, isLoading } = useQuery({
    queryKey: ["course-providers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_providers")
        .select(`
          *,
          course_provider_courses (
            course_id,
            courses (
              id,
              title,
              category
            )
          )
        `)
        .order("name");

      if (error) throw error;
      return data as CourseProvider[];
    },
  });

  const filteredProviders = providers?.filter(
    (provider) =>
      provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.contact_person?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (provider: CourseProvider) => {
    setSelectedProvider(provider);
    setShowEditDialog(true);
  };

  const handleView = (provider: CourseProvider) => {
    setSelectedProvider(provider);
    setShowDetailsDialog(true);
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
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Providers</CardTitle>
              <CardDescription>
                {filteredProviders?.length || 0} providers registered
              </CardDescription>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search providers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Courses</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProviders?.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        {provider.name}
                      </div>
                      {provider.website && (
                        <a
                          href={provider.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Globe className="h-3 w-3" />
                          Website
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      {provider.contact_person && (
                        <div>{provider.contact_person}</div>
                      )}
                      {provider.email && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <Mail className="h-3 w-3" />
                          {provider.email}
                        </div>
                      )}
                      {provider.phone && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <Phone className="h-3 w-3" />
                          {provider.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {provider.city && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          {provider.city}
                          {provider.country && provider.country !== "Netherlands" && (
                            <span className="text-gray-500">, {provider.country}</span>
                          )}
                        </div>
                      )}
                      {provider.default_location && (
                        <div className="text-gray-600 mt-1">
                          {provider.default_location}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">
                        {provider.course_provider_courses.length} courses
                      </div>
                      {provider.course_provider_courses.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {provider.course_provider_courses.slice(0, 2).map((cpc) => (
                            <Badge
                              key={cpc.course_id}
                              variant="outline"
                              className="text-xs"
                            >
                              {cpc.courses.title}
                            </Badge>
                          ))}
                          {provider.course_provider_courses.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{provider.course_provider_courses.length - 2} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
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
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(provider)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(provider)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredProviders?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No providers found matching your search
            </div>
          )}
        </CardContent>
      </Card>

      {selectedProvider && (
        <>
          <EditProviderDialog
            provider={selectedProvider}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
          />
          <ProviderDetailsDialog
            provider={selectedProvider}
            open={showDetailsDialog}
            onOpenChange={setShowDetailsDialog}
          />
        </>
      )}
    </>
  );
}