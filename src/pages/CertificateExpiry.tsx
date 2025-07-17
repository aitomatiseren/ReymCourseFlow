
import { Layout } from "@/components/layout/Layout";
import { CertificateExpiryReport } from "@/components/reports/CertificateExpiryReport";

export default function CertificateExpiry() {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Certificate Expiry</h1>
            <p className="text-gray-600 mt-1">Track and manage certificate expiration dates</p>
          </div>
        </div>
        
        <CertificateExpiryReport />
      </div>
    </Layout>
  );
}
