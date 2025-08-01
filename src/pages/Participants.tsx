
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "@/components/layout/Layout";
import { UserList } from "@/components/users/UserList";
import { UserListTable } from "@/components/users/UserListTable";
import { AddUserDialog } from "@/components/users/AddUserDialog";
import { ViewToggle } from "@/components/ui/view-toggle";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users, Shield, Upload } from "lucide-react";
import { useViewMode } from "@/hooks/useViewMode";
import { ExemptionManagementDashboard } from "@/components/certificates/ExemptionManagementDashboard";
import { DocumentUpload } from "@/components/certificates/DocumentUpload";

export default function Participants() {
  const { t } = useTranslation(['employees']);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showExemptionRequestDialog, setShowExemptionRequestDialog] = useState(false);
  const [viewMode, setViewMode] = useViewMode('participants');

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('employees:management.title')}</h1>
          <p className="text-gray-600 mt-1">{t('employees:management.subtitle')}</p>
        </div>

        <Tabs defaultValue="employees" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="employees" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Employees
            </TabsTrigger>
            <TabsTrigger value="exemptions" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Certificate Exemptions
            </TabsTrigger>
            <TabsTrigger value="certificates" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Certificate Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="employees" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{t('employees:management.title')}</h1>
                <p className="text-gray-600 mt-1">{t('employees:management.subtitle')}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('employees:management.addEmployee')}
                </Button>
                <ViewToggle value={viewMode} onValueChange={setViewMode} />
              </div>
            </div>
            {viewMode === 'grid' ? <UserList /> : <UserListTable />}
          </TabsContent>

          <TabsContent value="exemptions" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Certificate Exemptions</h1>
                <p className="text-gray-600 mt-1">Manage employee certificate exemptions and approval requests</p>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => setShowExemptionRequestDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Request Employee Exemption
                </Button>
              </div>
            </div>
            <ExemptionManagementDashboard 
              showRequestDialog={showExemptionRequestDialog}
              onShowRequestDialogChange={setShowExemptionRequestDialog}
            />
          </TabsContent>

          <TabsContent value="certificates" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Certificate Upload</h1>
                <p className="text-gray-600 mt-1">Upload and manage employee certificates and documentation</p>
              </div>
            </div>
            <DocumentUpload
              showEmployeeSelection={true}
              showLicenseSelection={true}
              onUploadComplete={(documentId) => {
                // Handle upload completion if needed
              }}
            />
          </TabsContent>
        </Tabs>

        <AddUserDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
        />
      </div>
    </Layout>
  );
}
