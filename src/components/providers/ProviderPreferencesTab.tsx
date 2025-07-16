import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult 
} from '@hello-pangea/dnd';
import { 
  GripVertical, 
  Plus, 
  Trash2, 
  MapPin, 
  DollarSign, 
  Star, 
  Clock,
  AlertCircle,
  Save,
  Calculator
} from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';
import { useProviders } from '@/hooks/useProviders';
import { 
  useProviderPreferences, 
  useUpsertProviderPreference, 
  useDeleteProviderPreference,
  useBulkUpdateProviderPreferences,
  useWorkHubs,
  useCalculateDistance
} from '@/hooks/useProviderPreferences';
import { toast } from 'sonner';

interface ProviderPreferencesTabProps {
  selectedCourseId?: string;
  onCourseSelect: (courseId: string) => void;
}

export function ProviderPreferencesTab({ 
  selectedCourseId, 
  onCourseSelect 
}: ProviderPreferencesTabProps) {
  const [editingPreference, setEditingPreference] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPreference, setNewPreference] = useState({
    provider_id: '',
    cost_per_participant: '',
    quality_rating: '',
    distance_from_hub_km: '',
    booking_lead_time_days: '14',
    cancellation_policy: '',
    rescheduling_flexibility_score: '5',
    notes: ''
  });

  const { data: courses = [], isLoading: coursesLoading } = useCourses();
  const { data: providers = [], isLoading: providersLoading } = useProviders();
  const { data: preferences = [], isLoading: preferencesLoading } = useProviderPreferences(selectedCourseId);
  const { data: workHubs = [] } = useWorkHubs();
  
  const upsertPreference = useUpsertProviderPreference();
  const deletePreference = useDeleteProviderPreference();
  const bulkUpdatePreferences = useBulkUpdateProviderPreferences();
  const calculateDistance = useCalculateDistance();

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(preferences);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update priority ranks
    const updates = items.map((item, index) => ({
      id: item.id,
      priority_rank: index + 1
    }));

    bulkUpdatePreferences.mutate(updates);
  };

  const handleSavePreference = (preferenceData: any) => {
    if (!selectedCourseId) {
      toast.error('Please select a course first');
      return;
    }

    const preference = {
      ...preferenceData,
      course_id: selectedCourseId,
      priority_rank: preferences.length + 1,
      cost_per_participant: preferenceData.cost_per_participant ? parseFloat(preferenceData.cost_per_participant) : null,
      quality_rating: preferenceData.quality_rating ? parseFloat(preferenceData.quality_rating) : null,
      distance_from_hub_km: preferenceData.distance_from_hub_km ? parseFloat(preferenceData.distance_from_hub_km) : null,
      booking_lead_time_days: preferenceData.booking_lead_time_days ? parseInt(preferenceData.booking_lead_time_days) : 14,
      rescheduling_flexibility_score: preferenceData.rescheduling_flexibility_score ? parseInt(preferenceData.rescheduling_flexibility_score) : 5,
    };

    upsertPreference.mutate(preference, {
      onSuccess: () => {
        setShowAddForm(false);
        setEditingPreference(null);
        setNewPreference({
          provider_id: '',
          cost_per_participant: '',
          quality_rating: '',
          distance_from_hub_km: '',
          booking_lead_time_days: '14',
          cancellation_policy: '',
          rescheduling_flexibility_score: '5',
          notes: ''
        });
      }
    });
  };

  const handleDeletePreference = (id: string) => {
    if (confirm('Are you sure you want to delete this provider preference?')) {
      deletePreference.mutate(id);
    }
  };

  const handleCalculateDistance = async (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    const primaryHub = workHubs.find(h => h.is_primary);
    
    if (!provider || !primaryHub || !provider.latitude || !provider.longitude || !primaryHub.latitude || !primaryHub.longitude) {
      toast.error('Missing location data for distance calculation');
      return;
    }

    try {
      const distance = await calculateDistance.mutateAsync({
        providerLat: provider.latitude,
        providerLng: provider.longitude,
        hubLat: primaryHub.latitude,
        hubLng: primaryHub.longitude,
      });

      setNewPreference(prev => ({
        ...prev,
        distance_from_hub_km: distance.toString()
      }));

      toast.success(`Distance calculated: ${distance} km`);
    } catch (error) {
      toast.error('Failed to calculate distance');
    }
  };

  const getPriorityColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-green-100 text-green-800 border-green-200';
      case 2: return 'bg-blue-100 text-blue-800 border-blue-200';
      case 3: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getQualityStars = (rating: number | null) => {
    if (!rating) return null;
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const availableProviders = providers.filter(provider => 
    !preferences.some(pref => pref.provider_id === provider.id)
  );

  if (coursesLoading || providersLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Course Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Provider Preferences Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="course-select">Select Course</Label>
              <Select value={selectedCourseId || ''} onValueChange={onCourseSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a course to manage provider preferences" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCourseId && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <AlertCircle className="h-4 w-4" />
                Drag providers to reorder priority. Priority 1 = highest preference.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Provider Preferences List */}
      {selectedCourseId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Provider Preferences for {courses.find(c => c.id === selectedCourseId)?.title}</CardTitle>
              <Button 
                onClick={() => setShowAddForm(true)}
                disabled={availableProviders.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Provider
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {preferencesLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : preferences.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Star className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No provider preferences set for this course.</p>
                <p className="text-sm">Add providers to define your preferences and priorities.</p>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="provider-preferences">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                      {preferences.map((preference, index) => (
                        <Draggable key={preference.id} draggableId={preference.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start gap-4">
                                <div {...provided.dragHandleProps} className="pt-1">
                                  <GripVertical className="h-5 w-5 text-gray-400 cursor-grab" />
                                </div>
                                
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                      <Badge className={getPriorityColor(preference.priority_rank)}>
                                        Priority {preference.priority_rank}
                                      </Badge>
                                      <h3 className="font-semibold">
                                        {preference.course_providers?.name}
                                      </h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditingPreference(preference.id)}
                                      >
                                        Edit
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeletePreference(preference.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                      <DollarSign className="h-4 w-4 text-green-600" />
                                      <span>
                                        {preference.cost_per_participant 
                                          ? `€${preference.cost_per_participant}` 
                                          : 'No cost set'
                                        }
                                      </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-4 w-4 text-blue-600" />
                                      <span>
                                        {preference.distance_from_hub_km 
                                          ? `${preference.distance_from_hub_km} km` 
                                          : 'Distance unknown'
                                        }
                                      </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center">
                                        {getQualityStars(preference.quality_rating)}
                                      </div>
                                      <span>
                                        {preference.quality_rating 
                                          ? `${preference.quality_rating}/10` 
                                          : 'Unrated'
                                        }
                                      </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4 text-orange-600" />
                                      <span>
                                        {preference.booking_lead_time_days || 14} days lead time
                                      </span>
                                    </div>
                                  </div>

                                  {preference.notes && (
                                    <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                                      <strong>Notes:</strong> {preference.notes}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Provider Form */}
      {showAddForm && selectedCourseId && (
        <Card>
          <CardHeader>
            <CardTitle>Add Provider Preference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="provider-select">Provider</Label>
                <Select 
                  value={newPreference.provider_id} 
                  onValueChange={(value) => setNewPreference(prev => ({ ...prev, provider_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProviders.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.name} - {provider.city}, {provider.country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cost">Cost per Participant (€)</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    placeholder="150.00"
                    value={newPreference.cost_per_participant}
                    onChange={(e) => setNewPreference(prev => ({ ...prev, cost_per_participant: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quality">Quality Rating (1-10)</Label>
                  <Input
                    id="quality"
                    type="number"
                    min="1"
                    max="10"
                    step="0.1"
                    placeholder="8.5"
                    value={newPreference.quality_rating}
                    onChange={(e) => setNewPreference(prev => ({ ...prev, quality_rating: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="distance">Distance from Hub (km)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="distance"
                      type="number"
                      step="0.1"
                      placeholder="25.5"
                      value={newPreference.distance_from_hub_km}
                      onChange={(e) => setNewPreference(prev => ({ ...prev, distance_from_hub_km: e.target.value }))}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCalculateDistance(newPreference.provider_id)}
                      disabled={!newPreference.provider_id || calculateDistance.isPending}
                    >
                      <Calculator className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lead-time">Booking Lead Time (days)</Label>
                  <Input
                    id="lead-time"
                    type="number"
                    min="1"
                    placeholder="14"
                    value={newPreference.booking_lead_time_days}
                    onChange={(e) => setNewPreference(prev => ({ ...prev, booking_lead_time_days: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="flexibility">Rescheduling Flexibility (1-10)</Label>
                <Input
                  id="flexibility"
                  type="number"
                  min="1"
                  max="10"
                  placeholder="5"
                  value={newPreference.rescheduling_flexibility_score}
                  onChange={(e) => setNewPreference(prev => ({ ...prev, rescheduling_flexibility_score: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cancellation">Cancellation Policy</Label>
                <Input
                  id="cancellation"
                  placeholder="48 hours notice required"
                  value={newPreference.cancellation_policy}
                  onChange={(e) => setNewPreference(prev => ({ ...prev, cancellation_policy: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes about this provider..."
                  value={newPreference.notes}
                  onChange={(e) => setNewPreference(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div className="flex items-center gap-2 pt-4">
                <Button 
                  onClick={() => handleSavePreference(newPreference)}
                  disabled={!newPreference.provider_id || upsertPreference.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {upsertPreference.isPending ? 'Saving...' : 'Save Preference'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddForm(false);
                    setNewPreference({
                      provider_id: '',
                      cost_per_participant: '',
                      quality_rating: '',
                      distance_from_hub_km: '',
                      booking_lead_time_days: '14',
                      cancellation_policy: '',
                      rescheduling_flexibility_score: '5',
                      notes: ''
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}