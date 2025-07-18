
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Employee } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
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
import { getCombinedDepartmentOptions, getCombinedWorkLocationOptions } from "@/constants/employeeFields";

// Match AddUserDialog schema exactly
const employeeSchema = (t: any) => z.object({
  firstName: z.string().min(1, t('employees:addDialog.firstNamesRequired')),
  lastName: z.string().min(1, t('employees:addDialog.lastNameRequired')),
  tussenvoegsel: z.string().optional(),
  roepnaam: z.string().min(1, t('employees:addDialog.roepnaamRequired')),
  workEmail: z.string().email(t('employees:addDialog.invalidEmail')),
  privateEmail: z.string().optional().refine((val) => !val || z.string().email().safeParse(val).success, {
    message: t('employees:addDialog.invalidEmail')
  }),
  employeeNumber: z.string().min(1, t('employees:addDialog.employeeNumberRequired')),
  department: z.string().min(1, t('employees:addDialog.departmentRequired')),
  jobTitle: z.string().optional(),
  phone: z.string().optional().refine((val) => !val || /^\+?[1-9]\d{1,14}$/.test(val.replace(/\s/g, '')), {
    message: "Please enter a valid phone number"
  }),
  mobilePhone: z.string().optional().refine((val) => !val || /^\+?[1-9]\d{1,14}$/.test(val.replace(/\s/g, '')), {
    message: "Please enter a valid mobile phone number"
  }),
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
  maritalStatus: z.enum(["single", "married", "divorced", "widowed", "separated", "domestic_partnership", "civil_union", "engaged", "cohabiting", "unknown", "not_specified"]).optional(),
  marriageDate: z.string().optional(),
  divorceDate: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  notes: z.string().optional(),
  website: z.string().optional().refine((val) => !val || val.trim() === "" || /^(https?:\/\/|www\.|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,})/.test(val), {
    message: "Please enter a valid website URL (e.g., www.example.com or https://example.com)"
  }),
  // ID Proof fields
  idProofType: z.string().optional(),
  idProofNumber: z.string().optional(),
  idProofExpiryDate: z.string().optional(),
  // Driving License fields
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
});

type EmployeeFormData = z.infer<ReturnType<typeof employeeSchema>>;

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
  const { t } = useTranslation(['employees', 'common']);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Create schema with translations
  const userSchema = employeeSchema(t);


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

  const [activeTab, setActiveTab] = useState("basic");

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(userSchema),
    mode: "onChange",
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
      maritalStatus: employee.maritalStatus || "not_specified",
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
        maritalStatus: employee.maritalStatus || "not_specified",
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

  // Map field names to their corresponding tabs
  const fieldToTabMap: Record<string, string> = {
    // Basic Info tab
    roepnaam: "basic",
    firstName: "basic",
    lastName: "basic",
    tussenvoegsel: "basic",
    workEmail: "basic",
    privateEmail: "basic",
    phone: "basic",
    mobilePhone: "basic",
    website: "employment",
    // Employment tab
    employeeNumber: "employment",
    department: "employment",
    jobTitle: "employment",
    hireDate: "employment",
    contractType: "employment",
    workLocation: "employment",
    workingHours: "employment",
    salary: "employment",
    // Personal tab
    dateOfBirth: "personal",
    gender: "personal",
    nationality: "personal",
    maritalStatus: "personal",
    marriageDate: "personal",
    divorceDate: "personal",
    birthPlace: "personal",
    birthCountry: "personal",
    address: "personal",
    postcode: "personal",
    city: "personal",
    country: "personal",
    emergencyContactName: "personal",
    emergencyContactRelationship: "personal",
    emergencyContactPhone: "personal",
    notes: "personal",
    // Identity & ID tab
    personalId: "identity",
    idProofType: "identity",
    idProofNumber: "identity",
    idProofExpiryDate: "identity",
    // Licenses tab
    drivingLicenseA: "licenses",
    drivingLicenseAStartDate: "licenses",
    drivingLicenseAExpiryDate: "licenses",
    drivingLicenseB: "licenses",
    drivingLicenseBStartDate: "licenses",
    drivingLicenseBExpiryDate: "licenses",
    drivingLicenseBE: "licenses",
    drivingLicenseBEStartDate: "licenses",
    drivingLicenseBEExpiryDate: "licenses",
    drivingLicenseC: "licenses",
    drivingLicenseCStartDate: "licenses",
    drivingLicenseCExpiryDate: "licenses",
    drivingLicenseCE: "licenses",
    drivingLicenseCEStartDate: "licenses",
    drivingLicenseCEExpiryDate: "licenses",
    drivingLicenseD: "licenses",
    drivingLicenseDStartDate: "licenses",
    drivingLicenseDExpiryDate: "licenses",
  };

  // Function to switch to tab with first error
  const switchToErrorTab = () => {
    const errors = form.formState.errors;
    const errorFields = Object.keys(errors);
    
    console.log('Form errors:', errors);
    console.log('Error fields:', errorFields);
    
    if (errorFields.length > 0) {
      // Find the first error field that has a corresponding tab
      for (const fieldName of errorFields) {
        const targetTab = fieldToTabMap[fieldName];
        console.log(`Field ${fieldName} maps to tab ${targetTab}`);
        console.log(`Error for ${fieldName}:`, errors[fieldName]);
        
        if (targetTab) {
          console.log(`Switching to tab: ${targetTab}`);
          setActiveTab(targetTab);
          
          // Add a small delay to ensure the tab switch completes and then scroll to the error
          setTimeout(() => {
            const errorElement = document.querySelector(`[name="${fieldName}"]`);
            if (errorElement) {
              errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              console.log(`Scrolled to field: ${fieldName}`);
            }
          }, 100);
          break;
        }
      }
    }
  };

  // Enhanced submit handler that triggers validation and shows errors
  const handleFormSubmit = async (data: EmployeeFormData) => {
    // Trigger validation
    const isValid = await form.trigger();
    
    if (!isValid) {
      // If validation fails, switch to the tab with errors
      switchToErrorTab();
      return;
    }
    
    // If validation passes, proceed with submission
    onSubmit(data);
  };

  // Also add a button click handler that manually triggers validation
  const handleSubmitButtonClick = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Trigger validation manually
    const isValid = await form.trigger();
    
    if (!isValid) {
      // If validation fails, switch to the tab with errors
      switchToErrorTab();
      return;
    }
    
    // If validation passes, submit the form normally
    form.handleSubmit(onSubmit)();
  };

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
          marital_status: data.maritalStatus === "not_specified" ? null : data.maritalStatus,
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
      // Invalidate all employee-related queries
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee", employee.id] });
      queryClient.invalidateQueries({ queryKey: ["employee-current-status", employee.id] });
      queryClient.invalidateQueries({ queryKey: ["employee-status-history", employee.id] });
      
      // Invalidate certificate queries (needed for Code 95 calculations)
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      
      // Invalidate training participant queries (affects Code 95 eligibility in training dialogs)
      queryClient.invalidateQueries({ queryKey: ["training-participants"] });
      
      // Force refresh of all Code 95 related UI components
      queryClient.invalidateQueries({ queryKey: ["employee-statuses"] });
      
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
    // Auto-generate full name from Dutch components (using roepnaam)
    const fullName = generateFullName(data.roepnaam, data.lastName, data.tussenvoegsel);

    // Create the employee data object
    const employeeData = {
      ...data,
      name: fullName,
      email: data.workEmail, // Map workEmail to email for backward compatibility
    };

    updateEmployee.mutate(employeeData);
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
          <DialogTitle>{t('employees:editDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('employees:editDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="employment">Employment</TabsTrigger>
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="identity">Identity & ID</TabsTrigger>
                <TabsTrigger value="licenses">Licenses</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                {/* Employee name display */}
                <div className="text-center py-4 border-b">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {roepnaam && lastName 
                      ? generateFullName(roepnaam, lastName, tussenvoegsel) 
                      : employee.name || t('employees:editDialog.editEmployee')
                    }
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('employees:addDialog.firstNames')} *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter first names" />
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
                        <FormLabel>{t('employees:addDialog.tussenvoegsel')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., van, de, der" />
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
                        <FormLabel>{t('employees:addDialog.lastName')} *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter last name" />
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
                        <FormLabel>{t('employees:addDialog.roepnaam')} *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter calling name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="employeeNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('employees:addDialog.employeeNumber')} *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter employee number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="workEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Work Email *</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} placeholder="Enter work email address" />
                        </FormControl>
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
                          <Input type="email" {...field} placeholder="Enter private email (optional)" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <EnhancedPhoneInput 
                            value={field.value || ""} 
                            onChange={field.onChange}
                            placeholder="Enter phone number"
                          />
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
                        <FormLabel>Mobile Phone</FormLabel>
                        <FormControl>
                          <EnhancedPhoneInput 
                            value={field.value || ""} 
                            onChange={field.onChange}
                            placeholder="Enter mobile phone number"
                          />
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
                        <FormLabel>{t('employees:addDialog.department')} *</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder={t('employees:addDialog.departmentPlaceholder')} />
                            </SelectTrigger>
                            <SelectContent>
                              {getCombinedDepartmentOptions().map((dept) => (
                                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                        <FormLabel>{t('employees:addDialog.jobTitle')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter job title" />
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
                        <FormLabel>{t('employees:addDialog.hireDate')}</FormLabel>
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
                        <FormLabel>{t('employees:addDialog.contractType')}</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select contract type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="permanent">{t('employees:addDialog.permanent')}</SelectItem>
                              <SelectItem value="temporary">{t('employees:addDialog.temporary')}</SelectItem>
                              <SelectItem value="freelance">{t('employees:addDialog.freelance')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="workLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('employees:addDialog.workLocation')}</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder={t('employees:addDialog.workLocationPlaceholder')} />
                            </SelectTrigger>
                            <SelectContent>
                              {getCombinedWorkLocationOptions().map((location) => (
                                <SelectItem key={location} value={location}>{location}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="workingHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Working Hours</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., 40 hours/week" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="salary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salary</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter salary (optional)" />
                      </FormControl>
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
                        <Input {...field} placeholder="Personal or professional website" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="personal" className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('employees:addDialog.dateOfBirth')}</FormLabel>
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
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
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
                            value={field.value || ""} 
                            onValueChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="birthPlace"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Birth Place</FormLabel>
                        <FormControl>
                          <CityCountryLookup 
                            value={field.value || ""} 
                            onValueChange={field.onChange}
                            onSelect={(result) => {
                              field.onChange(result.city);
                              form.setValue("birthCountry", result.country);
                            }}
                            placeholder="Enter birth place"
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
                          <Input {...field} placeholder="Enter birth country" />
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
                      <FormLabel>{t('employees:addDialog.address')}</FormLabel>
                      <FormControl>
                        <AddressLookup 
                          value={field.value || ""} 
                          onValueChange={field.onChange}
                          onAddressSelect={(address) => {
                            field.onChange(address.street);
                            form.setValue("postcode", address.postcode);
                            form.setValue("city", address.city);
                            form.setValue("country", address.country);
                          }}
                        />
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
                        <FormLabel>{t('employees:addDialog.postcode')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="1234 AB" />
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
                        <FormLabel>{t('employees:addDialog.city')}</FormLabel>
                        <FormControl>
                          <CityCountryLookup 
                            value={field.value || ""} 
                            onValueChange={field.onChange}
                          />
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
                        <FormLabel>{t('employees:addDialog.country')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter country" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="maritalStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marital Status</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select marital status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="not_specified">Not specified</SelectItem>
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
                        </FormControl>
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
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Emergency Contact</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="emergencyContactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Emergency contact name" />
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
                            <Input {...field} placeholder="e.g., Spouse, Parent" />
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
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <EnhancedPhoneInput 
                              value={field.value || ""} 
                              onChange={field.onChange}
                              placeholder="Emergency contact phone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Any additional notes about the employee" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="identity" className="space-y-4">
                <div className="space-y-4">
                  <h4 className="font-medium">Identity & Identification</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="personalId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Personal ID (BSN)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter BSN or personal ID" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="idProofType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ID Proof Type</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select ID proof type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="passport">Passport</SelectItem>
                                <SelectItem value="id_card">ID Card</SelectItem>
                                <SelectItem value="driving_license">Driving License</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="idProofNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ID Proof Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter ID proof number" />
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
              </TabsContent>

              <TabsContent value="licenses" className="space-y-4">
                <div className="space-y-6">
                  <h4 className="font-medium">Driving Licenses</h4>
                  
                  {/* License A */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <FormField
                        control={form.control}
                        name="drivingLicenseA"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-medium">License A (Motorcycle)</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                    {form.watch("drivingLicenseA") && (
                      <div className="grid grid-cols-2 gap-4">
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
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <FormField
                        control={form.control}
                        name="drivingLicenseB"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-medium">License B (Car)</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                    {form.watch("drivingLicenseB") && (
                      <div className="grid grid-cols-2 gap-4">
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

                  {/* License BE */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <FormField
                        control={form.control}
                        name="drivingLicenseBE"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-medium">License BE (Car with Trailer)</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                    {form.watch("drivingLicenseBE") && (
                      <div className="grid grid-cols-2 gap-4">
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
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <FormField
                        control={form.control}
                        name="drivingLicenseC"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-medium">License C (Truck)</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                    {form.watch("drivingLicenseC") && (
                      <div className="grid grid-cols-2 gap-4">
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

                  {/* License CE */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <FormField
                        control={form.control}
                        name="drivingLicenseCE"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-medium">License CE (Truck with Trailer)</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                    {form.watch("drivingLicenseCE") && (
                      <div className="grid grid-cols-2 gap-4">
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
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <FormField
                        control={form.control}
                        name="drivingLicenseD"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-medium">License D (Bus)</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                    {form.watch("drivingLicenseD") && (
                      <div className="grid grid-cols-2 gap-4">
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
                </div>
              </TabsContent>
            </Tabs>


            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('employees:addDialog.cancel')}
              </Button>
              <Button type="button" onClick={handleSubmitButtonClick} disabled={updateEmployee.isPending}>
                {updateEmployee.isPending ? "Updating..." : "Update Employee"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
