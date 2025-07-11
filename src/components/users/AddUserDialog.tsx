
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

const userSchema = z.object({
  firstName: z.string().min(1, "First names are required"),
  lastName: z.string().min(1, "Last name is required"),
  tussenvoegsel: z.string().optional(),
  roepnaam: z.string().min(1, "Calling name is required"),
  email: z.string().email("Invalid email address"),
  employeeNumber: z.string().min(1, "Employee number is required"),
  department: z.string().min(1, "Department is required"),
  jobTitle: z.string().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  hireDate: z.string().optional(),
  address: z.string().optional(),
  postcode: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  contractType: z.enum(["permanent", "temporary", "freelance"]).optional(),
  workLocation: z.string().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddUserDialog({ open, onOpenChange }: AddUserDialogProps) {
  // Function to generate full name from Dutch components (using roepnaam)
  const generateFullName = (roepnaam: string, lastName: string, tussenvoegsel?: string) => {
    const parts = [roepnaam];
    if (tussenvoegsel?.trim()) {
      parts.push(tussenvoegsel.trim());
    }
    if (lastName?.trim()) {
      parts.push(lastName.trim());
    }
    return parts.join(' ');
  };

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      tussenvoegsel: "",
      roepnaam: "",
      email: "",
      employeeNumber: "",
      department: "",
      contractType: "permanent",
      country: "Netherlands",
    },
  });

  // Watch name fields for auto-preview
  const watchedFields = form.watch(['roepnaam', 'lastName', 'tussenvoegsel']);
  const [roepnaam, lastName, tussenvoegsel] = watchedFields;

  const onSubmit = (data: UserFormData) => {
    // Auto-generate full name from Dutch components (using roepnaam)
    const fullName = generateFullName(data.roepnaam, data.lastName, data.tussenvoegsel);
    
    console.log("Adding new user:", { ...data, name: fullName });
    toast({
      title: "Employee Added",
      description: `${fullName} has been added successfully.`,
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="employment">Employment</TabsTrigger>
                <TabsTrigger value="personal">Personal</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                {/* Employee name display */}
                <div className="text-center py-4 border-b">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {roepnaam && lastName ? generateFullName(roepnaam, lastName, tussenvoegsel) : 'New Employee'}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Voornamen (First names) *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Ahmed Mohamed" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tussenvoegsel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tussenvoegsel</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., van, de, van der" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Achternaam (Last name) *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Hassan" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="roepnaam"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Roepnaam (Calling name) *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Ahmed" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="employeeNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employee Number *</FormLabel>
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
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="employment" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="jobTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="hireDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hire Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contractType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contract Type</FormLabel>
                        <FormControl>
                          <select className="w-full px-3 py-2 border border-gray-300 rounded-md" {...field}>
                            <option value="permanent">Permanent</option>
                            <option value="temporary">Temporary</option>
                            <option value="freelance">Freelance</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="workLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Location</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="personal" className="space-y-4">
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Employee</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
