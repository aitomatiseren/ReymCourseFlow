import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { EnhancedPhoneInput } from "@/components/users/EnhancedPhoneInput";
import { AddressLookup } from "@/components/users/AddressLookup";

const providerSchema = z.object({
  name: z.string().min(1, "Provider name is required"),
  contact_person: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().optional().or(z.literal("")).refine(val => {
    if (!val || val === "") return true;
    // Allow URLs with or without protocol
    const urlPattern = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}([\/?#][^\s]*)?$/;
    return urlPattern.test(val);
  }, { message: "Invalid URL format" }),
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
  })).default({}),
});

type ProviderFormData = z.infer<typeof providerSchema>;

interface EditProviderDialogProps {
  provider: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProviderDialog({
  provider,
  open,
  onOpenChange,
}: EditProviderDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addressQuery, setAddressQuery] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [websiteError, setWebsiteError] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newInstructor, setNewInstructor] = useState("");
  const queryClient = useQueryClient();

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open && !isSubmitting) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange, isSubmitting]);

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

  // Helper function to convert locations from different formats
  const normalizeLocations = (locations: any) => {
    if (!locations || !Array.isArray(locations)) return [];
    
    return locations.map((location: any) => {
      // If it's already an object with name and address, use it as is
      if (typeof location === 'object' && location.name && typeof location.address !== 'undefined') {
        return location;
      }
      // If it's a string that looks like JSON, skip it (corrupted data)
      if (typeof location === 'string' && (location.includes('{') || location.includes('name:') || location.includes('address:'))) {
        return {
          name: 'Corrupted Location Data',
          address: '',
          postcode: '',
          city: '',
          country: 'Netherlands'
        };
      }
      // If it's a clean string, convert to object format
      if (typeof location === 'string') {
        return {
          name: location,
          address: '',
          postcode: '',
          city: '',
          country: 'Netherlands'
        };
      }
      // Fallback for any other format
      return {
        name: 'Unknown Location',
        address: '',
        postcode: '',
        city: '',
        country: 'Netherlands'
      };
    });
  };

  // Helper function to convert structured locations back to simple strings for database storage
  const locationsToStrings = (locations: any[]) => {
    if (!locations || !Array.isArray(locations)) return [];
    
    return locations.map((location: any) => {
      if (typeof location === 'object' && location.name) {
        // Just use the location name for TEXT[] storage
        return location.name;
      }
      return String(location);
    });
  };

  // Load provider data when dialog opens
  useEffect(() => {
    if (provider && open) {
      // Build course pricing object from existing course_provider_courses data
      const coursePricing: Record<string, any> = {};
      if (provider.course_provider_courses) {
        console.log("Loading provider course pricing data:", provider.course_provider_courses);
        provider.course_provider_courses.forEach((cpc: any) => {
          coursePricing[cpc.course_id] = {
            cost_breakdown: Array.isArray(cpc.cost_breakdown) ? cpc.cost_breakdown : [],
          };
        });
      }
      console.log("Built course pricing object:", coursePricing);

      form.reset({
        name: provider.name || "",
        contact_person: provider.contact_person || "",
        email: provider.email || "",
        phone: provider.phone || "",
        website: provider.website || "",
        address: provider.address || "",
        postcode: provider.postcode || "",
        city: provider.city || "",
        country: provider.country || "Netherlands",
        additional_locations: normalizeLocations(provider.additional_locations) || [],
        instructors: Array.isArray(provider.instructors) ? provider.instructors : [],
        description: provider.description || "",
        notes: provider.notes || "",
        active: provider.active ?? true,
        courses: provider.course_provider_courses?.map((cpc: any) => cpc.course_id) || [],
        course_pricing: coursePricing,
      });
    }
  }, [provider, open, form]);

  const { data: courses } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, price")
        .order("title");
      if (error) throw error;
      return data;
    },
  });

  const updateProviderMutation = useMutation({
    mutationFn: async (data: ProviderFormData) => {
      // First, update the provider
      const { error: providerError } = await supabase
        .from("course_providers")
        .update({
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
        .eq("id", provider.id);

      if (providerError) throw providerError;

      // Delete existing course associations
      const { error: deleteError } = await supabase
        .from("course_provider_courses")
        .delete()
        .eq("provider_id", provider.id);

      if (deleteError) throw deleteError;

      // Create new course associations with pricing
      if (data.courses.length > 0) {
        const courseProviderData = data.courses.map((courseId) => {
          const pricing = data.course_pricing[courseId] || {};
          const costBreakdown = pricing.cost_breakdown || [];
          
          // Calculate total price from cost breakdown components
          const calculatedPrice = costBreakdown.reduce((sum: number, comp: any) => sum + (comp.amount || 0), 0);
          
          const courseData = {
            provider_id: provider.id,
            course_id: courseId,
            active: true,
            price: calculatedPrice > 0 ? calculatedPrice : null,
            cost_breakdown: costBreakdown.length > 0 ? costBreakdown : null,
          };
          
          console.log(`Course ${courseId} data:`, courseData);
          return courseData;
        });

        console.log("Saving course provider data:", courseProviderData);
        const { error: coursesError } = await supabase
          .from("course_provider_courses")
          .insert(courseProviderData);

        if (coursesError) {
          console.error("Error saving course provider data:", coursesError);
          throw coursesError;
        }
        console.log("Successfully saved course provider data");
      }

      return true;
    },
    onSuccess: () => {
      toast.success("Provider updated successfully");
      queryClient.invalidateQueries({ queryKey: ["course-providers"] });
      queryClient.invalidateQueries({ queryKey: ["provider", provider.id] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Failed to update provider");
      console.error("Error updating provider:", error);
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

  // Location management functions
  const addLocation = () => {
    if (newLocation.trim()) {
      const currentLocations = form.getValues("additional_locations");
      form.setValue("additional_locations", [...currentLocations, newLocation.trim()]);
      setNewLocation("");
    }
  };

  const handleLocationSelect = (address: { street: string; city: string; postcode: string; country: string }) => {
    const locationName = `${address.city} Location`; // Default name based on city
    const currentLocations = form.getValues("additional_locations");
    form.setValue("additional_locations", [...currentLocations, {
      name: locationName,
      address: address.street,
      postcode: address.postcode,
      city: address.city,
      country: address.country
    }]);
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

  const onSubmit = async (data: ProviderFormData) => {
    console.log("Form submitted with data:", data);
    console.log("Form validation state:", form.formState.errors);
    
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
      
      console.log("Processed data for mutation:", processedData);
      await updateProviderMutation.mutateAsync(processedData);
    } catch (error) {
      console.error("Error in onSubmit:", error);
      setIsSubmitting(false);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={isSubmitting ? undefined : onOpenChange}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh]" 
        hideCloseButton={true}
        onPointerDownOutside={(e) => e.preventDefault()} 
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Edit Course Provider</DialogTitle>
          <DialogDescription>
            Update provider information and course offerings
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] pr-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 px-1">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Basic Information</h3>
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider Name *</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <FormLabel>Contact Person</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                        <FormLabel>Phone</FormLabel>
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
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
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
                        <FormLabel>Website</FormLabel>
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
              </div>

              {/* Location Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Location</h3>
                
                <div className="space-y-2">
                  <FormLabel>Address Lookup</FormLabel>
                  <AddressLookup
                    onAddressSelect={handleAddressSelect}
                    placeholder="Search for provider address..."
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
                        <FormLabel>Postcode</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Display the currently entered address for reference */}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                  <FormLabel>Training Locations</FormLabel>
                  
                  {/* Add new location */}
                  <div className="space-y-2">
                    <AddressLookup
                      onAddressSelect={handleLocationSelect}
                      placeholder="Search and add training location..."
                    />
                    <p className="text-xs text-gray-500">
                      Type an address, city name, or postcode to search for training locations
                    </p>
                  </div>

                  {/* Existing locations */}
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
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                  
                  <FormDescription>
                    Add training locations for this provider
                  </FormDescription>
                </div>

                {/* Instructors */}
                <div className="space-y-3">
                  <FormLabel>Instructors</FormLabel>
                  
                  {/* Add new instructor */}
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

                  {/* Existing instructors */}
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
                  
                  <FormDescription>
                    Add instructors associated with this provider
                  </FormDescription>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Additional Information</h3>
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
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
                      <FormLabel>Internal Notes</FormLabel>
                      <FormControl>
                        <Textarea rows={2} {...field} />
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
                        <FormLabel>Active</FormLabel>
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
              </div>

              {/* Course Selection */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Offered Courses</h3>
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
                                        return checked
                                          ? field.onChange([...field.value, course.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== course.id
                                              )
                                            );
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
              {form.watch("courses").length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Course Pricing</h3>
                  <p className="text-sm text-gray-600">
                    Set pricing for each selected course. These will be used as templates when creating trainings.
                  </p>
                  
                  {form.watch("courses").map((courseId) => {
                    const course = courses?.find(c => c.id === courseId);
                    if (!course) return null;
                    
                    return (
                      <div key={courseId} className="border rounded-lg p-4 space-y-4">
                        <h4 className="font-medium">{course.title}</h4>
                        
                        {/* Cost Breakdown */}
                        <div className="space-y-3">
                          <FormLabel>Cost Breakdown Components</FormLabel>
                          
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
                                        const newComponents = [...field.value];
                                        newComponents[index] = { ...newComponents[index], name: e.target.value };
                                        field.onChange(newComponents);
                                      }}
                                    />
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      placeholder="Amount"
                                      value={component.amount || ""}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        const newComponents = [...field.value];
                                        // Only allow numbers and decimal points
                                        if (value === "" || /^\d*\.?\d*$/.test(value)) {
                                          newComponents[index] = { ...newComponents[index], amount: value ? parseFloat(value) : 0 };
                                          field.onChange(newComponents);
                                        }
                                      }}
                                    />
                                    <div className="flex gap-1">
                                      <Input
                                        placeholder="Description (optional)"
                                        value={component.description || ""}
                                        onChange={(e) => {
                                          const newComponents = [...field.value];
                                          newComponents[index] = { ...newComponents[index], description: e.target.value };
                                          field.onChange(newComponents);
                                        }}
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const newComponents = field.value.filter((_: any, i: number) => i !== index);
                                          field.onChange(newComponents);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                                
                                {/* Add component button */}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const currentComponents = field.value || [];
                                    field.onChange([...currentComponents, { name: "", amount: 0, description: "" }]);
                                  }}
                                  className="w-full"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Cost Component
                                </Button>
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

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="default" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update Provider
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}