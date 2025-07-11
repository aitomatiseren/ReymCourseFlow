
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export function ComplianceReport() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Compliance Dashboard
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Overall compliance status and audit readiness
        </p>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Compliance report coming soon...</p>
          <p className="text-sm">Will include compliance percentages, audit trails, regulatory status</p>
        </div>
      </CardContent>
    </Card>
  );
}
