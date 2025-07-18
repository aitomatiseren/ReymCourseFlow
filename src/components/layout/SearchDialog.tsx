
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, User, Calendar, BookOpen, Building2, Award, PenTool, FileText, Shield } from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { useTrainings } from "@/hooks/useTrainings";
import { useCourses } from "@/hooks/useCourses";
import { useLicenses } from "@/hooks/useCertificates";
import { usePreliminaryPlans } from "@/hooks/usePreliminaryPlanning";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const { t } = useTranslation('common');
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const { data: employees = [] } = useEmployees();
  const { data: trainings = [] } = useTrainings();
  const { data: courses = [] } = useCourses();
  const { data: certificates = [] } = useLicenses();
  const { data: preliminaryPlans = [] } = usePreliminaryPlans();

  const { data: providers = [] } = useQuery({
    queryKey: ["course-providers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_providers")
        .select("*")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(query.toLowerCase()) ||
    employee.email.toLowerCase().includes(query.toLowerCase()) ||
    employee.employeeNumber.toLowerCase().includes(query.toLowerCase())
  );

  const filteredTrainings = trainings.filter(training =>
    training.title.toLowerCase().includes(query.toLowerCase()) ||
    training.instructor?.toLowerCase().includes(query.toLowerCase())
  );

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(query.toLowerCase()) ||
    course.description?.toLowerCase().includes(query.toLowerCase())
  );

  const filteredProviders = providers.filter(provider =>
    provider.name.toLowerCase().includes(query.toLowerCase()) ||
    provider.contact_person?.toLowerCase().includes(query.toLowerCase()) ||
    provider.city?.toLowerCase().includes(query.toLowerCase()) ||
    provider.email?.toLowerCase().includes(query.toLowerCase())
  );

  const filteredCertificates = certificates.filter(certificate =>
    certificate.name.toLowerCase().includes(query.toLowerCase()) ||
    certificate.category?.toLowerCase().includes(query.toLowerCase()) ||
    certificate.description?.toLowerCase().includes(query.toLowerCase())
  );

  const filteredPlans = preliminaryPlans.filter(plan =>
    plan.name.toLowerCase().includes(query.toLowerCase()) ||
    plan.description?.toLowerCase().includes(query.toLowerCase())
  );

  // Add static navigation items for reports and settings
  const staticItems = [
    { name: "Reports", description: "View training and certificate reports", path: "/reports", icon: FileText },
    { name: "Certificate Definitions", description: "Manage certificate types and hierarchy", path: "/certificate-definitions", icon: Award },
    { name: "Certificate Expiry", description: "Monitor expiring certificates", path: "/certificate-expiry", icon: Award },
    { name: "Settings", description: "System configuration and preferences", path: "/settings", icon: Shield },
  ];

  const filteredStaticItems = staticItems.filter(item =>
    item.name.toLowerCase().includes(query.toLowerCase()) ||
    item.description.toLowerCase().includes(query.toLowerCase())
  );

  const handleEmployeeClick = (employeeId: string) => {
    navigate(`/participants/${employeeId}`);
    onOpenChange(false);
    setQuery("");
  };

  const handleTrainingClick = (trainingId: string) => {
    navigate(`/scheduling?training=${trainingId}`);
    onOpenChange(false);
    setQuery("");
  };

  const handleCourseClick = (courseId: string) => {
    navigate(`/courses/${courseId}`);
    onOpenChange(false);
    setQuery("");
  };

  const handleProviderClick = (providerId: string) => {
    navigate(`/providers/${providerId}`);
    onOpenChange(false);
    setQuery("");
  };

  const handleCertificateClick = (certificateId: string) => {
    navigate(`/certificate-definitions?certificate=${certificateId}`);
    onOpenChange(false);
    setQuery("");
  };

  const handlePlanClick = (planId: string) => {
    navigate(`/preliminary-planning?plan=${planId}`);
    onOpenChange(false);
    setQuery("");
  };

  const handleStaticItemClick = (path: string) => {
    navigate(path);
    onOpenChange(false);
    setQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('search.title')}</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t('search.placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {query && (
          <div className="max-h-96 overflow-y-auto space-y-4">
            {/* Employees */}
            {filteredEmployees.length > 0 && (
              <div>
                <h3 className="font-medium text-sm text-gray-500 mb-2">{t('search.employees')}</h3>
                <div className="space-y-1">
                  {filteredEmployees.slice(0, 5).map((employee) => (
                    <Button
                      key={employee.id}
                      variant="ghost"
                      className="w-full justify-start p-3 h-auto"
                      onClick={() => handleEmployeeClick(employee.id)}
                    >
                      <User className="h-4 w-4 mr-3 flex-shrink-0" />
                      <div className="text-left">
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-sm text-gray-500">
                          {employee.jobTitle} • {employee.employeeNumber}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Trainings */}
            {filteredTrainings.length > 0 && (
              <div>
                <h3 className="font-medium text-sm text-gray-500 mb-2">{t('search.trainings')}</h3>
                <div className="space-y-1">
                  {filteredTrainings.slice(0, 5).map((training) => (
                    <Button
                      key={training.id}
                      variant="ghost"
                      className="w-full justify-start p-3 h-auto"
                      onClick={() => handleTrainingClick(training.id)}
                    >
                      <Calendar className="h-4 w-4 mr-3 flex-shrink-0" />
                      <div className="text-left">
                        <div className="font-medium">{training.title}</div>
                        <div className="text-sm text-gray-500">
                          {training.date} • {training.instructor}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Courses */}
            {filteredCourses.length > 0 && (
              <div>
                <h3 className="font-medium text-sm text-gray-500 mb-2">{t('search.courses')}</h3>
                <div className="space-y-1">
                  {filteredCourses.slice(0, 5).map((course) => (
                    <Button
                      key={course.id}
                      variant="ghost"
                      className="w-full justify-start p-3 h-auto"
                      onClick={() => handleCourseClick(course.id)}
                    >
                      <BookOpen className="h-4 w-4 mr-3 flex-shrink-0" />
                      <div className="text-left">
                        <div className="font-medium">{course.title}</div>
                        {course.description && (
                          <div className="text-sm text-gray-500">
                            {course.description}
                          </div>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Providers */}
            {filteredProviders.length > 0 && (
              <div>
                <h3 className="font-medium text-sm text-gray-500 mb-2">{t('search.providers')}</h3>
                <div className="space-y-1">
                  {filteredProviders.slice(0, 5).map((provider) => (
                    <Button
                      key={provider.id}
                      variant="ghost"
                      className="w-full justify-start p-3 h-auto"
                      onClick={() => handleProviderClick(provider.id)}
                    >
                      <Building2 className="h-4 w-4 mr-3 flex-shrink-0" />
                      <div className="text-left">
                        <div className="font-medium">{provider.name}</div>
                        {provider.contact_person && (
                          <div className="text-sm text-gray-500">
                            {provider.contact_person} • {provider.city}
                          </div>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Certificates */}
            {filteredCertificates.length > 0 && (
              <div>
                <h3 className="font-medium text-sm text-gray-500 mb-2">Certificates</h3>
                <div className="space-y-1">
                  {filteredCertificates.slice(0, 5).map((certificate) => (
                    <Button
                      key={certificate.id}
                      variant="ghost"
                      className="w-full justify-start p-3 h-auto"
                      onClick={() => handleCertificateClick(certificate.id)}
                    >
                      <Award className="h-4 w-4 mr-3 flex-shrink-0" />
                      <div className="text-left">
                        <div className="font-medium">{certificate.name}</div>
                        {certificate.category && (
                          <div className="text-sm text-gray-500">
                            {certificate.category}
                          </div>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Preliminary Plans */}
            {filteredPlans.length > 0 && (
              <div>
                <h3 className="font-medium text-sm text-gray-500 mb-2">Planning</h3>
                <div className="space-y-1">
                  {filteredPlans.slice(0, 5).map((plan) => (
                    <Button
                      key={plan.id}
                      variant="ghost"
                      className="w-full justify-start p-3 h-auto"
                      onClick={() => handlePlanClick(plan.id)}
                    >
                      <PenTool className="h-4 w-4 mr-3 flex-shrink-0" />
                      <div className="text-left">
                        <div className="font-medium">{plan.name}</div>
                        {plan.description && (
                          <div className="text-sm text-gray-500">
                            {plan.description}
                          </div>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Static Navigation Items */}
            {filteredStaticItems.length > 0 && (
              <div>
                <h3 className="font-medium text-sm text-gray-500 mb-2">Pages</h3>
                <div className="space-y-1">
                  {filteredStaticItems.map((item) => (
                    <Button
                      key={item.path}
                      variant="ghost"
                      className="w-full justify-start p-3 h-auto"
                      onClick={() => handleStaticItemClick(item.path)}
                    >
                      <item.icon className="h-4 w-4 mr-3 flex-shrink-0" />
                      <div className="text-left">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-500">
                          {item.description}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {filteredEmployees.length === 0 &&
              filteredTrainings.length === 0 &&
              filteredCourses.length === 0 &&
              filteredProviders.length === 0 &&
              filteredCertificates.length === 0 &&
              filteredPlans.length === 0 &&
              filteredStaticItems.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{t('search.noResults')}</p>
                </div>
              )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
