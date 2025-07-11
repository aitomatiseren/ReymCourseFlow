
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Employee } from "@/types";
import { useToast } from "@/hooks/use-toast";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddressLookup } from "./AddressLookup";
import { NationalitySelect } from "./NationalitySelect";
import { EnhancedPhoneInput } from "./EnhancedPhoneInput";
import { CityCountryLookup } from "./CityCountryLookup";

const employeeSchema = z.object({
  firstName: z.string().min(1, "First names are required"),
  lastName: z.string().min(1, "Last name is required"),
  tussenvoegsel: z.string().optional(),
  roepnaam: z.string().min(1, "Calling name is required"),
  workEmail: z.string().email("Invalid work email address"),
  privateEmail: z.string().optional().refine((val) => !val || z.string().email().safeParse(val).success, {
    message: "Invalid private email address"
  }),
  department: z.string().min(1, "Department is required"),
  employeeNumber: z.string().min(1, "Employee number is required"),
  jobTitle: z.string().optional(),
  phone: z.string().optional(),
  mobilePhone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional().or(z.literal("")),
  birthPlace: z.string().optional(),
  birthCountry: z.string().optional(),
  hireDate: z.string().optional(),
  address: z.string().optional(),
  postcode: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  contractType: z.enum(["permanent", "temporary", "freelance"]).optional(),
  workLocation: z.string().optional(),
  salary: z.string().optional(),
  workingHours: z.string().optional(),
  nationality: z.string().optional(),
  personalId: z.string().optional(),
  maritalStatus: z.enum(["single", "married", "divorced", "widowed", "separated", "domestic_partnership", "civil_union", "engaged", "cohabiting", "unknown"]).optional(),
  marriageDate: z.string().optional(),
  divorceDate: z.string().optional(),
  deathDate: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  notes: z.string().optional(),
  website: z.string().optional(),
  // KVM fields
  idProofType: z.string().optional(),
  idProofNumber: z.string().optional(),
  idProofExpiryDate: z.string().optional(),
  // License fields
  drivingLicenseA: z.boolean().optional(),
  drivingLicenseAStartDate: z.string().optional(),
  drivingLicenseAExpiryDate: z.string().optional(),
  drivingLicenseB: z.boolean().optional(),
  drivingLicenseBStartDate: z.string().optional(),
  drivingLicenseBExpiryDate: z.string().optional(),
  drivingLicenseBE: z.boolean().optional(),
  drivingLicenseBEStartDate: z.string().optional(),
  drivingLicenseBEExpiryDate: z.string().optional(),
  drivingLicenseC: z.boolean().optional(),
  drivingLicenseCStartDate: z.string().optional(),
  drivingLicenseCExpiryDate: z.string().optional(),
  drivingLicenseCE: z.boolean().optional(),
  drivingLicenseCEStartDate: z.string().optional(),
  drivingLicenseCEExpiryDate: z.string().optional(),
  drivingLicenseD: z.boolean().optional(),
  drivingLicenseDStartDate: z.string().optional(),
  drivingLicenseDExpiryDate: z.string().optional(),
  drivingLicenseCode95: z.boolean().optional(),
  drivingLicenseCode95StartDate: z.string().optional(),
  drivingLicenseCode95ExpiryDate: z.string().optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EditEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee;
}

export function EditEmployeeDialog({
  open,
  onOpenChange,
  employee,
}: EditEmployeeDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [workEmailError, setWorkEmailError] = useState("");
  const [privateEmailError, setPrivateEmailError] = useState("");
  const [workPhoneError, setWorkPhoneError] = useState("");
  const [privatePhoneError, setPrivatePhoneError] = useState("");
  const [emergencyPhoneError, setEmergencyPhoneError] = useState("");

  // Handle Escape key to close dialog
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, onOpenChange]);

  // Clear validation errors when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setWorkEmailError("");
      setPrivateEmailError("");
      setWorkPhoneError("");
      setPrivatePhoneError("");
      setEmergencyPhoneError("");
    }
  }, [open]);


  // Validation functions
  const validateEmail = (email: string) => {
    if (!email) return "";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? "" : "Invalid email format";
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

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      firstName: employee.firstName || "",
      lastName: employee.lastName || "",
      tussenvoegsel: employee.tussenvoegsel || "",
      roepnaam: employee.roepnaam || "",
      workEmail: employee.email,
      privateEmail: employee.privateEmail || "",
      department: employee.department,
      employeeNumber: employee.employeeNumber,
      jobTitle: employee.jobTitle || "",
      phone: employee.phone || "",
      mobilePhone: employee.mobilePhone || "",
      dateOfBirth: employee.dateOfBirth || "",
      deathDate: employee.deathDate || "",
      gender: employee.gender || "",
      birthPlace: employee.birthPlace || "",
      birthCountry: employee.birthCountry || "",
      hireDate: employee.hireDate || "",
      address: employee.address || "",
      postcode: employee.postcode || "",
      city: employee.city || "",
      country: employee.country || "Netherlands",
      contractType: employee.contractType || "permanent",
      workLocation: employee.workLocation || "",
      salary: employee.salary?.toString() || "",
      workingHours: employee.workingHours?.toString() || "40",
      nationality: employee.nationality || "",
      personalId: employee.personalId || "",
      maritalStatus: employee.maritalStatus,
      marriageDate: employee.marriageDate || "",
      divorceDate: employee.divorceDate || "",
      emergencyContactName: employee.emergencyContact?.name || "",
      emergencyContactRelationship: employee.emergencyContact?.relationship || "",
      emergencyContactPhone: employee.emergencyContact?.phone || "",
      notes: employee.notes || "",
      website: employee.website || "",
      // KVM fields
      idProofType: employee.idProofType || "",
      idProofNumber: employee.idProofNumber || "",
      idProofExpiryDate: employee.idProofExpiryDate || "",
      // License fields
      drivingLicenseA: employee.drivingLicenseA || false,
      drivingLicenseAStartDate: employee.drivingLicenseAStartDate || "",
      drivingLicenseAExpiryDate: employee.drivingLicenseAExpiryDate || "",
      drivingLicenseB: employee.drivingLicenseB || false,
      drivingLicenseBStartDate: employee.drivingLicenseBStartDate || "",
      drivingLicenseBExpiryDate: employee.drivingLicenseBExpiryDate || "",
      drivingLicenseBE: employee.drivingLicenseBE || false,
      drivingLicenseBEStartDate: employee.drivingLicenseBEStartDate || "",
      drivingLicenseBEExpiryDate: employee.drivingLicenseBEExpiryDate || "",
      drivingLicenseC: employee.drivingLicenseC || false,
      drivingLicenseCStartDate: employee.drivingLicenseCStartDate || "",
      drivingLicenseCExpiryDate: employee.drivingLicenseCExpiryDate || "",
      drivingLicenseCE: employee.drivingLicenseCE || false,
      drivingLicenseCEStartDate: employee.drivingLicenseCEStartDate || "",
      drivingLicenseCEExpiryDate: employee.drivingLicenseCEExpiryDate || "",
      drivingLicenseD: employee.drivingLicenseD || false,
      drivingLicenseDStartDate: employee.drivingLicenseDStartDate || "",
      drivingLicenseDExpiryDate: employee.drivingLicenseDExpiryDate || "",
      drivingLicenseCode95: employee.drivingLicenseCode95 || false,
      drivingLicenseCode95StartDate: employee.drivingLicenseCode95StartDate || "",
      drivingLicenseCode95ExpiryDate: employee.drivingLicenseCode95ExpiryDate || "",
    },
  });

  // Reset form when dialog opens with fresh employee data
  useEffect(() => {
    if (open && employee) {
      form.reset({
        firstName: employee.firstName || "",
        lastName: employee.lastName || "",
        tussenvoegsel: employee.tussenvoegsel || "",
        roepnaam: employee.roepnaam || "",
        workEmail: employee.email,
        privateEmail: employee.privateEmail || "",
        department: employee.department,
        employeeNumber: employee.employeeNumber,
        jobTitle: employee.jobTitle || "",
        phone: employee.phone || "",
        mobilePhone: employee.mobilePhone || "",
        dateOfBirth: employee.dateOfBirth || "",
        deathDate: employee.deathDate || "",
        gender: employee.gender || "",
        birthPlace: employee.birthPlace || "",
        birthCountry: employee.birthCountry || "",
        hireDate: employee.hireDate || "",
        address: employee.address || "",
        postcode: employee.postcode || "",
        city: employee.city || "",
        country: employee.country || "Netherlands",
        contractType: employee.contractType || "permanent",
        workLocation: employee.workLocation || "",
        salary: employee.salary?.toString() || "",
        workingHours: employee.workingHours?.toString() || "40",
        nationality: employee.nationality || "",
        personalId: employee.personalId || "",
        maritalStatus: employee.maritalStatus,
        marriageDate: employee.marriageDate || "",
        divorceDate: employee.divorceDate || "",
        emergencyContactName: employee.emergencyContact?.name || "",
        emergencyContactRelationship: employee.emergencyContact?.relationship || "",
        emergencyContactPhone: employee.emergencyContact?.phone || "",
        notes: employee.notes || "",
        website: employee.website || "",
        // KVM fields
        idProofType: employee.idProofType || "",
        idProofNumber: employee.idProofNumber || "",
        idProofExpiryDate: employee.idProofExpiryDate || "",
        // License fields
        drivingLicenseA: employee.drivingLicenseA || false,
        drivingLicenseAStartDate: employee.drivingLicenseAStartDate || "",
        drivingLicenseAExpiryDate: employee.drivingLicenseAExpiryDate || "",
        drivingLicenseB: employee.drivingLicenseB || false,
        drivingLicenseBStartDate: employee.drivingLicenseBStartDate || "",
        drivingLicenseBExpiryDate: employee.drivingLicenseBExpiryDate || "",
        drivingLicenseBE: employee.drivingLicenseBE || false,
        drivingLicenseBEStartDate: employee.drivingLicenseBEStartDate || "",
        drivingLicenseBEExpiryDate: employee.drivingLicenseBEExpiryDate || "",
        drivingLicenseC: employee.drivingLicenseC || false,
        drivingLicenseCStartDate: employee.drivingLicenseCStartDate || "",
        drivingLicenseCExpiryDate: employee.drivingLicenseCExpiryDate || "",
        drivingLicenseCE: employee.drivingLicenseCE || false,
        drivingLicenseCEStartDate: employee.drivingLicenseCEStartDate || "",
        drivingLicenseCEExpiryDate: employee.drivingLicenseCEExpiryDate || "",
        drivingLicenseD: employee.drivingLicenseD || false,
        drivingLicenseDStartDate: employee.drivingLicenseDStartDate || "",
        drivingLicenseDExpiryDate: employee.drivingLicenseDExpiryDate || "",
        drivingLicenseCode95: employee.drivingLicenseCode95 || false,
        drivingLicenseCode95StartDate: employee.drivingLicenseCode95StartDate || "",
        drivingLicenseCode95ExpiryDate: employee.drivingLicenseCode95ExpiryDate || "",
      });
    }
  }, [open, employee, form]);

  // Watch name fields and auto-generate full name
  const watchedFields = form.watch(['roepnaam', 'lastName', 'tussenvoegsel']);
  const [roepnaam, lastName, tussenvoegsel] = watchedFields;

  const updateEmployee = useMutation({
    mutationFn: async (data: EmployeeFormData) => {
      // Auto-generate full name from Dutch components (using roepnaam)
      const fullName = generateFullName(data.roepnaam!, data.lastName!, data.tussenvoegsel);
      
      const { error } = await supabase
        .from("employees")
        .update({
          name: fullName,
          first_name: data.firstName || null,
          last_name: data.lastName || null,
          tussenvoegsel: data.tussenvoegsel || null,
          roepnaam: data.roepnaam || null,
          email: data.workEmail,
          private_email: data.privateEmail || null,
          department: data.department,
          employee_number: data.employeeNumber,
          job_title: data.jobTitle || null,
          phone: data.phone || null,
          mobile_phone: data.mobilePhone || null,
          date_of_birth: data.dateOfBirth || null,
          death_date: data.deathDate || null,
          gender: data.gender || null,
          birth_place: data.birthPlace || null,
          birth_country: data.birthCountry || null,
          hire_date: data.hireDate || null,
          address: data.address || null,
          postcode: data.postcode || null,
          city: data.city || null,
          country: data.country || null,
          contract_type: data.contractType || null,
          work_location: data.workLocation || null,
          salary: data.salary ? parseFloat(data.salary) : null,
          working_hours: data.workingHours ? parseFloat(data.workingHours) : null,
          nationality: data.nationality || null,
          personal_id: data.personalId || null,
          marital_status: data.maritalStatus || null,
          marriage_date: data.marriageDate || null,
          divorce_date: data.divorceDate || null,
          emergency_contact_name: data.emergencyContactName || null,
          emergency_contact_relationship: data.emergencyContactRelationship || null,
          emergency_contact_phone: data.emergencyContactPhone || null,
          notes: data.notes || null,
          website: data.website || null,
          // KVM fields
          id_proof_type: data.idProofType || null,
          id_proof_number: data.idProofNumber || null,
          id_proof_expiry_date: data.idProofExpiryDate || null,
          // License fields
          driving_license_a: data.drivingLicenseA || false,
          driving_license_a_start_date: data.drivingLicenseAStartDate || null,
          driving_license_a_expiry_date: data.drivingLicenseAExpiryDate || null,
          driving_license_b: data.drivingLicenseB || false,
          driving_license_b_start_date: data.drivingLicenseBStartDate || null,
          driving_license_b_expiry_date: data.drivingLicenseBExpiryDate || null,
          driving_license_be: data.drivingLicenseBE || false,
          driving_license_be_start_date: data.drivingLicenseBEStartDate || null,
          driving_license_be_expiry_date: data.drivingLicenseBEExpiryDate || null,
          driving_license_c: data.drivingLicenseC || false,
          driving_license_c_start_date: data.drivingLicenseCStartDate || null,
          driving_license_c_expiry_date: data.drivingLicenseCExpiryDate || null,
          driving_license_ce: data.drivingLicenseCE || false,
          driving_license_ce_start_date: data.drivingLicenseCEStartDate || null,
          driving_license_ce_expiry_date: data.drivingLicenseCEExpiryDate || null,
          driving_license_d: data.drivingLicenseD || false,
          driving_license_d_start_date: data.drivingLicenseDStartDate || null,
          driving_license_d_expiry_date: data.drivingLicenseDExpiryDate || null,
          driving_license_code95: data.drivingLicenseCode95 || false,
          driving_license_code95_start_date: data.drivingLicenseCode95StartDate || null,
          driving_license_code95_expiry_date: data.drivingLicenseCode95ExpiryDate || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", employee.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Employee updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee", employee.id] });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error updating employee:", error);
      toast({
        title: "Error",
        description: "Failed to update employee",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EmployeeFormData) => {
    updateEmployee.mutate(data);
  };

  const handleAddressSelect = (addressData: any) => {
    form.setValue("address", addressData.street || "");
    form.setValue("postcode", addressData.postcode || "");
    form.setValue("city", addressData.city || "");
    form.setValue("country", addressData.country || "Netherlands");
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      // Prevent closing the dialog - only allow closing via Cancel/Save buttons
      if (!newOpen) return;
      onOpenChange(newOpen);
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto z-[50] [&>button]:hidden" onInteractOutside={(e) => {
        // Allow interaction with dropdown menus, their overlays, and trigger buttons
        const target = e.target as Element;
        if (target.closest('[data-radix-popper-content-wrapper]') || 
            target.closest('[data-radix-select-content]') || 
            target.closest('[data-radix-popover-content]') ||
            target.closest('[data-radix-combobox-content]') ||
            target.closest('[data-radix-popover-trigger]') ||
            target.closest('[role="combobox"]') ||
            target.closest('button[role="combobox"]') ||
            target.closest('.lucide-chevrons-up-down') ||
            target.closest('button')) {
          return;
        }
        e.preventDefault();
      }}>
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
          <DialogDescription>
            Update employee information and personal details.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Employee Name Display */}
            <div className="text-center py-4 border-b">
              <h2 className="text-2xl font-bold text-gray-900">
                {roepnaam && lastName 
                  ? generateFullName(roepnaam, lastName, tussenvoegsel) 
                  : employee.name || 'Edit Employee'
                }
              </h2>
            </div>

            {/* Name Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Name Information</h3>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
            </div>

            {/* Employment Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Employment Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="font-normal">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Human Resources">Human Resources</SelectItem>
                          <SelectItem value="Finance">Finance</SelectItem>
                          <SelectItem value="IT">IT</SelectItem>
                          <SelectItem value="Operations">Operations</SelectItem>
                          <SelectItem value="Sales">Sales</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                          <SelectItem value="Engineering">Engineering</SelectItem>
                          <SelectItem value="Customer Service">Customer Service</SelectItem>
                          <SelectItem value="Legal">Legal</SelectItem>
                          <SelectItem value="Procurement">Procurement</SelectItem>
                          <SelectItem value="Quality Assurance">Quality Assurance</SelectItem>
                          <SelectItem value="Safety">Safety</SelectItem>
                          <SelectItem value="Training">Training</SelectItem>
                          <SelectItem value="Management">Management</SelectItem>
                        </SelectContent>
                      </Select>
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
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="font-normal">
                            <SelectValue placeholder="Select job title" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Manager">Manager</SelectItem>
                          <SelectItem value="Senior Manager">Senior Manager</SelectItem>
                          <SelectItem value="Team Leader">Team Leader</SelectItem>
                          <SelectItem value="Supervisor">Supervisor</SelectItem>
                          <SelectItem value="Specialist">Specialist</SelectItem>
                          <SelectItem value="Senior Specialist">Senior Specialist</SelectItem>
                          <SelectItem value="Coordinator">Coordinator</SelectItem>
                          <SelectItem value="Administrator">Administrator</SelectItem>
                          <SelectItem value="Assistant">Assistant</SelectItem>
                          <SelectItem value="Analyst">Analyst</SelectItem>
                          <SelectItem value="Senior Analyst">Senior Analyst</SelectItem>
                          <SelectItem value="Officer">Officer</SelectItem>
                          <SelectItem value="Senior Officer">Senior Officer</SelectItem>
                          <SelectItem value="Technician">Technician</SelectItem>
                          <SelectItem value="Senior Technician">Senior Technician</SelectItem>
                          <SelectItem value="Engineer">Engineer</SelectItem>
                          <SelectItem value="Senior Engineer">Senior Engineer</SelectItem>
                          <SelectItem value="Developer">Developer</SelectItem>
                          <SelectItem value="Senior Developer">Senior Developer</SelectItem>
                          <SelectItem value="Consultant">Consultant</SelectItem>
                          <SelectItem value="Senior Consultant">Senior Consultant</SelectItem>
                          <SelectItem value="Director">Director</SelectItem>
                          <SelectItem value="Associate">Associate</SelectItem>
                          <SelectItem value="Representative">Representative</SelectItem>
                          <SelectItem value="Executive">Executive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="workLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="font-normal">
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Head Office">Head Office</SelectItem>
                          <SelectItem value="Amsterdam Office">Amsterdam Office</SelectItem>
                          <SelectItem value="Rotterdam Office">Rotterdam Office</SelectItem>
                          <SelectItem value="The Hague Office">The Hague Office</SelectItem>
                          <SelectItem value="Utrecht Office">Utrecht Office</SelectItem>
                          <SelectItem value="Eindhoven Office">Eindhoven Office</SelectItem>
                          <SelectItem value="Warehouse North">Warehouse North</SelectItem>
                          <SelectItem value="Warehouse South">Warehouse South</SelectItem>
                          <SelectItem value="Distribution Center">Distribution Center</SelectItem>
                          <SelectItem value="Production Facility">Production Facility</SelectItem>
                          <SelectItem value="Remote Work">Remote Work</SelectItem>
                          <SelectItem value="Hybrid Work">Hybrid Work</SelectItem>
                          <SelectItem value="Field Work">Field Work</SelectItem>
                          <SelectItem value="Customer Site">Customer Site</SelectItem>
                          <SelectItem value="Multiple Locations">Multiple Locations</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contact Information</h3>
              
              {/* First row: Work Phone, Private Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Phone</FormLabel>
                      <FormControl>
                        <div>
                          <EnhancedPhoneInput
                            value={field.value}
                            onChange={(value) => {
                              field.onChange(value);
                              setWorkPhoneError(validatePhone(value));
                            }}
                            onBlur={() => {
                              field.onBlur();
                              setWorkPhoneError(validatePhone(field.value || ""));
                            }}
                            placeholder="Work phone number"
                          />
                          {workPhoneError && <p className="text-sm text-red-500 mt-1">{workPhoneError}</p>}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mobilePhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Private Phone</FormLabel>
                      <FormControl>
                        <div>
                          <EnhancedPhoneInput
                            value={field.value}
                            onChange={(value) => {
                              field.onChange(value);
                              setPrivatePhoneError(validatePhone(value));
                            }}
                            onBlur={() => {
                              field.onBlur();
                              setPrivatePhoneError(validatePhone(field.value || ""));
                            }}
                            placeholder="Private phone number"
                          />
                          {privatePhoneError && <p className="text-sm text-red-500 mt-1">{privatePhoneError}</p>}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Second row: Work Email, Private Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="workEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Email *</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          {...field} 
                          placeholder="Work email address"
                          onBlur={(e) => {
                            field.onBlur();
                            setWorkEmailError(validateEmail(e.target.value));
                          }}
                          className={workEmailError ? "border-red-500" : ""}
                        />
                      </FormControl>
                      {workEmailError && <p className="text-sm text-red-500">{workEmailError}</p>}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="privateEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Private Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          {...field} 
                          placeholder="Private email address"
                          onBlur={(e) => {
                            field.onBlur();
                            setPrivateEmailError(validateEmail(e.target.value));
                          }}
                          className={privateEmailError ? "border-red-500" : ""}
                        />
                      </FormControl>
                      {privateEmailError && <p className="text-sm text-red-500">{privateEmailError}</p>}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Third row: Website */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://www.example.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Address Information</h3>
              <AddressLookup onAddressSelect={handleAddressSelect} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
            </div>

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="font-normal">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="birthPlace"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Birth Place</FormLabel>
                      <FormControl>
                        <CityCountryLookup
                          value={field.value || ''}
                          placeholder="Search for your birth city..."
                          onSelect={(result) => {
                            field.onChange(result.city);
                            // Always auto-fill birth country when selecting from dropdown
                            form.setValue('birthCountry', result.country);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="birthCountry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Birth Country</FormLabel>
                      <FormControl>
                        <CityCountryLookup
                          value={field.value || ''}
                          placeholder="Search for your birth country..."
                          onSelect={(result) => {
                            field.onChange(result.country);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nationality</FormLabel>
                      <FormControl>
                        <NationalitySelect
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select nationality"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="personalId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personal ID (BSN)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maritalStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marital Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select marital status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="single">Single</SelectItem>
                          <SelectItem value="married">Married</SelectItem>
                          <SelectItem value="divorced">Divorced</SelectItem>
                          <SelectItem value="widowed">Widowed</SelectItem>
                          <SelectItem value="separated">Separated</SelectItem>
                          <SelectItem value="domestic_partnership">Domestic Partnership</SelectItem>
                          <SelectItem value="civil_union">Civil Union</SelectItem>
                          <SelectItem value="engaged">Engaged</SelectItem>
                          <SelectItem value="cohabiting">Cohabiting</SelectItem>
                          <SelectItem value="unknown">Unknown</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="marriageDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marriage Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="divorceDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Divorce Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deathDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Death Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select contract type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="permanent">Permanent</SelectItem>
                          <SelectItem value="temporary">Temporary</SelectItem>
                          <SelectItem value="freelance">Freelance</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />


                <FormField
                  control={form.control}
                  name="workingHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Working Hours per Week</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="salary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salary (Annual)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* KVM Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">KVM</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="idProofType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID Proof Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="font-normal">
                            <SelectValue placeholder="Select ID proof type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="passport">Passport</SelectItem>
                          <SelectItem value="national_id">National ID</SelectItem>
                          <SelectItem value="drivers_license">Driver's License</SelectItem>
                          <SelectItem value="eu_id">EU ID Card</SelectItem>
                          <SelectItem value="residence_permit">Residence Permit</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="idProofNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID Proof Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="idProofExpiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID Proof Expiry Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>
            </div>

            {/* Driving Licenses */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Driving Licenses</h3>
              
              {/* License A */}
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="drivingLicenseA"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="rounded border-gray-300"
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        License A
                      </FormLabel>
                    </FormItem>
                  )}
                />
                {form.watch("drivingLicenseA") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                    <FormField
                      control={form.control}
                      name="drivingLicenseAStartDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="drivingLicenseAExpiryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiry Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* License B */}
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="drivingLicenseB"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="rounded border-gray-300"
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        License B
                      </FormLabel>
                    </FormItem>
                  )}
                />
                {form.watch("drivingLicenseB") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                    <FormField
                      control={form.control}
                      name="drivingLicenseBStartDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="drivingLicenseBExpiryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiry Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* License B/E */}
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="drivingLicenseBE"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="rounded border-gray-300"
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        License B/E
                      </FormLabel>
                    </FormItem>
                  )}
                />
                {form.watch("drivingLicenseBE") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                    <FormField
                      control={form.control}
                      name="drivingLicenseBEStartDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="drivingLicenseBEExpiryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiry Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* License C */}
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="drivingLicenseC"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="rounded border-gray-300"
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        License C
                      </FormLabel>
                    </FormItem>
                  )}
                />
                {form.watch("drivingLicenseC") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                    <FormField
                      control={form.control}
                      name="drivingLicenseCStartDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="drivingLicenseCExpiryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiry Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* License C/E */}
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="drivingLicenseCE"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="rounded border-gray-300"
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        License C/E
                      </FormLabel>
                    </FormItem>
                  )}
                />
                {form.watch("drivingLicenseCE") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                    <FormField
                      control={form.control}
                      name="drivingLicenseCEStartDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="drivingLicenseCEExpiryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiry Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* License D */}
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="drivingLicenseD"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="rounded border-gray-300"
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        License D
                      </FormLabel>
                    </FormItem>
                  )}
                />
                {form.watch("drivingLicenseD") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                    <FormField
                      control={form.control}
                      name="drivingLicenseDStartDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="drivingLicenseDExpiryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiry Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* Code 95 */}
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="drivingLicenseCode95"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="rounded border-gray-300"
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        Code 95
                      </FormLabel>
                    </FormItem>
                  )}
                />
                {form.watch("drivingLicenseCode95") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                    <FormField
                      control={form.control}
                      name="drivingLicenseCode95StartDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="drivingLicenseCode95ExpiryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiry Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="emergencyContactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Contact Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emergencyContactRelationship"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relationship</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emergencyContactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Contact Phone</FormLabel>
                      <FormControl>
                        <div>
                          <EnhancedPhoneInput
                            value={field.value}
                            onChange={(value) => {
                              field.onChange(value);
                              setEmergencyPhoneError(validatePhone(value));
                            }}
                            onBlur={() => {
                              field.onBlur();
                              setEmergencyPhoneError(validatePhone(field.value || ""));
                            }}
                            placeholder="Emergency contact phone"
                          />
                          {emergencyPhoneError && <p className="text-sm text-red-500 mt-1">{emergencyPhoneError}</p>}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Additional Notes</h3>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateEmployee.isPending}>
                {updateEmployee.isPending ? "Updating..." : "Update Employee"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
