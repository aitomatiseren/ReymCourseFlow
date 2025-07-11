
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { UserProfileHeader } from "@/components/users/UserProfileHeader";
import { UserProfileTabs } from "@/components/users/UserProfileTabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">User not found</p>
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
            onClick={() => navigate('/participants')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Participants
          </Button>
        </div>
        <UserProfileHeader userId={id} />
        <UserProfileTabs userId={id} />
      </div>
    </Layout>
  );
}
