import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Award, 
  BookOpen,
  CheckCircle,
  AlertCircle,
  Star
} from 'lucide-react';
import { useAvailableTrainings, useEmployeeSelfServiceActions } from '@/hooks/useEmployeeSelfService';
import { formatDate } from 'date-fns';
import { toast } from '@/hooks/use-toast';

export const EmployeeTrainingBrowser: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [selectedTraining, setSelectedTraining] = useState<string | null>(null);
  const [enrollmentNotes, setEnrollmentNotes] = useState('');
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);

  const { data: trainings, isLoading } = useAvailableTrainings();
  const { requestTrainingEnrollment } = useEmployeeSelfServiceActions();

  // Filter trainings based on search and filters
  const filteredTrainings = trainings?.filter(training => {
    const matchesSearch = !searchTerm || 
      training.course_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      training.course_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      training.instructor?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !categoryFilter || training.course_category === categoryFilter;
    const matchesLevel = !levelFilter || training.course_level.toString() === levelFilter;

    return matchesSearch && matchesCategory && matchesLevel;
  }) || [];

  // Get unique categories and levels for filters
  const categories = [...new Set(trainings?.map(t => t.course_category) || [])];
  const levels = [...new Set(trainings?.map(t => t.course_level) || [])];

  const handleEnrollClick = (trainingId: string) => {
    setSelectedTraining(trainingId);
    setEnrollmentNotes('');
    setEnrollDialogOpen(true);
  };

  const handleEnrollmentSubmit = async () => {
    if (!selectedTraining) return;

    try {
      await requestTrainingEnrollment.mutateAsync({
        trainingId: selectedTraining,
        notes: enrollmentNotes || undefined
      });

      toast({
        title: "Enrollment Request Submitted",
        description: "Your training enrollment request has been submitted for approval."
      });

      setEnrollDialogOpen(false);
      setSelectedTraining(null);
      setEnrollmentNotes('');
    } catch (error) {
      toast({
        title: "Enrollment Failed",
        description: "Failed to submit enrollment request. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getSelectedTrainingDetails = () => {
    return trainings?.find(t => t.id === selectedTraining);
  };

  const getLevelBadgeColor = (level: number) => {
    const colors = {
      1: 'bg-green-100 text-green-800',
      2: 'bg-blue-100 text-blue-800', 
      3: 'bg-yellow-100 text-yellow-800',
      4: 'bg-orange-100 text-orange-800',
      5: 'bg-red-100 text-red-800'
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getAvailabilityColor = (availableSpots: number, maxParticipants: number) => {
    const ratio = availableSpots / maxParticipants;
    if (ratio > 0.5) return 'text-green-600';
    if (ratio > 0.2) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-6 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Available Trainings</h1>
        <p className="text-gray-600 mt-1">
          Browse and enroll in available training courses
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search trainings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Levels</SelectItem>
                {levels.map(level => (
                  <SelectItem key={level} value={level.toString()}>
                    Level {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('');
                setLevelFilter('');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {filteredTrainings.length} of {trainings?.length || 0} available trainings
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span>Available</span>
          <AlertCircle className="h-4 w-4 text-blue-600 ml-4" />
          <span>Enrolled</span>
        </div>
      </div>

      {/* Training Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTrainings.map((training) => (
          <Card key={training.id} className={`relative ${training.is_enrolled ? 'border-blue-200 bg-blue-50/50' : ''}`}>
            {training.is_enrolled && (
              <div className="absolute top-3 right-3">
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                  {training.enrollment_status === 'pending' ? 'Pending' : 'Enrolled'}
                </Badge>
              </div>
            )}
            
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 mr-2">
                  <CardTitle className="text-lg leading-tight">
                    {training.course_title}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {training.course_category}
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getLevelBadgeColor(training.course_level)}>
                  Level {training.course_level}
                </Badge>
                {training.code95_points && (
                  <Badge variant="outline" className="text-orange-600 border-orange-200">
                    {training.code95_points} Code 95 pts
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Training Details */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{formatDate(new Date(training.start_date), 'MMM dd, yyyy')}</span>
                  {training.end_date !== training.start_date && (
                    <span> - {formatDate(new Date(training.end_date), 'MMM dd, yyyy')}</span>
                  )}
                </div>
                
                {training.location && (
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{training.location}</span>
                  </div>
                )}
                
                {training.instructor && (
                  <div className="flex items-center text-gray-600">
                    <Star className="h-4 w-4 mr-2" />
                    <span>{training.instructor}</span>
                  </div>
                )}

                <div className="flex items-center text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>{training.duration_hours} hours</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span>{training.current_participants}/{training.max_participants}</span>
                  </div>
                  <span className={`text-sm font-medium ${getAvailabilityColor(training.available_spots, training.max_participants)}`}>
                    {training.available_spots} spots left
                  </span>
                </div>
              </div>

              {/* Description */}
              {training.description && (
                <div className="border-t pt-3">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {training.description}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="border-t pt-3">
                {training.is_enrolled ? (
                  <div className="flex items-center justify-center py-2 text-sm text-blue-600">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span>
                      {training.enrollment_status === 'pending' ? 'Enrollment Pending Approval' : 'Already Enrolled'}
                    </span>
                  </div>
                ) : training.available_spots > 0 ? (
                  <Button 
                    className="w-full" 
                    onClick={() => handleEnrollClick(training.id)}
                    disabled={requestTrainingEnrollment.isPending}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Request Enrollment
                  </Button>
                ) : (
                  <Button variant="outline" disabled className="w-full">
                    <Users className="h-4 w-4 mr-2" />
                    Training Full
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredTrainings.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No trainings found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or check back later for new trainings.
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('');
                setLevelFilter('');
              }}
            >
              Clear all filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Enrollment Dialog */}
      <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Training Enrollment</DialogTitle>
            <DialogDescription>
              Submit a request to enroll in "{getSelectedTrainingDetails()?.course_title}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Training Details Summary */}
            {getSelectedTrainingDetails() && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{formatDate(new Date(getSelectedTrainingDetails()!.start_date), 'PPP')}</span>
                </div>
                {getSelectedTrainingDetails()!.location && (
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{getSelectedTrainingDetails()!.location}</span>
                  </div>
                )}
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{getSelectedTrainingDetails()!.duration_hours} hours</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any relevant information about your enrollment request..."
                value={enrollmentNotes}
                onChange={(e) => setEnrollmentNotes(e.target.value)}
                rows={3}
              />
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your enrollment request will be submitted for approval. You will be notified once it's reviewed.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEnrollDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleEnrollmentSubmit}
              disabled={requestTrainingEnrollment.isPending}
            >
              {requestTrainingEnrollment.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};