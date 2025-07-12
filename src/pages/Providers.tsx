import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { CourseProviderList } from "@/components/providers/CourseProviderList";
import { CourseProviderGrid } from "@/components/providers/CourseProviderGrid";
import { AddProviderDialog } from "@/components/providers/AddProviderDialog";
import { ViewToggle } from "@/components/ui/view-toggle";
import { useViewMode } from "@/hooks/useViewMode";

export default function Providers() {
  const { t } = useTranslation(['providers']);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [viewMode, setViewMode] = useViewMode('providers');

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('providers:page.title')}</h1>
            <p className="text-gray-600 mt-1">
              {t('providers:page.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ViewToggle value={viewMode} onValueChange={setViewMode} />
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('providers:page.addProvider')}
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