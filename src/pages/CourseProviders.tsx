import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { CourseProviderList } from "@/components/providers/CourseProviderList";
import { CourseProviderGrid } from "@/components/providers/CourseProviderGrid";
import { AddProviderDialog } from "@/components/providers/AddProviderDialog";
import { ViewToggle } from "@/components/ui/view-toggle";
import { useViewMode } from "@/hooks/useViewMode";

export default function CourseProviders() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [viewMode, setViewMode] = useViewMode('providers');

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Course Providers</h1>
            <p className="text-gray-600 mt-1">
              Manage training providers and their course offerings
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ViewToggle value={viewMode} onValueChange={setViewMode} />
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Provider
            </Button>
          </div>
        </div>

        {viewMode === 'grid' ? <CourseProviderGrid /> : <CourseProviderList />}

        <AddProviderDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
        />
      </div>
    </Layout>
  );
}