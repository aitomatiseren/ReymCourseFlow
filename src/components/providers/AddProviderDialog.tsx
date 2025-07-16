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
  // Cost and distance fields
  default_hourly_rate: z.number().min(0, "Rate must be positive").optional(),
  travel_cost_per_km: z.number().min(0, "Travel cost must be positive").optional(),
  base_location_lat: z.number().min(-90).max(90).optional(),
  base_location_lng: z.number().min(-180).max(180).optional(),
  min_group_size: z.number().min(1, "Min group size must be at least 1").default(1),
  max_group_size: z.number().min(1, "Max group size must be at least 1").default(20)
    .refine((val, ctx) => val >= ctx.parent.min_group_size, {
      message: "Max group size must be greater than or equal to min group size"
    }),
  setup_cost: z.number().min(0, "Setup cost must be positive").optional(),
  cancellation_fee: z.number().min(0, "Cancellation fee must be positive").optional(),
  advance_booking_days: z.number().min(0, "Advance booking days must be positive").default(14),
  cost_currency: z.string().length(3, "Currency must be 3 characters").default("EUR"),
  courses: z.array(z.string()).default([]),
  course_pricing: z.record(z.object({
    cost_breakdown: z.array(z.object({
      name: z.string().optional(),
      amount: z.number().optional(),
      description: z.string().optional(),
    })).default([]),
    number_of_sessions: z.number().min(1).max(20).optional(),
    max_participants: z.number().min(1).max(50).optional(),
    notes: z.string().optional(),
  })).default({}),
});

type ProviderFormData = z.infer<typeof providerSchema>;

interface AddProviderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddProviderDialog({ open, onOpenChange }: AddProviderDialogProps) {
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
      // Cost and distance fields
      default_hourly_rate: undefined,
      travel_cost_per_km: undefined,
      base_location_lat: undefined,
      base_location_lng: undefined,
      min_group_size: 1,
      max_group_size: 20,
      setup_cost: undefined,
      cancellation_fee: undefined,
      advance_booking_days: 14,
      cost_currency: "EUR",
      courses: [],
      course_pricing: {},
    },
  });

  const { data: courses } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, category")
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
          // Cost and distance fields
          default_hourly_rate: data.default_hourly_rate || null,
          travel_cost_per_km: data.travel_cost_per_km || null,
          base_location_lat: data.base_location_lat || null,
          base_location_lng: data.base_location_lng || null,
          min_group_size: data.min_group_size || 1,
          max_group_size: data.max_group_size || 20,
          setup_cost: data.setup_cost || null,
          cancellation_fee: data.cancellation_fee || null,
          advance_booking_days: data.advance_booking_days || 14,
          cost_currency: data.cost_currency || "EUR",
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
      toast.success("Provider created successfully");
      queryClient.invalidateQueries({ queryKey: ["course-providers"] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast.error("Failed to create provider");
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
    <Dialog open={open} onOpenChange={isSubmitting ? undefined : onOpenChange}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh]" 
        hideCloseButton={true}
        onPointerDownOutside={(e) => e.preventDefault()} 
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Add Course Provider</DialogTitle>
          <DialogDescription>
            Add a new training provider to the system
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] pr-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        <FormLabel>Contact Person</FormLabel>
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
                  <FormLabel>Address</FormLabel>
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
                        <FormLabel>Postcode</FormLabel>
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
                        <FormLabel>City</FormLabel>
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
                      <FormLabel>Internal Notes</FormLabel>
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

              {/* Cost and Distance Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Cost and Distance Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="default_hourly_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Hourly Rate (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="150.00"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormDescription>
                          Standard hourly rate for training sessions
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="travel_cost_per_km"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Travel Cost per KM (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.30"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormDescription>
                          Cost per kilometer for travel
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="setup_cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Setup Cost (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="50.00"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormDescription>
                          One-time setup cost per session
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cancellation_fee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cancellation Fee (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="100.00"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormDescription>
                          Fee for training cancellation
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="min_group_size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Group Size</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="1"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 1)}
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum participants required
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="max_group_size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Group Size</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="20"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 20)}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum participants allowed
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="advance_booking_days"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Advance Booking (Days)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="14"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 14)}
                          />
                        </FormControl>
                        <FormDescription>
                          Days required for advance booking
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cost_currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <FormControl>
                          <Input
                            maxLength={3}
                            placeholder="EUR"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                        </FormControl>
                        <FormDescription>
                          Currency code (e.g., EUR, USD)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="base_location_lat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base Location Latitude</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.000001"
                            min="-90"
                            max="90"
                            placeholder="52.370216"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormDescription>
                          Latitude for distance calculations
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="base_location_lng"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base Location Longitude</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.000001"
                            min="-180"
                            max="180"
                            placeholder="4.895168"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormDescription>
                          Longitude for distance calculations
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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
                                        const newCourses = checked
                                          ? [...field.value, course.id]
                                          : field.value?.filter((value) => value !== course.id);
                                        
                                        field.onChange(newCourses);
                                        
                                        // Initialize pricing for new courses
                                        if (checked) {
                                          form.setValue(`course_pricing.${course.id}`, { 
                                            cost_breakdown: [],
                                            number_of_sessions: undefined,
                                            max_participants: undefined,
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
                                    {course.category && (
                                      <span className="text-xs text-gray-500 ml-1">
                                        ({course.category})
                                      </span>
                                    )}
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
                  <h3 className="text-sm font-medium">Course Pricing</h3>
                  {form.watch("courses")?.map((courseId) => {
                    const course = courses?.find(c => c.id === courseId);
                    if (!course) return null;

                    return (
                      <div key={courseId} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{course.title}</h4>
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

                        {/* Provider-specific constraints */}
                        <div className="grid grid-cols-2 gap-4 p-3 bg-blue-50 rounded-lg">
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
                                      placeholder="15"
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

                          <div className="col-span-2">
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
                  <FormDescription>
                    Configure pricing breakdown for each selected course
                  </FormDescription>
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
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Provider
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}