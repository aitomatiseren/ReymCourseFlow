import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Calendar, 
  FileText, 
  MapPin,
  User,
  BookOpen,
  Activity,
  Info
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProviderProfileTabsProps {
  providerId: string;
}

export function ProviderProfileTabs({ providerId }: ProviderProfileTabsProps) {
  const { data: provider } = useQuery({
    queryKey: ["provider", providerId],
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
              category,
              duration_hours,
              price
            )
          )
        `)
        .eq("id", providerId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Query for trainings associated with this provider
  const { data: trainings } = useQuery({
    queryKey: ["provider-trainings", providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trainings")
        .select(`
          id,
          title,
          date,
          time,
          status,
          location,
          instructor,
          max_participants,
          courses (
            title,
            category
          )
        `)
        .eq("provider_id", providerId)
        .order("date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const statusColors = {
    scheduled: "bg-blue-100 text-blue-800",
    confirmed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    completed: "bg-gray-100 text-gray-800"
  };

  return (
    <Tabs defaultValue="basic" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="basic" className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          Basic Information
        </TabsTrigger>
        <TabsTrigger value="courses" className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Offered Courses
        </TabsTrigger>
        <TabsTrigger value="trainings" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Planned Courses
        </TabsTrigger>
        <TabsTrigger value="locations" className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Locations & Instructors
        </TabsTrigger>
      </TabsList>

      {/* Basic Information Tab */}
      <TabsContent value="basic" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {provider?.contact_person && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Contact Person</label>
                  <p className="text-sm">{provider.contact_person}</p>
                </div>
              )}
              {provider?.email && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-sm">
                    <a href={`mailto:${provider.email}`} className="text-blue-600 hover:underline">
                      {provider.email}
                    </a>
                  </p>
                </div>
              )}
              {provider?.phone && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone</label>
                  <p className="text-sm">
                    <a href={`tel:${provider.phone}`} className="text-blue-600 hover:underline">
                      {provider.phone}
                    </a>
                  </p>
                </div>
              )}
              {provider?.website && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Website</label>
                  <p className="text-sm">
                    <a 
                      href={provider.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {provider.website}
                    </a>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle>Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {provider?.address && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Street Address</label>
                  <p className="text-sm">{provider.address}</p>
                </div>
              )}
              {(provider?.postcode || provider?.city) && (
                <div>
                  <label className="text-sm font-medium text-gray-600">City</label>
                  <p className="text-sm">
                    {provider.postcode && `${provider.postcode} `}
                    {provider.city}
                  </p>
                </div>
              )}
              {provider?.country && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Country</label>
                  <p className="text-sm">{provider.country}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        {provider?.description && (
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{provider.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Internal Notes */}
        {provider?.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-yellow-700">Internal Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap bg-yellow-50 p-3 rounded">{provider.notes}</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Offered Courses Tab */}
      <TabsContent value="courses" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>
              Offered Courses ({provider?.course_provider_courses?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {provider?.course_provider_courses && provider.course_provider_courses.length > 0 ? (
              <div className="space-y-4">
                {provider.course_provider_courses.map((cpc: any) => (
                  <div
                    key={cpc.course_id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium">{cpc.courses.title}</h3>
                        {cpc.courses.category && (
                          <Badge variant="outline" className="text-xs">
                            {cpc.courses.category}
                          </Badge>
                        )}
                      </div>
                      {(cpc.courses.duration_hours || cpc.courses.price) && (
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          {cpc.courses.duration_hours && (
                            <span>{cpc.courses.duration_hours} hours</span>
                          )}
                          {cpc.courses.price && (
                            <span>€{cpc.courses.price}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No courses currently offered by this provider
              </p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Planned Courses Tab */}
      <TabsContent value="trainings" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>
              Planned Training Sessions ({trainings?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trainings && trainings.length > 0 ? (
              <div className="space-y-4">
                {trainings.map((training: any) => (
                  <div
                    key={training.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium">{training.title}</h3>
                        <Badge className={statusColors[training.status as keyof typeof statusColors]}>
                          {training.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>Date: {new Date(training.date).toLocaleDateString()}</div>
                        <div>Time: {training.time}</div>
                        <div>Location: {training.location || 'TBD'}</div>
                        <div>Instructor: {training.instructor || 'TBD'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No training sessions currently planned with this provider
              </p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Locations & Instructors Tab */}
      <TabsContent value="locations" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Training Locations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Training Locations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {provider?.additional_locations && provider.additional_locations.length > 0 ? (
                <div className="space-y-2">
                  {provider.additional_locations.map((location: string, index: number) => (
                    <div key={index} className="p-2 bg-gray-50 rounded text-sm font-semibold">
                      {location}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No additional training locations specified
                </p>
              )}
            </CardContent>
          </Card>

          {/* Instructors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Instructors
              </CardTitle>
            </CardHeader>
            <CardContent>
              {provider?.instructors && provider.instructors.length > 0 ? (
                <div className="space-y-2">
                  {provider.instructors.map((instructor: string, index: number) => (
                    <div key={index} className="p-2 bg-gray-50 rounded text-sm font-medium">
                      {instructor}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No instructors specified for this provider
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}