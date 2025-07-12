import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ProviderProfileHeader } from "@/components/providers/ProviderProfileHeader";
import { ProviderProfileTabs } from "@/components/providers/ProviderProfileTabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ProviderProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Provider not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Provider Profile</h1>
            <p className="text-gray-600 mt-1">View and manage training provider information and offerings.</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/providers')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Providers</span>
          </Button>
        </div>
        <ProviderProfileHeader providerId={id} />
        <ProviderProfileTabs providerId={id} />
      </div>
    </Layout>
  );
}