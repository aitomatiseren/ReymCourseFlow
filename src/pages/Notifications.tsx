
import { Layout } from "@/components/layout/Layout";
import { NotificationSystem } from "@/components/notifications/NotificationSystem";
import { usePermissions } from "@/context/PermissionsContext";

export default function Notifications() {
  const { userProfile } = usePermissions();

  return (
    <Layout>
      <NotificationSystem
        userId={userProfile?.employee_id}
        enableRealTime={true}
      />
    </Layout>
  );
}
