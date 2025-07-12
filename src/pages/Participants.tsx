
import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { UserList } from "@/components/users/UserList";
import { UserListTable } from "@/components/users/UserListTable";
import { AddUserDialog } from "@/components/users/AddUserDialog";
import { ViewToggle } from "@/components/ui/view-toggle";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useViewMode } from "@/hooks/useViewMode";

export default function Participants() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [viewMode, setViewMode] = useViewMode('participants');

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
            <p className="text-gray-600 mt-1">Manage employees, their information, and track their training progress.</p>
          </div>
          <div className="flex items-center space-x-2">
            <ViewToggle value={viewMode} onValueChange={setViewMode} />
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </div>
        </div>

        {viewMode === 'grid' ? <UserList /> : <UserListTable />}
        
        <AddUserDialog 
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
        />
      </div>
    </Layout>
  );
}
