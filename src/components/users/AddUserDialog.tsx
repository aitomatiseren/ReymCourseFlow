
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
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

// Schema will be created inside the component to access translations
const createUserSchema = (t: any) => z.object({
  firstName: z.string().min(1, t('employees:addDialog.firstNamesRequired')),
  lastName: z.string().min(1, t('employees:addDialog.lastNameRequired')),
  tussenvoegsel: z.string().optional(),
  roepnaam: z.string().min(1, t('employees:addDialog.roepnaamRequired')),
  email: z.string().email(t('employees:addDialog.invalidEmail')),
  employeeNumber: z.string().min(1, t('employees:addDialog.employeeNumberRequired')),
  department: z.string().min(1, t('employees:addDialog.departmentRequired')),
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

type UserFormData = z.infer<ReturnType<typeof createUserSchema>>;

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddUserDialog({ open, onOpenChange }: AddUserDialogProps) {
  const { t } = useTranslation(['employees', 'common']);

  // Create schema with translations
  const userSchema = createUserSchema(t);

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
      title: t('employees:addDialog.employeeAdded'),
      description: t('employees:addDialog.employeeAddedDescription', { name: fullName }),
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('employees:addDialog.title')}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">{t('employees:addDialog.basicInfoTab')}</TabsTrigger>
                <TabsTrigger value="employment">{t('employees:addDialog.employmentTab')}</TabsTrigger>
                <TabsTrigger value="personal">{t('employees:addDialog.personalTab')}</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                {/* Employee name display */}
                <div className="text-center py-4 border-b">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {roepnaam && lastName ? generateFullName(roepnaam, lastName, tussenvoegsel) : t('employees:addDialog.newEmployee')}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('employees:addDialog.firstNames')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('employees:addDialog.firstNamesPlaceholder')} />
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
                          <Input {...field} placeholder={t('employees:addDialog.tussenvoegselholder')} />
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
                        <FormLabel>{t('employees:addDialog.lastName')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('employees:addDialog.lastNamePlaceholder')} />
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
                        <FormLabel>{t('employees:addDialog.roepnaam')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('employees:addDialog.roepnaamPlaceholder')} />
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
                        <FormLabel>{t('employees:addDialog.email')}</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} placeholder={t('employees:addDialog.emailPlaceholder')} />
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
                        <FormLabel>{t('employees:addDialog.employeeNumber')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('employees:addDialog.employeeNumberPlaceholder')} />
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
                        <FormLabel>{t('employees:addDialog.phone')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('employees:addDialog.phonePlaceholder')} />
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
                        <FormLabel>{t('employees:addDialog.department')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('employees:addDialog.departmentPlaceholder')} />
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
                          <Input {...field} placeholder={t('employees:addDialog.jobTitlePlaceholder')} />
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
                          <select className="w-full px-3 py-2 border border-gray-300 rounded-md" {...field}>
                            <option value="permanent">{t('employees:addDialog.contractTypePermanent')}</option>
                            <option value="temporary">{t('employees:addDialog.contractTypeTemporary')}</option>
                            <option value="freelance">{t('employees:addDialog.contractTypeFreelance')}</option>
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
                      <FormLabel>{t('employees:addDialog.workLocation')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t('employees:addDialog.workLocationPlaceholder')} />
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
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('employees:addDialog.address')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t('employees:addDialog.addressPlaceholder')} />
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
                          <Input {...field} placeholder={t('employees:addDialog.postcodePlaceholder')} />
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
                          <Input {...field} placeholder={t('employees:addDialog.cityPlaceholder')} />
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
                          <Input {...field} placeholder={t('employees:addDialog.countryPlaceholder')} />
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
                {t('common:cancel')}
              </Button>
              <Button type="submit">{t('employees:addDialog.addEmployee')}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
