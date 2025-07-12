import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  Globe, 
  Building2,
  Eye,
  Loader2,
  MapPin
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
      category: string | null;
    };
  }[];
}

export function CourseProviderGrid() {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleView = (provider: CourseProvider) => {
    navigate(`/providers/${provider.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading providers...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search providers..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Provider Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProviders?.map((provider) => (
          <Card key={provider.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {getInitials(provider.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                    {provider.contact_person && (
                      <p className="text-sm text-gray-500">Contact: {provider.contact_person}</p>
                    )}
                  </div>
                </div>
                <Badge
                  variant={provider.active ? "default" : "secondary"}
                  className={provider.active ? "bg-green-100 text-green-800" : ""}
                >
                  {provider.active ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="space-y-2 mb-4">
                {provider.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    <a href={`mailto:${provider.email}`} className="text-blue-600 hover:underline">
                      {provider.email}
                    </a>
                  </div>
                )}
                {provider.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    <a href={`tel:${provider.phone}`} className="text-blue-600 hover:underline">
                      {provider.phone}
                    </a>
                  </div>
                )}
                {provider.website && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Globe className="h-4 w-4 mr-2" />
                    <a 
                      href={provider.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Website
                    </a>
                  </div>
                )}
                {provider.city && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {provider.city}
                    {provider.country && provider.country !== "Netherlands" && (
                      <span className="text-gray-500">, {provider.country}</span>
                    )}
                  </div>
                )}
              </div>

              {provider.course_provider_courses && provider.course_provider_courses.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">COURSES OFFERED</p>
                  <div className="flex flex-wrap gap-1">
                    {provider.course_provider_courses.slice(0, 3).map((cpc) => (
                      <Badge
                        key={cpc.course_id}
                        variant="outline"
                        className="text-xs"
                      >
                        {cpc.courses.title}
                      </Badge>
                    ))}
                    {provider.course_provider_courses.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{provider.course_provider_courses.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <Button 
                  size="sm"
                  className="flex-1 bg-slate-800 text-white hover:bg-slate-900"
                  onClick={() => handleView(provider)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProviders?.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No providers found matching your criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}