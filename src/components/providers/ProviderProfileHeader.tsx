import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Edit, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Building2,
  Globe,
  Loader2,
  User,
  MapIcon
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EditProviderDialog } from "./EditProviderDialog";
import { format } from "date-fns";

const statusColors = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800"
};

interface ProviderProfileHeaderProps {
  providerId: string;
}

export function ProviderProfileHeader({ providerId }: ProviderProfileHeaderProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);

  const { data: provider, isLoading } = useQuery({
    queryKey: ["provider", providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_providers")
        .select(`
          *,
          course_provider_courses (
            course_id,
            price,
            cost_breakdown,
            courses (
              id,
              title,
              category
            )
          )
        `)
        .eq("id", providerId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading provider...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!provider) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Provider not found
          </div>
        </CardContent>
      </Card>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-semibold">
                  {getInitials(provider.name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{provider.name}</h1>
                  <Badge className={statusColors[provider.active ? 'active' : 'inactive']}>
                    {provider.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  {provider.contact_person && (
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Contact: {provider.contact_person}</span>
                    </div>
                  )}
                  
                  {provider.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${provider.email}`} className="text-blue-600 hover:underline">
                        {provider.email}
                      </a>
                    </div>
                  )}
                  
                  {provider.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${provider.phone}`} className="text-blue-600 hover:underline">
                        {provider.phone}
                      </a>
                    </div>
                  )}
                  
                  {provider.website && (
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4" />
                      <a 
                        href={provider.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {provider.website}
                      </a>
                    </div>
                  )}
                  
                  {(provider.address || provider.city || provider.country) && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {provider.address && (
                          <>
                            {provider.address}
                            {(provider.postcode || provider.city || provider.country) && ", "}
                          </>
                        )}
                        {provider.postcode && `${provider.postcode} `}
                        {provider.city}
                        {provider.country && provider.country !== "Netherlands" && `, ${provider.country}`}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Joined: {format(new Date(provider.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="mt-4 flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {provider.course_provider_courses?.length || 0}
                    </div>
                    <div className="text-xs text-gray-500">Courses Offered</div>
                  </div>
                  
                  {provider.additional_locations && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {provider.additional_locations.length}
                      </div>
                      <div className="text-xs text-gray-500">Training Locations</div>
                    </div>
                  )}
                  
                  {provider.instructors && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {provider.instructors.length}
                      </div>
                      <div className="text-xs text-gray-500">Instructors</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Button
              onClick={() => setShowEditDialog(true)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit Provider
            </Button>
          </div>
        </CardContent>
      </Card>

      {showEditDialog && (
        <EditProviderDialog
          provider={provider}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
        />
      )}
    </>
  );
}