import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2 } from "lucide-react";
import { EnhancedPhoneInput } from "@/components/users/EnhancedPhoneInput";
import { AddressLookup } from "@/components/users/AddressLookup";

// Comprehensive schema matching edit dialog pattern
const createProviderSchema = (t: any) => z.object({
  name: z.string().min(1, t('providers:addDialog.nameRequired')),
  contact_person: z.string().optional(),
  email: z.string().email(t('providers:addDialog.invalidEmail')).optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().optional().or(z.literal("")).refine(val => {
    if (!val || val === "") return true;
    const urlPattern = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}([\/?#][^\s]*)?$/;
    return urlPattern.test(val);
  }, { message: t('providers:addDialog.invalidWebsite') }),
  address: z.string().optional(),
  postcode: z.string().optional(),
  city: z.string().optional(),
  country: z.string().default("Netherlands"),
  additional_locations: z.array(z.object({
    name: z.string().min(1, "Location name is required"),
    address: z.string(),
    postcode: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
  })).default([]),
  instructors: z.array(z.string()).default([]),
  description: z.string().optional(),
  notes: z.string().optional(),
  active: z.boolean().default(true),
  courses: z.array(z.string()).default([]),
  course_pricing: z.record(z.object({
    cost_breakdown: z.array(z.object({
      name: z.string().optional(),
      amount: z.number().optional(),
      description: z.string().optional(),
    })).default([]),
    number_of_sessions: z.number().min(1).max(20).optional(),
    min_participants: z.number().min(1).max(50).default(1),
    max_participants: z.number().min(1).max(50).default(20),
    notes: z.string().optional(),
  })).default({}),
});

type ProviderFormData = z.infer<ReturnType<typeof createProviderSchema>>;

interface AddProviderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddProviderDialog({ open, onOpenChange }: AddProviderDialogProps) {
  const { t } = useTranslation(['providers', 'common']);
  
  // Create schema with translations
  const providerSchema = createProviderSchema(t);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addressQuery, setAddressQuery] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [websiteError, setWebsiteError] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newInstructor, setNewInstructor] = useState("");
  const queryClient = useQueryClient();

  const form = useForm<ProviderFormData>({
    resolver: zodResolver(providerSchema),
    defaultValues: {
      name: "",
      contact_person: "",
      email: "",
      phone: "",
      website: "",
      address: "",
      postcode: "",
      city: "",
      country: "Netherlands",
      additional_locations: [],
      instructors: [],
      description: "",
      notes: "",
      active: true,
      courses: [],
      course_pricing: {},
    },
  });

  // Watch provider name for dynamic display
  const watchedName = form.watch('name');

  const { data: courses } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title")
        .order("title");
      if (error) throw error;
      return data;
    },
  });

  const createProviderMutation = useMutation({
    mutationFn: async (data: ProviderFormData) => {
      // First, create the provider
      const { data: provider, error: providerError } = await supabase
        .from("course_providers")
        .insert({
          name: data.name,
          contact_person: data.contact_person || null,
          email: data.email || null,
          phone: data.phone || null,
          website: data.website || null,
          address: data.address || null,
          postcode: data.postcode || null,
          city: data.city || null,
          country: data.country,
          additional_locations: data.additional_locations || [],
          instructors: data.instructors || [],
          description: data.description || null,
          notes: data.notes || null,
          active: data.active,
        })
        .select()
        .single();

      if (providerError) throw providerError;

      // Then, create the course associations with pricing
      if (data.courses.length > 0) {
        const courseProviderData = data.courses.map((courseId) => {
          const pricing = data.course_pricing[courseId] || {};
          const costBreakdown = pricing.cost_breakdown || [];
          
          // Calculate total price from cost breakdown components
          const calculatedPrice = costBreakdown.reduce((sum: number, comp: any) => sum + (comp.amount || 0), 0);
          
          return {
            provider_id: provider.id,
            course_id: courseId,
            active: true,
            price: calculatedPrice > 0 ? calculatedPrice : null,
            cost_breakdown: costBreakdown.length > 0 ? costBreakdown : null,
            number_of_sessions: pricing.number_of_sessions || null,
            min_participants: pricing.min_participants || null,
            max_participants: pricing.max_participants || null,
            notes: pricing.notes || null,
          };
        });

        const { error: coursesError } = await supabase
          .from("course_provider_courses")
          .insert(courseProviderData);

        if (coursesError) throw coursesError;
      }

      return provider;
    },
    onSuccess: () => {
      toast({
        title: t('providers:addDialog.success'),
        description: t('providers:addDialog.providerCreated'),
      });
      queryClient.invalidateQueries({ queryKey: ["course-providers"] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: t('providers:addDialog.error'),
        description: t('providers:addDialog.createFailed'),
        variant: "destructive",
      });
      console.error("Error creating provider:", error);
    },
  });

  // Validation functions
  const validateEmail = (email: string) => {
    if (!email) return "";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Invalid email format";
    }
    return "";
  };

  const validatePhone = (phone: string) => {
    if (!phone) return "";
    const cleanPhone = phone.replace(/\D/g, '');
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,20}$/;
    
    // Special handling for Dutch mobile numbers (+31 6 followed by 8 digits)
    if (phone.startsWith('+31 6') || phone.startsWith('+316')) {
      const dutchMobile = phone.replace(/\D/g, '');
      // Should be 11 digits total (31 + 6 + 8 digits)
      if (dutchMobile.length === 11 && dutchMobile.startsWith('316')) {
        return "";
      }
      return "Invalid Dutch mobile number format";
    }
    
    if (!phoneRegex.test(phone) || cleanPhone.length < 7 || cleanPhone.length > 15) {
      return "Invalid phone format";
    }
    return "";
  };

  const validateWebsite = (website: string) => {
    if (!website) return "";
    const urlPattern = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}([\/?#][^\s]*)?$/;
    if (!urlPattern.test(website)) {
      return "Invalid URL format";
    }
    return "";
  };

  const handleAddressSelect = (address: { street: string; city: string; postcode: string; country: string }) => {
    form.setValue("address", address.street);
    form.setValue("postcode", address.postcode);
    form.setValue("city", address.city);
    form.setValue("country", address.country);
    setAddressQuery(`${address.street}, ${address.city}`);
  };

  const handleLocationSelect = (address: { street: string; city: string; postcode: string; country: string }) => {
    const locationName = `${address.city} Location`; // Default name based on city
    const currentLocations = form.getValues("additional_locations");
    
    const newLocation = {
      name: locationName,
      address: address.street,
      postcode: address.postcode,
      city: address.city,
      country: address.country
    };
    
    form.setValue("additional_locations", [...currentLocations, newLocation]);
  };

  const removeLocation = (index: number) => {
    const currentLocations = form.getValues("additional_locations");
    form.setValue("additional_locations", currentLocations.filter((_, i) => i !== index));
  };

  // Instructor management functions
  const addInstructor = () => {
    if (newInstructor.trim()) {
      const currentInstructors = form.getValues("instructors");
      form.setValue("instructors", [...currentInstructors, newInstructor.trim()]);
      setNewInstructor("");
    }
  };

  const removeInstructor = (index: number) => {
    const currentInstructors = form.getValues("instructors");
    form.setValue("instructors", currentInstructors.filter((_, i) => i !== index));
  };

  // Cost breakdown management functions
  const addCostComponent = (courseId: string) => {
    const currentPricing = form.getValues(`course_pricing.${courseId}`) || { cost_breakdown: [] };
    const newComponent = { name: "", amount: 0, description: "" };
    const updatedBreakdown = [...(currentPricing.cost_breakdown || []), newComponent];
    
    form.setValue(`course_pricing.${courseId}.cost_breakdown`, updatedBreakdown);
  };

  const removeCostComponent = (courseId: string, index: number) => {
    const currentPricing = form.getValues(`course_pricing.${courseId}`) || { cost_breakdown: [] };
    const updatedBreakdown = (currentPricing.cost_breakdown || []).filter((_, i) => i !== index);
    
    form.setValue(`course_pricing.${courseId}.cost_breakdown`, updatedBreakdown);
  };

  const onSubmit = async (data: ProviderFormData) => {
    setIsSubmitting(true);
    try {
      // Process website URL to ensure it has a protocol
      const processedData = { ...data };
      if (processedData.website && !processedData.website.match(/^https?:\/\//)) {
        processedData.website = `https://${processedData.website}`;
      }
      
      // Clean up cost breakdown components - remove empty ones
      if (processedData.course_pricing) {
        Object.keys(processedData.course_pricing).forEach(courseId => {
          const pricing = processedData.course_pricing[courseId];
          if (pricing && pricing.cost_breakdown) {
            // Filter out components with empty names or invalid amounts
            pricing.cost_breakdown = pricing.cost_breakdown.filter((comp: any) => 
              comp.name && comp.name.trim().length > 0 && 
              typeof comp.amount === 'number' && 
              comp.amount >= 0
            );
          }
        });
      }
      
      await createProviderMutation.mutateAsync(processedData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('providers:addDialog.title')}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="location">Location & Instructors</TabsTrigger>
                <TabsTrigger value="courses">Courses & Pricing</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                {/* Provider name display */}
                <div className="text-center py-4 border-b">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {watchedName || t('providers:addDialog.newProvider')}
                  </h2>
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('providers:addDialog.providerName')} *</FormLabel>
                      <FormControl>
                        <Input placeholder="ABC Training Center" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contact_person"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('providers:addDialog.contactPerson')}</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('providers:addDialog.phone')}</FormLabel>
                        <FormControl>
                          <EnhancedPhoneInput
                            value={field.value || ""}
                            onChange={(value) => {
                              field.onChange(value);
                              setPhoneError(validatePhone(value));
                            }}
                            onBlur={() => {
                              field.onBlur();
                              setPhoneError(validatePhone(field.value || ""));
                            }}
                            placeholder="Phone number"
                          />
                        </FormControl>
                        {phoneError && <p className="text-sm text-red-500 mt-1">{phoneError}</p>}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('providers:addDialog.email')}</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="info@provider.com"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              setEmailError(validateEmail(e.target.value));
                            }}
                            onBlur={() => {
                              field.onBlur();
                              setEmailError(validateEmail(field.value || ""));
                            }}
                          />
                        </FormControl>
                        {emailError && <p className="text-sm text-red-500 mt-1">{emailError}</p>}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('providers:addDialog.website')}</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="www.provider.com"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              setWebsiteError(validateWebsite(e.target.value));
                            }}
                            onBlur={() => {
                              field.onBlur();
                              setWebsiteError(validateWebsite(field.value || ""));
                            }}
                          />
                        </FormControl>
                        {websiteError && <p className="text-sm text-red-500 mt-1">{websiteError}</p>}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="location" className="space-y-4">
                <div className="space-y-2">
                  <FormLabel>{t('providers:addDialog.address')}</FormLabel>
                  <AddressLookup
                    onAddressSelect={handleAddressSelect}
                    placeholder="Enter provider address..."
                  />
                  <div className="text-xs text-gray-500">
                    Start typing an address to get suggestions from OpenCage geocoding
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="postcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('providers:addDialog.postcode')}</FormLabel>
                        <FormControl>
                          <Input placeholder="1234 AB" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('providers:addDialog.city')}</FormLabel>
                        <FormControl>
                          <Input placeholder="Amsterdam" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('providers:addDialog.country')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('providers:addDialog.streetAddress')}</FormLabel>
                      <FormControl>
                        <Input placeholder="Hoofdstraat 123" {...field} />
                      </FormControl>
                      <FormDescription>
                        Auto-filled from address lookup or enter manually
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Training Locations */}
                <div className="space-y-3">
                  <FormLabel>{t('providers:addDialog.trainingLocations')}</FormLabel>
                  
                  <div className="space-y-2">
                    <AddressLookup
                      onAddressSelect={handleLocationSelect}
                      placeholder="Search and add training location..."
                    />
                    <p className="text-xs text-gray-500">
                      Type an address, city name, or postcode to search for training locations
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="additional_locations"
                    render={({ field }) => (
                      <div className="space-y-3">
                        {field.value && field.value.length > 0 && field.value.map((location, index) => (
                          <div key={index} className="p-3 border rounded-lg bg-gray-50 space-y-2">
                            <div className="flex gap-2">
                              <Input
                                placeholder="Location name"
                                value={location.name}
                                onChange={(e) => {
                                  const newLocations = [...field.value];
                                  newLocations[index] = { ...newLocations[index], name: e.target.value };
                                  field.onChange(newLocations);
                                }}
                                className="bg-white font-medium"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeLocation(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="text-sm text-gray-600 px-3 py-2 bg-white rounded border">
                              <div className="font-medium">Address:</div>
                              <div>{location.address}</div>
                              <div className="mt-1 text-xs">
                                {location.postcode && location.city && (
                                  <span>{location.postcode} {location.city}, {location.country}</span>
                                )}
                                {(!location.postcode || !location.city) && (
                                  <span className="text-gray-400">
                                    {location.city || 'Unknown city'}, {location.country || 'Netherlands'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                </div>

                {/* Instructors */}
                <div className="space-y-3">
                  <FormLabel>{t('providers:addDialog.instructors')}</FormLabel>
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add instructor name..."
                      value={newInstructor}
                      onChange={(e) => setNewInstructor(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addInstructor();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addInstructor}
                      disabled={!newInstructor.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <FormField
                    control={form.control}
                    name="instructors"
                    render={({ field }) => (
                      <div className="space-y-2">
                        {field.value && field.value.length > 0 && field.value.map((instructor, index) => (
                          <div key={index} className="flex gap-2 p-2 border rounded-lg bg-gray-50">
                            <Input
                              value={instructor}
                              onChange={(e) => {
                                const newInstructors = [...field.value];
                                newInstructors[index] = e.target.value;
                                field.onChange(newInstructors);
                              }}
                              className="bg-white"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeInstructor(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="courses" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">{t('providers:addDialog.offeredCourses')}</h3>
                  <FormField
                    control={form.control}
                    name="courses"
                    render={() => (
                      <FormItem>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-2">
                          {courses?.map((course) => (
                            <FormField
                              key={course.id}
                              control={form.control}
                              name="courses"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={course.id}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(course.id)}
                                        onCheckedChange={(checked) => {
                                          const newCourses = checked
                                            ? [...field.value, course.id]
                                            : field.value?.filter((value) => value !== course.id);
                                          
                                          field.onChange(newCourses);
                                          
                                          // Initialize pricing for new courses
                                          if (checked) {
                                            form.setValue(`course_pricing.${course.id}`, { 
                                              cost_breakdown: [],
                                              number_of_sessions: undefined,
                                              min_participants: 1,
                                              max_participants: 20,
                                              notes: ''
                                            });
                                          } else {
                                            // Remove pricing when unchecking
                                            const currentPricing = form.getValues("course_pricing");
                                            delete currentPricing[course.id];
                                            form.setValue("course_pricing", currentPricing);
                                          }
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal cursor-pointer">
                                      {course.title}
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                        <FormDescription>
                          Select the courses this provider offers
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Course Pricing */}
                {form.watch("courses")?.length > 0 && (
                  <div className="space-y-6">
                    <h3 className="text-sm font-medium">{t('providers:addDialog.coursePricing')}</h3>
                    {form.watch("courses")?.map((courseId) => {
                      const course = courses?.find(c => c.id === courseId);
                      if (!course) return null;

                      return (
                        <div key={courseId} className="border rounded-lg p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900">{course.title}</h4>
                          </div>

                          {/* Provider-specific constraints */}
                          <div className="grid grid-cols-3 gap-4 p-3 bg-blue-50 rounded-lg">
                            <div>
                              <FormLabel htmlFor={`sessions-${courseId}`}>Number of Sessions</FormLabel>
                              <FormField
                                control={form.control}
                                name={`course_pricing.${courseId}.number_of_sessions` as any}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        id={`sessions-${courseId}`}
                                        type="number"
                                        min="1"
                                        max="20"
                                        placeholder="1"
                                        {...field}
                                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <p className="text-xs text-gray-600 mt-1">Number of sessions required</p>
                            </div>

                            <div>
                              <FormLabel htmlFor={`min-participants-${courseId}`}>Min Participants</FormLabel>
                              <FormField
                                control={form.control}
                                name={`course_pricing.${courseId}.min_participants` as any}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        id={`min-participants-${courseId}`}
                                        type="number"
                                        min="1"
                                        max="50"
                                        placeholder="1"
                                        {...field}
                                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <p className="text-xs text-gray-600 mt-1">Minimum group size</p>
                            </div>

                            <div>
                              <FormLabel htmlFor={`max-participants-${courseId}`}>Max Participants</FormLabel>
                              <FormField
                                control={form.control}
                                name={`course_pricing.${courseId}.max_participants` as any}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        id={`max-participants-${courseId}`}
                                        type="number"
                                        min="1"
                                        max="50"
                                        placeholder="20"
                                        {...field}
                                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <p className="text-xs text-gray-600 mt-1">Maximum group size</p>
                            </div>

                            <div className="col-span-3">
                              <FormLabel htmlFor={`notes-${courseId}`}>Provider Notes</FormLabel>
                              <FormField
                                control={form.control}
                                name={`course_pricing.${courseId}.notes` as any}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        id={`notes-${courseId}`}
                                        placeholder="Special requirements or notes"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <FormLabel>Cost Breakdown Components</FormLabel>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addCostComponent(courseId)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Cost Component
                              </Button>
                            </div>
                            
                            {/* Existing components */}
                            <FormField
                              control={form.control}
                              name={`course_pricing.${courseId}.cost_breakdown` as any}
                              render={({ field }) => (
                                <div className="space-y-2">
                                  {field.value && field.value.length > 0 && field.value.map((component: any, index: number) => (
                                    <div key={index} className="grid grid-cols-3 gap-2 p-3 border rounded bg-gray-50">
                                      <Input
                                        placeholder="Component name"
                                        value={component.name || ""}
                                        onChange={(e) => {
                                          const updatedComponents = [...field.value];
                                          updatedComponents[index] = { ...updatedComponents[index], name: e.target.value };
                                          field.onChange(updatedComponents);
                                        }}
                                      />
                                      <Input
                                        type="number"
                                        placeholder="Amount"
                                        step="0.01"
                                        min="0"
                                        value={component.amount || ""}
                                        onChange={(e) => {
                                          const value = parseFloat(e.target.value) || 0;
                                          const updatedComponents = [...field.value];
                                          updatedComponents[index] = { ...updatedComponents[index], amount: value };
                                          field.onChange(updatedComponents);
                                        }}
                                      />
                                      <div className="flex gap-2">
                                        <Input
                                          placeholder="Description (optional)"
                                          value={component.description || ""}
                                          onChange={(e) => {
                                            const updatedComponents = [...field.value];
                                            updatedComponents[index] = { ...updatedComponents[index], description: e.target.value };
                                            field.onChange(updatedComponents);
                                          }}
                                          className="flex-1"
                                        />
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => removeCostComponent(courseId, index)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                  {(!field.value || field.value.length === 0) && (
                                    <div className="text-center py-6 text-gray-500 border-2 border-dashed rounded-lg">
                                      <p className="text-sm">No cost components added yet</p>
                                      <p className="text-xs mt-1">Click "Add Cost Component" to add pricing details</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            />
                            
                            {/* Total calculation */}
                            {(() => {
                              const pricing = form.watch(`course_pricing.${courseId}`);
                              const total = pricing?.cost_breakdown?.reduce((sum: number, comp: any) => sum + (comp.amount || 0), 0) || 0;
                              
                              if (total > 0) {
                                return (
                                  <div className="pt-3 border-t border-gray-200">
                                    <div className="flex justify-between items-center text-lg font-semibold text-gray-900">
                                      <span>Total Course Price:</span>
                                      <span>€{total.toFixed(2)}</span>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('providers:addDialog.description')}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of the provider..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('providers:addDialog.internalNotes')}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any internal notes..."
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>{t('providers:addDialog.active')}</FormLabel>
                        <FormDescription>
                          Active providers can be selected when scheduling trainings
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('providers:addDialog.cancel')}
              </Button>
              <Button type="submit" disabled={createProviderMutation.isPending}>
                {createProviderMutation.isPending ? t('providers:addDialog.creating') : t('providers:addDialog.createProvider')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}