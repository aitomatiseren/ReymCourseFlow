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
    <Tabs defaultValue="courses" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
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
        {/* Training Locations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Training Locations ({provider?.additional_locations?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {provider?.additional_locations && provider.additional_locations.length > 0 ? (
              <div className="space-y-4">
                {provider.additional_locations.map((location: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium">
                          {typeof location === 'string' ? location : location.name || 'Unnamed Location'}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          <MapPin className="h-3 w-3 mr-1" />
                          Location
                        </Badge>
                      </div>
                      {typeof location === 'object' && location.address && (
                        <div className="text-sm text-gray-600 mt-2">
                          <div>{location.address}</div>
                          {(location.postcode || location.city) && (
                            <div>
                              {location.postcode && `${location.postcode} `}
                              {location.city}
                              {location.country && location.country !== 'Netherlands' && `, ${location.country}`}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No training locations specified for this provider
              </p>
            )}
          </CardContent>
        </Card>

        {/* Instructors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Instructors ({provider?.instructors?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {provider?.instructors && provider.instructors.length > 0 ? (
              <div className="space-y-4">
                {provider.instructors.map((instructor: string, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium">{instructor}</h3>
                        <Badge variant="outline" className="text-xs">
                          <User className="h-3 w-3 mr-1" />
                          Instructor
                        </Badge>
                      </div>
                    </div>
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
      </TabsContent>
    </Tabs>
  );
}