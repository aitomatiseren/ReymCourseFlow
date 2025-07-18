
interface CourseInfoSectionProps {
  selectedCourse: any;
}

export function CourseInfoSection({ selectedCourse }: CourseInfoSectionProps) {
  if (!selectedCourse) return null;

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h4 className="font-medium mb-2">Course Information</h4>
      <div className="text-sm text-gray-600 space-y-1">
        <p><span className="font-medium">Duration: </span>{selectedCourse.duration_hours}h</p>
        {selectedCourse.price && (
          <p><span className="font-medium">Price: </span>€{selectedCourse.price} per participant</p>
        )}
        {selectedCourse.code95_points && selectedCourse.code95_points > 0 && (
          <p><span className="font-medium">Code 95: </span>{selectedCourse.code95_points} points</p>
        )}
        {selectedCourse.sessions_required && selectedCourse.sessions_required > 1 && (
          <p><span className="font-medium">Sessions Required: </span>{selectedCourse.sessions_required}</p>
        )}
      </div>
    </div>
  );
}
