import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Building2, Settings, Award } from "lucide-react";

// Import original course components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ViewToggle } from "@/components/ui/view-toggle";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Calendar, Users, Euro, Edit, Trash2, Loader2, ArrowUpDown, ArrowUp, ArrowDown, Eye } from "lucide-react";
import { AddCourseDialog } from "@/components/courses/AddCourseDialog";
import { EditCourseDialog } from "@/components/courses/EditCourseDialog";
import { useCourses, useDeleteCourse, Course } from "@/hooks/useCourses";
import { useToast } from "@/hooks/use-toast";
import { useViewMode } from "@/hooks/useViewMode";

// Import original provider components
import { CourseProviderList } from "@/components/providers/CourseProviderList";
import { CourseProviderGrid } from "@/components/providers/CourseProviderGrid";
import { AddProviderDialog } from "@/components/providers/AddProviderDialog";

// Import certificate management components
import { CertificateTemplatesTab } from "@/components/certificates/CertificateTemplatesTab";

type SortField = 'title' | 'created_at';
type SortDirection = 'asc' | 'desc';

export default function TrainingSetup() {
  const { t } = useTranslation(['common', 'courses', 'providers']);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get active tab from URL params or default to 'courses'
  const activeTab = searchParams.get('tab') || 'courses';

  // Courses state (exact copy from original Courses.tsx)
  const [searchTerm, setSearchTerm] = useState("");
  const [showCode95Only, setShowCode95Only] = useState(false);
  const [showAddCourseDialog, setShowAddCourseDialog] = useState(false);
  const [showEditCourseDialog, setShowEditCourseDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseViewMode, setCourseViewMode] = useViewMode('courses');
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [highlightedCourseId, setHighlightedCourseId] = useState<string | null>(null);

  // Providers state (exact copy from original Providers.tsx)
  const [showAddProviderDialog, setShowAddProviderDialog] = useState(false);
  const [providerViewMode, setProviderViewMode] = useViewMode('providers');
  const [providerSearchTerm, setProviderSearchTerm] = useState("");

  // Certificates state
  const [certificateViewMode, setCertificateViewMode] = useViewMode('certificates');
  const [showAddCertificateDialog, setShowAddCertificateDialog] = useState(false);

  // Data hooks
  const { data: courses = [], isLoading, error } = useCourses();
  const deleteCourse = useDeleteCourse();

  // Handle tab change
  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  // Course handlers (exact copy from original Courses.tsx)
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

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setShowEditCourseDialog(true);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm(t('common:courses.deleteConfirm'))) return;

    try {
      await deleteCourse.mutateAsync(courseId);
      toast({
        title: t('common:common.success'),
        description: t('common:courses.courseDeleted')
      });
    } catch (error) {
      toast({
        title: t('common:common.error'),
        description: t('common:courses.deleteError'),
        variant: "destructive"
      });
    }
  };

  const handleScheduleCourse = (courseId: string) => {
    console.log(`Navigating to schedule course ${courseId}`);
    navigate(`/scheduling?courseId=${courseId}`);
  };

  // Filter and sort courses (exact copy from original Courses.tsx)
  const sortedAndFilteredCourses = courses
    .filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCode95 = !showCode95Only || (course.code95_points && course.code95_points > 0);

      return matchesSearch && matchesCode95;
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

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">{t('common:courses.errorLoading')} {error.message}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Settings className="h-8 w-8 text-blue-600" />
              {t('common:navigation.trainingSetup')}
            </h1>
            <p className="text-gray-600 mt-1">
              {t('common:trainingSetup.subtitle')}
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              {t('common:navigation.courses')}
            </TabsTrigger>
            <TabsTrigger value="providers" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {t('common:navigation.providers')}
            </TabsTrigger>
            <TabsTrigger value="certificates" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Certificates
            </TabsTrigger>
          </TabsList>

          {/* Courses Tab - Exact copy from original Courses.tsx */}
          <TabsContent value="courses" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{t('common:courses.title')}</h1>
                <p className="text-gray-600 mt-1">{t('common:courses.subtitle')}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button onClick={() => setShowAddCourseDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('common:courses.addNewCourse')}
                </Button>
                <ViewToggle value={courseViewMode} onValueChange={setCourseViewMode} />
              </div>
            </div>

            {/* Search and Filter Bar */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder={t('common:courses.searchPlaceholder')}
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showCode95Only}
                      onChange={(e) => setShowCode95Only(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">{t('common:courses.code95Only')}</span>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span>{t('common:courses.loadingCourses')}</span>
              </div>
            )}

            {!isLoading && courseViewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedAndFilteredCourses.map((course) => (
                  <Card
                    key={course.id}
                    className={`hover:shadow-lg transition-shadow flex flex-col h-full ${highlightedCourseId === course.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                      }`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <CardTitle className="text-lg">{course.title}</CardTitle>
                          <div className="flex items-center space-x-2 flex-wrap">
                            <Badge className="bg-green-100 text-green-800">
                              {t('common:courses.active')}
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
                            {t('common:courses.sessions')}: {course.sessions_required}
                          </div>
                        )}
                        {course.max_participants && (
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <Users className="h-4 w-4 mr-2" />
                            Max {course.max_participants} deelnemers
                          </div>
                        )}
                        {course.code95_points && course.code95_points > 0 && (
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs">
                              {course.code95_points} {t('common:courses.points')}
                            </Badge>
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
                          {t('common:courses.view')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Courses List */}
            {!isLoading && courseViewMode === 'list' && (
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
                            <span>{t('common:courses.course')}</span>
                            {getSortIcon('title')}
                          </Button>
                        </TableHead>
                        <TableHead className="text-left font-medium">{t('common:courses.sessions')}</TableHead>
                        <TableHead className="text-left font-medium">{t('common:courses.maxParticipants')}</TableHead>
                        <TableHead className="text-left font-medium w-24">{t('common:courses.code95')}</TableHead>
                        <TableHead className="text-right font-medium">{t('common:courses.actions')}</TableHead>
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
                            {course.sessions_required || 1}
                          </TableCell>
                          <TableCell>
                            {course.max_participants || 'N/A'}
                          </TableCell>
                          <TableCell className="w-24">
                            {course.code95_points && course.code95_points > 0 ? (
                              <Badge variant="outline" className="bg-blue-100 text-blue-800 whitespace-nowrap">
                                {course.code95_points} {t('common:courses.points')}
                              </Badge>
                            ) : 'N/A'}
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
                              {t('common:courses.view')}
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
                  <p className="text-gray-500">{t('common:courses.noCourses')}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Providers Tab - Standardized to match Courses pattern */}
          <TabsContent value="providers" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Provider Management</h1>
                <p className="text-gray-600 mt-1">
                  Manage training providers and their course offerings
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button onClick={() => setShowAddProviderDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('providers:page.addProvider')}
                </Button>
                <ViewToggle value={providerViewMode} onValueChange={setProviderViewMode} />
              </div>
            </div>

            {/* Search and Filter Bar - Match Courses pattern */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search providers by name, city, or contact person..."
                      className="pl-10"
                      value={providerSearchTerm}
                      onChange={(e) => setProviderSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {providerViewMode === 'grid' ? <CourseProviderGrid searchTerm={providerSearchTerm} /> : <CourseProviderList searchTerm={providerSearchTerm} />}
          </TabsContent>

          {/* Certificates Tab */}
          <TabsContent value="certificates" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Certificate Management</h1>
                <p className="text-gray-600 mt-1">
                  Define and manage certificate types and their course relationships
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => setShowAddCertificateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Certificate
                </Button>
                <ViewToggle value={certificateViewMode} onValueChange={setCertificateViewMode} />
              </div>
            </div>
            <CertificateTemplatesTab 
              viewMode={certificateViewMode}
              onViewModeChange={setCertificateViewMode}
              showAddDialog={showAddCertificateDialog}
              onShowAddDialogChange={setShowAddCertificateDialog}
            />
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <AddCourseDialog
          open={showAddCourseDialog}
          onOpenChange={setShowAddCourseDialog}
        />

        <EditCourseDialog
          open={showEditCourseDialog}
          onOpenChange={setShowEditCourseDialog}
          course={selectedCourse}
        />
        
        <AddProviderDialog
          open={showAddProviderDialog}
          onOpenChange={setShowAddProviderDialog}
        />
      </div>
    </Layout>
  );
}