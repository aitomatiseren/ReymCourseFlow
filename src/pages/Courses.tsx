
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ViewToggle } from "@/components/ui/view-toggle";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Calendar, Users, DollarSign, Edit, Trash2, Loader2, ArrowUpDown, ArrowUp, ArrowDown, Eye } from "lucide-react";
import { AddCourseDialog } from "@/components/courses/AddCourseDialog";
import { EditCourseDialog } from "@/components/courses/EditCourseDialog";
import { useCourses, useDeleteCourse, Course } from "@/hooks/useCourses";
import { useToast } from "@/hooks/use-toast";
import { useViewMode } from "@/hooks/useViewMode";

const categoryColors = {
  Safety: "bg-red-100 text-red-800",
  Equipment: "bg-blue-100 text-blue-800",
  Medical: "bg-green-100 text-green-800",
  Technical: "bg-purple-100 text-purple-800",
  Management: "bg-orange-100 text-orange-800"
};

type SortField = 'title' | 'category' | 'duration_hours' | 'created_at';
type SortDirection = 'asc' | 'desc';

export default function Courses() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showCode95Only, setShowCode95Only] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [viewMode, setViewMode] = useViewMode('courses');
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [highlightedCourseId, setHighlightedCourseId] = useState<string | null>(null);

  const { data: courses = [], isLoading, error } = useCourses();
  const deleteCourse = useDeleteCourse();
  const { toast } = useToast();

  // Check for highlight parameter in URL
  useEffect(() => {
    const highlightId = searchParams.get('highlight');
    if (highlightId) {
      setHighlightedCourseId(highlightId);
      // Clear the highlight after a few seconds
      setTimeout(() => setHighlightedCourseId(null), 3000);
    }
  }, [searchParams]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const sortedAndFilteredCourses = courses
    .filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === "all" || course.category === selectedCategory;
      const matchesCode95 = !showCode95Only || (course.code95_points && course.code95_points > 0);
      
      return matchesSearch && matchesCategory && matchesCode95;
    })
    .sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === 'asc' ? 1 : -1;
      if (bValue == null) return sortDirection === 'asc' ? -1 : 1;
      
      // Convert to strings for comparison if needed
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setShowEditDialog(true);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    
    try {
      await deleteCourse.mutateAsync(courseId);
      toast({
        title: "Success",
        description: "Course deleted successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete course",
        variant: "destructive"
      });
    }
  };

  const handleScheduleCourse = (courseId: string) => {
    console.log(`Navigating to schedule course ${courseId}`);
    navigate(`/scheduling?courseId=${courseId}`);
  };

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">Error loading courses: {error.message}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
            <p className="text-gray-600 mt-1">Manage courses, schedules, and training programs.</p>
          </div>
          <div className="flex items-center space-x-2">
            <ViewToggle value={viewMode} onValueChange={setViewMode} />
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Course
            </Button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search courses..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="Safety">Safety</option>
                <option value="Equipment">Equipment</option>
                <option value="Medical">Medical</option>
                <option value="Technical">Technical</option>
                <option value="Management">Management</option>
              </select>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showCode95Only}
                  onChange={(e) => setShowCode95Only(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Code 95 only</span>
              </label>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleSort('title')}
                  className="flex items-center space-x-1"
                >
                  <span>Title</span>
                  {getSortIcon('title')}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleSort('category')}
                  className="flex items-center space-x-1"
                >
                  <span>Category</span>
                  {getSortIcon('category')}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleSort('duration_hours')}
                  className="flex items-center space-x-1"
                >
                  <span>Duration</span>
                  {getSortIcon('duration_hours')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Loading courses...</span>
          </div>
        )}

        {!isLoading && viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedAndFilteredCourses.map((course) => (
              <Card 
                key={course.id} 
                className={`hover:shadow-lg transition-shadow flex flex-col h-full ${
                  highlightedCourseId === course.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                }`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <div className="flex items-center space-x-2 flex-wrap">
                        <Badge className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 flex flex-col flex-grow">
                  {course.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
                  )}
                  
                  <div className="flex-grow">
                    {course.sessions_required && course.sessions_required > 1 && (
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <Calendar className="h-4 w-4 mr-2" />
                        Sessions: {course.sessions_required}
                      </div>
                    )}
                    {course.duration_hours && (
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <Calendar className="h-4 w-4 mr-2" />
                        Duration: {course.duration_hours} hours
                      </div>
                    )}
                    {course.max_participants && (
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <Users className="h-4 w-4 mr-2" />
                        Max {course.max_participants} participants
                      </div>
                    )}
                    {course.price && (
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="h-4 w-4 mr-2" />
                        €{course.price} per participant
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-auto">
                    <Button 
                      size="sm" 
                      className="w-full h-9 bg-slate-800 text-white hover:bg-slate-900"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/courses/${course.id}`);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Courses List */}
        {!isLoading && viewMode === 'list' && (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-left font-medium">
                      <Button 
                        variant="ghost" 
                        onClick={() => handleSort('title')}
                        className="flex items-center space-x-1 -ml-4"
                      >
                        <span>Course</span>
                        {getSortIcon('title')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-left font-medium">
                      <Button 
                        variant="ghost" 
                        onClick={() => handleSort('category')}
                        className="flex items-center space-x-1 -ml-4"
                      >
                        <span>Category</span>
                        {getSortIcon('category')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-left font-medium">
                      <Button 
                        variant="ghost" 
                        onClick={() => handleSort('duration_hours')}
                        className="flex items-center space-x-1 -ml-4"
                      >
                        <span>Duration</span>
                        {getSortIcon('duration_hours')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-left font-medium">Sessions</TableHead>
                    <TableHead className="text-left font-medium">Max Participants</TableHead>
                    <TableHead className="text-left font-medium w-24">Code 95</TableHead>
                    <TableHead className="text-left font-medium">Features</TableHead>
                    <TableHead className="text-right font-medium">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedAndFilteredCourses.map((course) => (
                      <TableRow 
                        key={course.id}
                        className={`hover:bg-gray-50 ${highlightedCourseId === course.id ? 'bg-blue-50' : ''}`}
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium">{course.title}</div>
                            {course.description && (
                              <div className="text-sm text-gray-500 line-clamp-1">{course.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {course.category && (
                            <Badge className={categoryColors[course.category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800'}>
                              {course.category}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {course.duration_hours ? `${course.duration_hours}h` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {course.sessions_required || 1}
                        </TableCell>
                        <TableCell>
                          {course.max_participants || 'N/A'}
                        </TableCell>
                        <TableCell className="w-24">
                          {course.code95_points && course.code95_points > 0 ? (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800 whitespace-nowrap">
                              {course.code95_points} pts
                            </Badge>
                          ) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {course.has_checklist && (
                              <Badge variant="outline" className="bg-orange-100 text-orange-800 text-xs">
                                Checklist
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm"
                            className="bg-slate-800 text-white hover:bg-slate-900"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/courses/${course.id}`);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {!isLoading && sortedAndFilteredCourses.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">No courses found matching your criteria.</p>
            </CardContent>
          </Card>
        )}

        <AddCourseDialog 
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
        />

        <EditCourseDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          course={selectedCourse}
        />
      </div>
    </Layout>
  );
}
