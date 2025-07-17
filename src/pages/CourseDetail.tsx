import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, Edit, Calendar, Clock, Users, CheckSquare, BookOpen, Award, Trophy } from "lucide-react";
import { useCourses } from "@/hooks/useCourses";
import { useCertificatesForCourse } from "@/hooks/useCertificates";
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
  const { data: courseCertificates = [], isLoading: certificatesLoading } = useCertificatesForCourse(id || '');

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
            <Button variant="ghost" onClick={() => navigate("/training-setup?tab=courses")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Button>
          </div>

          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('common:courseDetail.courseNotFound')}</h2>
            <p className="text-gray-600">{t('common:courseDetail.courseNotFoundDesc')}</p>
            <Button className="mt-4" onClick={() => navigate("/training-setup?tab=courses")}>
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
            onClick={() => navigate("/training-setup?tab=courses")}
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
                <Users className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{t('common:courses.maxParticipants')}:</span>
                <span>{course.max_participants || t('common:courseDetail.unlimited')}</span>
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

        {/* Certificates Granted */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Award className="h-5 w-5" />
              <span>{t('common:courseDetail.certificatesGranted')}</span>
            </h2>
            {certificatesLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              </div>
            ) : courseCertificates.length > 0 ? (
              <div className="space-y-3">
                {courseCertificates.map((cert) => (
                  <div key={cert.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Trophy className="h-5 w-5 text-yellow-600" />
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {cert.licenses?.name || 'Unknown Certificate'}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            {cert.licenses?.description && (
                              <span className="text-sm text-gray-600">
                                {cert.licenses.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {cert.licenses?.validity_period_months && (
                          <div className="text-xs text-gray-500 mt-1">
                            {t('common:courseDetail.validFor')} {cert.licenses.validity_period_months} {t('common:courseDetail.months')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Award className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>{t('common:courseDetail.noCertificatesGranted')}</p>
                <p className="text-sm mt-1">{t('common:courseDetail.noCertificatesGrantedDesc')}</p>
              </div>
            )}
          </CardContent>
        </Card>

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