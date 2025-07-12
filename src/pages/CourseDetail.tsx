import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Edit, Calendar, Clock, Users, DollarSign, CheckSquare, BookOpen } from "lucide-react";
import { useCourses } from "@/hooks/useCourses";
import { EditCourseDialog } from "@/components/courses/EditCourseDialog";
import { useToast } from "@/hooks/use-toast";

export default function CourseDetail() {
  const { t } = useTranslation(['common', 'courses']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { toast } = useToast();

  const { data: courses = [], isLoading } = useCourses();
  const course = courses.find(c => c.id === id);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate("/courses")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Button>
          </div>

          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('common:courseDetail.courseNotFound')}</h2>
            <p className="text-gray-600">{t('common:courseDetail.courseNotFoundDesc')}</p>
            <Button className="mt-4" onClick={() => navigate("/courses")}>
              {t('common:courseDetail.viewAllCourses')}
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('common:courseDetail.title')}</h1>
            <p className="text-gray-600 mt-1">{t('common:courseDetail.subtitle')}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/courses")}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t('common:courseDetail.backToCourses')}</span>
          </Button>
        </div>

        {/* Course Details */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h2>
                {course.description && (
                  <p className="text-gray-700">{course.description}</p>
                )}
              </div>
              <Button onClick={() => setShowEditDialog(true)} className="flex items-center space-x-2">
                <Edit className="h-4 w-4" />
                <span>{t('common:courseDetail.editCourse')}</span>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{t('common:courseDetail.duration')}:</span>
                <span>{course.duration_hours ? `${course.duration_hours} ${t('common:courseDetail.hours')}` : t('common:courseDetail.notSpecified')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{t('common:courses.maxParticipants')}:</span>
                <span>{course.max_participants || t('common:courseDetail.unlimited')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{t('common:courseDetail.price')}:</span>
                <span>€{course.price || '0'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{t('common:courseDetail.sessionsRequired')}:</span>
                <span>{course.sessions_required || 1}</span>
              </div>
              {course.code95_points && course.code95_points > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{t('common:courseDetail.code95Points')}:</span>
                  <span>{course.code95_points}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        {course.cost_breakdown && Array.isArray(course.cost_breakdown) && course.cost_breakdown.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">{t('common:courseDetail.costBreakdown')}</h2>
              <div className="space-y-3">
                {course.cost_breakdown.map((cost: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{cost.name}</div>
                      {cost.description && (
                        <div className="text-sm text-gray-500">{cost.description}</div>
                      )}
                    </div>
                    <span className="font-medium">€{cost.amount}</span>
                  </div>
                ))}
                <div className="border-t pt-3 flex items-center justify-between font-semibold">
                  <span>{t('common:courseDetail.total')}</span>
                  <span>€{course.price}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Checklist */}
        {course.has_checklist && course.checklist_items && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">{t('common:courseDetail.courseChecklist')}</h2>
              <div className="space-y-2">
                {Array.isArray(course.checklist_items) ? (
                  course.checklist_items.map((item: any, index: number) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <CheckSquare className="h-4 w-4 text-gray-400" />
                      <span>{typeof item === 'string' ? item : item.text || item.name}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">{t('common:courseDetail.checklistAvailable')}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <EditCourseDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          course={course}
        />
      </div>
    </Layout>
  );
}