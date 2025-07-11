
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, User, Calendar, BookOpen } from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { useTrainings } from "@/hooks/useTrainings";
import { useCourses } from "@/hooks/useCourses";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  
  const { data: employees = [] } = useEmployees();
  const { data: trainings = [] } = useTrainings();
  const { data: courses = [] } = useCourses();

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(query.toLowerCase()) ||
    employee.email.toLowerCase().includes(query.toLowerCase()) ||
    employee.employeeNumber.toLowerCase().includes(query.toLowerCase())
  );

  const filteredTrainings = trainings.filter(training =>
    training.title.toLowerCase().includes(query.toLowerCase()) ||
    training.instructor?.toLowerCase().includes(query.toLowerCase())
  );

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(query.toLowerCase()) ||
    course.category?.toLowerCase().includes(query.toLowerCase())
  );

  const handleEmployeeClick = (employeeId: string) => {
    navigate(`/participants/${employeeId}`);
    onOpenChange(false);
    setQuery("");
  };

  const handleTrainingClick = (trainingId: string) => {
    navigate(`/scheduling?training=${trainingId}`);
    onOpenChange(false);
    setQuery("");
  };

  const handleCourseClick = (courseId: string) => {
    navigate(`/courses?course=${courseId}`);
    onOpenChange(false);
    setQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Search</DialogTitle>
        </DialogHeader>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search employees, trainings, or courses..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {query && (
          <div className="max-h-96 overflow-y-auto space-y-4">
            {/* Employees */}
            {filteredEmployees.length > 0 && (
              <div>
                <h3 className="font-medium text-sm text-gray-500 mb-2">Employees</h3>
                <div className="space-y-1">
                  {filteredEmployees.slice(0, 5).map((employee) => (
                    <Button
                      key={employee.id}
                      variant="ghost"
                      className="w-full justify-start p-3 h-auto"
                      onClick={() => handleEmployeeClick(employee.id)}
                    >
                      <User className="h-4 w-4 mr-3 flex-shrink-0" />
                      <div className="text-left">
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-sm text-gray-500">
                          {employee.jobTitle} • {employee.employeeNumber}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Trainings */}
            {filteredTrainings.length > 0 && (
              <div>
                <h3 className="font-medium text-sm text-gray-500 mb-2">Trainings</h3>
                <div className="space-y-1">
                  {filteredTrainings.slice(0, 5).map((training) => (
                    <Button
                      key={training.id}
                      variant="ghost"
                      className="w-full justify-start p-3 h-auto"
                      onClick={() => handleTrainingClick(training.id)}
                    >
                      <Calendar className="h-4 w-4 mr-3 flex-shrink-0" />
                      <div className="text-left">
                        <div className="font-medium">{training.title}</div>
                        <div className="text-sm text-gray-500">
                          {training.date} • {training.instructor}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Courses */}
            {filteredCourses.length > 0 && (
              <div>
                <h3 className="font-medium text-sm text-gray-500 mb-2">Courses</h3>
                <div className="space-y-1">
                  {filteredCourses.slice(0, 5).map((course) => (
                    <Button
                      key={course.id}
                      variant="ghost"
                      className="w-full justify-start p-3 h-auto"
                      onClick={() => handleCourseClick(course.id)}
                    >
                      <BookOpen className="h-4 w-4 mr-3 flex-shrink-0" />
                      <div className="text-left">
                        <div className="font-medium">{course.title}</div>
                        <div className="text-sm text-gray-500">
                          {course.category}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {query && filteredEmployees.length === 0 && filteredTrainings.length === 0 && filteredCourses.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No results found for "{query}"
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
