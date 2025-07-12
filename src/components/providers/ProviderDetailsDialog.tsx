import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  User,
  FileText,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";

interface ProviderDetailsDialogProps {
  provider: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProviderDetailsDialog({
  provider,
  open,
  onOpenChange,
}: ProviderDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {provider.name}
          </DialogTitle>
          <DialogDescription>
            Provider details and course offerings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Status:</span>
            <Badge
              variant={provider.active ? "default" : "secondary"}
              className={provider.active ? "bg-green-100 text-green-800" : ""}
            >
              {provider.active ? "Active" : "Inactive"}
            </Badge>
          </div>

          {/* Contact Information */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {provider.contact_person && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="text-gray-600">Contact Person</div>
                      <div className="font-medium">{provider.contact_person}</div>
                    </div>
                  </div>
                )}
                {provider.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="text-gray-600">Email</div>
                      <a
                        href={`mailto:${provider.email}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {provider.email}
                      </a>
                    </div>
                  </div>
                )}
                {provider.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="text-gray-600">Phone</div>
                      <a
                        href={`tel:${provider.phone}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {provider.phone}
                      </a>
                    </div>
                  </div>
                )}
                {provider.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="text-gray-600">Website</div>
                      <a
                        href={provider.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {provider.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </h3>
              <div className="space-y-2 text-sm">
                {provider.address && (
                  <div className="font-medium">{provider.address}</div>
                )}
                {(provider.postcode || provider.city) && (
                  <div>
                    {provider.postcode && <span>{provider.postcode} </span>}
                    {provider.city && <span>{provider.city}</span>}
                  </div>
                )}
                {provider.country && (
                  <div className="text-gray-600">{provider.country}</div>
                )}
                {provider.default_location && (
                  <div className="mt-4">
                    <div className="text-gray-600 text-xs uppercase tracking-wide mb-1">
                      Default Training Location
                    </div>
                    <div className="font-medium bg-gray-50 p-2 rounded">
                      {provider.default_location}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {provider.description && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Description
                </h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {provider.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Offered Courses */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">
                Offered Courses ({provider.course_provider_courses?.length || 0})
              </h3>
              {provider.course_provider_courses?.length > 0 ? (
                <div className="space-y-2">
                  {provider.course_provider_courses.map((cpc: any) => (
                    <div
                      key={cpc.course_id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <div>
                        <div className="font-medium">{cpc.courses.title}</div>
                        {cpc.courses.category && (
                          <div className="text-xs text-gray-600">
                            {cpc.courses.category}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No courses currently offered by this provider
                </p>
              )}
            </CardContent>
          </Card>

          {/* Internal Notes */}
          {provider.notes && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 text-yellow-700">
                  Internal Notes
                </h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap bg-yellow-50 p-3 rounded">
                  {provider.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <div className="text-xs text-gray-500 flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>
                Created: {format(new Date(provider.created_at), "MMM d, yyyy")}
              </span>
            </div>
            {provider.updated_at && provider.updated_at !== provider.created_at && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>
                  Updated: {format(new Date(provider.updated_at), "MMM d, yyyy")}
                </span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}