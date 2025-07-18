import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProvidersForCourse, Provider } from "@/hooks/useProviders";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Phone, Mail, Plus } from "lucide-react";

interface ProviderSelectionSectionProps {
  selectedCourseId: string;
  selectedProviderId: string;
  onProviderChange: (providerId: string) => void;
  onProviderDetailsChange?: (provider: Provider | null) => void;
  onCreateProvider?: () => void;
}

export function ProviderSelectionSection({
  selectedCourseId,
  selectedProviderId,
  onProviderChange,
  onProviderDetailsChange,
  onCreateProvider
}: ProviderSelectionSectionProps) {
  // Fetch providers that offer the selected course
  const { data: providers = [], isLoading, error } = useProvidersForCourse(selectedCourseId) as { data: Provider[] | undefined, isLoading: boolean, error: any };

  // Debug logging
  console.log(`[ProviderSelectionSection] Course ID: ${selectedCourseId}`);
  console.log(`[ProviderSelectionSection] Is Loading: ${isLoading}`);
  console.log(`[ProviderSelectionSection] Error:`, error);
  console.log(`[ProviderSelectionSection] Providers data:`, providers);
  console.log(`[ProviderSelectionSection] Providers length: ${providers?.length || 0}`);

  // Get selected provider details
  const selectedProvider = providers.find(p => p.id === selectedProviderId);

  // Auto-fill provider details when selection changes
  useEffect(() => {
    if (onProviderDetailsChange) {
      onProviderDetailsChange(selectedProvider || null);
    }
  }, [selectedProvider, onProviderDetailsChange]);

  // Clear provider selection when course changes
  useEffect(() => {
    if (selectedCourseId && selectedProviderId) {
      const isProviderStillValid = providers.some(p => p.id === selectedProviderId);
      if (!isProviderStillValid) {
        onProviderChange("");
      }
    }
  }, [selectedCourseId, selectedProviderId, providers, onProviderChange]);

  if (!selectedCourseId) {
    return (
      <div className="space-y-2">
        <Label>Provider</Label>
        <div className="text-sm text-gray-500 p-3 border rounded bg-gray-50">
          Please select a course first to see available providers
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Provider</Label>
        <div className="text-sm text-gray-500 p-3 border rounded">
          Loading providers...
        </div>
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Provider</Label>
          {onCreateProvider && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCreateProvider}
              className="text-xs h-6"
            >
              <Plus className="h-3 w-3 mr-1" />
              Create Provider
            </Button>
          )}
        </div>
        <div className="text-sm text-orange-600 p-3 border border-orange-200 rounded bg-orange-50">
          No providers found for this course. Please add providers to the course first.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="provider">Course Provider</Label>
          {onCreateProvider && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCreateProvider}
              className="text-xs h-6"
            >
              <Plus className="h-3 w-3 mr-1" />
              Create Provider
            </Button>
          )}
        </div>
        <Select 
          value={selectedProviderId} 
          onValueChange={onProviderChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a provider" />
          </SelectTrigger>
          <SelectContent>
            {providers.map((provider) => (
              <SelectItem key={provider.id} value={provider.id}>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span>{provider.name}</span>
                  {provider.city && (
                    <Badge variant="outline" className="text-xs">
                      {provider.city}
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Provider Details Preview */}
      {selectedProvider && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Provider Details
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {selectedProvider.default_location && (
              <div className="flex items-start gap-2">
                <MapPin className="h-3 w-3 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <div className="text-blue-600 font-medium">Default Location</div>
                  <div className="text-blue-800">{selectedProvider.default_location}</div>
                </div>
              </div>
            )}
            {selectedProvider.contact_person && (
              <div className="flex items-start gap-2">
                <div className="h-3 w-3 mt-1 flex-shrink-0">👤</div>
                <div>
                  <div className="text-blue-600 font-medium">Contact</div>
                  <div className="text-blue-800">{selectedProvider.contact_person}</div>
                </div>
              </div>
            )}
            {selectedProvider.phone && (
              <div className="flex items-start gap-2">
                <Phone className="h-3 w-3 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <div className="text-blue-600 font-medium">Phone</div>
                  <div className="text-blue-800">{selectedProvider.phone}</div>
                </div>
              </div>
            )}
            {selectedProvider.email && (
              <div className="flex items-start gap-2">
                <Mail className="h-3 w-3 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <div className="text-blue-600 font-medium">Email</div>
                  <div className="text-blue-800">{selectedProvider.email}</div>
                </div>
              </div>
            )}
          </div>
          <div className="mt-3 space-y-1">
            <div className="text-xs text-blue-700 bg-blue-100 p-2 rounded">
              💡 These details will be auto-filled in the training form when available
            </div>
            {providers.length > 1 && (
              <div className="text-xs text-green-700 bg-green-100 p-2 rounded">
                ✅ {providers.length} providers available for this course
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}