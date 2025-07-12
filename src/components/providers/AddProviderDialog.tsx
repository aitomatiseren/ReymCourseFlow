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
import { AddressLookup } from "@/components/users/AddressLookup";
import { EnhancedPhoneInput } from "@/components/users/EnhancedPhoneInput";

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
  additional_locations: z.array(z.string()).default([]),
  instructors: z.array(z.string()).default([]),
  description: z.string().optional(),
  notes: z.string().optional(),
  active: z.boolean().default(true),
  courses: z.array(z.string()).default([]),
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
        })
        .select()
        .single();

      if (providerError) throw providerError;

      // Then, create the course associations
      if (data.courses.length > 0) {
        const courseProviderData = data.courses.map((courseId) => ({
          provider_id: provider.id,
          course_id: courseId,
          active: true,
        }));

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
    setIsSubmitting(true);
    try {
      // Process website URL to ensure it has a protocol
      const processedData = { ...data };
      if (processedData.website && !processedData.website.match(/^https?:\/\//)) {
        processedData.website = `https://${processedData.website}`;
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

        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
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
                            type="url"
                            placeholder="https://www.provider.com"
                            {...field}
                          />
                        </FormControl>
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
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add additional location..."
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addLocation();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addLocation}
                      disabled={!newLocation.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Existing locations */}
                  <FormField
                    control={form.control}
                    name="additional_locations"
                    render={({ field }) => (
                      <div className="space-y-2">
                        {field.value.map((location, index) => (
                          <div key={index} className="flex gap-2 p-2 border rounded-lg bg-gray-50">
                            <Input
                              value={location}
                              onChange={(e) => {
                                const newLocations = [...field.value];
                                newLocations[index] = e.target.value;
                                field.onChange(newLocations);
                              }}
                              className="bg-white"
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
                        {field.value.map((instructor, index) => (
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