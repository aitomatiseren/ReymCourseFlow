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
  Info,
  Award,
  Trophy
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
            price,
            cost_breakdown,
            number_of_sessions,
            max_participants,
            notes,
            courses (
              id,
              title,
              duration_hours,
              course_certificates (
                id,
                grants_level,
                is_required,
                renewal_eligible,
                licenses (
                  id,
                  name,
                  description,
                  validity_period_months
                )
              )
            )
          )
        `)
        .eq("id", providerId)
        .single();

      if (error) throw error;
      return data;
    },
    staleTime: 0, // Always refetch when invalidated
    cacheTime: 0, // Don't cache for too long
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
          cost_breakdown,
          courses (
            title
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
                      </div>
                      
                      {/* Certificate information */}
                      {cpc.courses.course_certificates && cpc.courses.course_certificates.length > 0 && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center space-x-2">
                            <Award className="h-4 w-4" />
                            <span>Certificates Granted</span>
                          </h4>
                          <div className="space-y-2">
                            {cpc.courses.course_certificates.map((cert: any) => (
                              <div key={cert.id} className="border rounded-lg p-3 bg-gray-50">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <Trophy className="h-4 w-4 text-yellow-600" />
                                    <div>
                                      <h5 className="font-medium text-gray-900 text-sm">
                                        {cert.licenses?.name || 'Unknown Certificate'}
                                      </h5>
                                      <div className="flex items-center space-x-2 mt-1">
                                        {cert.licenses?.description && (
                                          <span className="text-xs text-gray-600">
                                            {cert.licenses.description}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    {cert.grants_level && (
                                      <div className="text-xs font-medium text-gray-900">
                                        Grants Level: {cert.grants_level}
                                      </div>
                                    )}
                                    <div className="flex space-x-1 mt-1">
                                      {cert.is_required && (
                                        <Badge variant="destructive" className="text-xs">
                                          Required
                                        </Badge>
                                      )}
                                      {cert.renewal_eligible && (
                                        <Badge variant="secondary" className="text-xs">
                                          Renewal Eligible
                                        </Badge>
                                      )}
                                    </div>
                                    {cert.licenses?.validity_period_months && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        Valid for {cert.licenses.validity_period_months} months
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="space-y-3">
                        {/* Course details */}
                        <div className="flex space-x-4 text-sm text-gray-600">
                          {cpc.courses.duration_hours && (
                            <span>{cpc.courses.duration_hours} hours per session</span>
                          )}
                          {cpc.number_of_sessions && (
                            <span>• {cpc.number_of_sessions} session{cpc.number_of_sessions !== 1 ? 's' : ''}</span>
                          )}
                          {cpc.max_participants && (
                            <span>• Max {cpc.max_participants} participants</span>
                          )}
                        </div>
                        
                        {/* Provider pricing */}
                        {cpc.price && (
                          <div className="text-lg font-semibold text-gray-900">
                            Total Price: €{cpc.price}
                          </div>
                        )}
                        
                        {/* Cost breakdown */}
                        {cpc.cost_breakdown && Array.isArray(cpc.cost_breakdown) && cpc.cost_breakdown.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <h5 className="text-sm font-medium text-gray-900 mb-2">Cost Breakdown</h5>
                            <div className="space-y-1">
                              {cpc.cost_breakdown.map((component: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center text-sm">
                                  <span className="text-gray-600">
                                    {component.name}
                                    {component.description && (
                                      <span className="text-gray-500 ml-1">({component.description})</span>
                                    )}
                                  </span>
                                  <span className="font-medium">€{component.amount?.toFixed(2) || '0.00'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
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
                      
                      {/* Cost Breakdown Section */}
                      {training.cost_breakdown && Array.isArray(training.cost_breakdown) && training.cost_breakdown.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h5 className="font-medium text-sm text-gray-900 mb-2">Cost Breakdown</h5>
                          <div className="space-y-2">
                            {training.cost_breakdown.map((component: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">
                                  {component.name}
                                  {component.description && (
                                    <span className="text-gray-500 ml-1">({component.description})</span>
                                  )}
                                </span>
                                <span className="font-medium">€{component.amount?.toFixed(2) || '0.00'}</span>
                              </div>
                            ))}
                            <div className="flex justify-between items-center text-sm font-semibold pt-2 border-t border-gray-100">
                              <span>Total Cost</span>
                              <span>€{training.cost_breakdown.reduce((sum: number, comp: any) => sum + (comp.amount || 0), 0).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      )}
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