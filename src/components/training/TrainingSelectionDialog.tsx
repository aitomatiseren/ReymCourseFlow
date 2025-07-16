import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Search, 
  Calendar, 
  MapPin, 
  Users, 
  Clock,
  CheckCircle,
  AlertCircle,
  Plus
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTrainingParticipants } from "@/hooks/useTrainingParticipants";

interface TrainingSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  licenseId: string;
  onTrainingSelected?: (trainingId: string) => void;
  onCreateNewTraining?: (licenseId: string) => void;
}

interface AvailableTraining {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  instructor: string;
  max_participants: number;
  current_participants: number;
  available_spots: number;
  course_id: string;
  course_title: string;
  code95_points?: number;
  price?: number;
  status: string;
}

export function TrainingSelectionDialog({ 
  open, 
  onOpenChange, 
  employeeId, 
  licenseId,
  onTrainingSelected,
  onCreateNewTraining
}: TrainingSelectionDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTraining, setSelectedTraining] = useState<string | null>(null);
  const { toast } = useToast();
  const { addParticipant } = useTrainingParticipants();

  // Fetch available trainings with capacity for the specific license
  const { data: availableTrainings, isLoading, error } = useQuery({
    queryKey: ['available-trainings', licenseId],
    queryFn: async () => {
      if (!licenseId) return [];

      // Get trainings with available capacity for courses that provide the required license
      const { data: trainings, error: trainingsError } = await supabase
        .from('trainings')
        .select(`
          id,
          title,
          date,
          time,
          location,
          instructor,
          max_participants,
          status,
          course_id,
          courses (
            id,
            title,
            code95_points,
            price,
            course_certificates (
              license_id,
              licenses (
                id,
                name
              )
            )
          )
        `)
        .eq('status', 'scheduled')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (trainingsError) throw trainingsError;

      // Get participant counts for each training
      const { data: participantCounts, error: participantError } = await supabase
        .from('training_participants')
        .select('training_id')
        .in('status', ['enrolled', 'attended']);

      if (participantError) throw participantError;

      // Calculate participant counts per training
      const participantCountsMap = participantCounts.reduce((acc, participant) => {
        acc[participant.training_id] = (acc[participant.training_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Filter and transform trainings
      const availableTrainings: AvailableTraining[] = trainings
        ?.filter(training => {
          // Check if training is relevant to the license
          const courseRelevant = training.courses?.course_certificates?.some(cc => 
            cc.license_id === licenseId
          );
          if (!courseRelevant) return false;

          // Check if training has available capacity
          const currentParticipants = participantCountsMap[training.id] || 0;
          const hasCapacity = currentParticipants < training.max_participants;

          return hasCapacity;
        })
        .map(training => {
          const currentParticipants = participantCountsMap[training.id] || 0;
          return {
            id: training.id,
            title: training.title,
            date: training.date,
            time: training.time,
            location: training.location,
            instructor: training.instructor || 'TBD',
            max_participants: training.max_participants,
            current_participants: currentParticipants,
            available_spots: training.max_participants - currentParticipants,
            course_id: training.course_id,
            course_title: training.courses?.title || training.title,
            code95_points: training.courses?.code95_points,
            price: training.courses?.price,
            status: training.status
          };
        }) || [];

      return availableTrainings;
    },
    enabled: !!licenseId && open,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const filteredTrainings = availableTrainings?.filter(training => {
    const searchLower = searchTerm.toLowerCase();
    return (
      training.title.toLowerCase().includes(searchLower) ||
      training.course_title.toLowerCase().includes(searchLower) ||
      training.location.toLowerCase().includes(searchLower) ||
      training.instructor.toLowerCase().includes(searchLower)
    );
  }) || [];

  const handleAddToTraining = async (trainingId: string) => {
    try {
      await addParticipant.mutateAsync({
        trainingId,
        employeeId,
        status: 'enrolled'
      });

      toast({
        title: "Success",
        description: "Employee has been added to the training successfully"
      });

      onTrainingSelected?.(trainingId);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add employee to training",
        variant: "destructive"
      });
    }
  };

  const handleCreateNewTraining = () => {
    onCreateNewTraining?.(licenseId);
    onOpenChange(false);
  };

  const getCapacityColor = (availableSpots: number, maxParticipants: number) => {
    const ratio = availableSpots / maxParticipants;
    if (ratio > 0.5) return "text-green-600";
    if (ratio > 0.2) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Select Training for Employee
          </DialogTitle>
          <DialogDescription>
            Choose an existing training with available capacity or create a new one.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search trainings by title, location, or instructor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Create New Training Option */}
          <Card className="border-dashed border-2 border-blue-300 hover:border-blue-400 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Plus className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Create New Training</h3>
                    <p className="text-sm text-gray-600">
                      Schedule a new training session for this certificate
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleCreateNewTraining}
                  className="border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  Create New
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-center justify-center py-8 text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>Error loading trainings: {error.message}</span>
            </div>
          )}

          {/* Available Trainings */}
          {!isLoading && !error && (
            <div className="space-y-3">
              {filteredTrainings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No available trainings found for this certificate</p>
                  <p className="text-sm mt-2">Try creating a new training session instead</p>
                </div>
              ) : (
                filteredTrainings.map((training) => (
                  <Card key={training.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {training.title}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {training.course_title}
                            </Badge>
                            {training.code95_points && (
                              <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">
                                {training.code95_points} Code 95 Points
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(training.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{training.time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{training.location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <span className={getCapacityColor(training.available_spots, training.max_participants)}>
                                {training.available_spots} spots available
                              </span>
                              <span className="text-gray-400">
                                ({training.current_participants}/{training.max_participants})
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-500">
                              Instructor: {training.instructor}
                            </span>
                            {training.price && (
                              <span className="text-gray-500">
                                €{training.price}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Button 
                            size="sm"
                            onClick={() => handleAddToTraining(training.id)}
                            disabled={addParticipant.isPending}
                            className="flex items-center gap-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                            {addParticipant.isPending ? 'Adding...' : 'Add to Training'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}