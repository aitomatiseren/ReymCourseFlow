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
        <div className="flex items-center">
          <Button
            variant="outline"
            onClick={() => navigate('/providers')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Providers
          </Button>
        </div>
        <ProviderProfileHeader providerId={id} />
        <ProviderProfileTabs providerId={id} />
      </div>
    </Layout>
  );
}