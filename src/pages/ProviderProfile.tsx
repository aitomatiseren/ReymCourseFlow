import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Layout } from "@/components/layout/Layout";
import { ProviderProfileHeader } from "@/components/providers/ProviderProfileHeader";
import { ProviderProfileTabs } from "@/components/providers/ProviderProfileTabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ProviderProfile() {
  const { t } = useTranslation('providers');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">{t('providerNotFound')}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('providerProfile')}</h1>
            <p className="text-gray-600 mt-1">{t('providerProfileDescription')}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/providers')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t('backToProviders')}</span>
          </Button>
        </div>
        <ProviderProfileHeader providerId={id} />
        <ProviderProfileTabs providerId={id} />
      </div>
    </Layout>
  );
}