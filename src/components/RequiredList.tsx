import type { RequiredCourse } from "../data/types";

interface RequiredListProps {
  title: string;
  description?: string;
  courses: RequiredCourse[];
  selectedCourses: number[];
  toggleCourse: (id: number) => void;
}

function RequiredList({ title, description, courses, selectedCourses, toggleCourse }: RequiredListProps) {
  const completedCount = courses.filter((course) => selectedCourses.includes(course.id)).length;

  return (
    <div>
      <div className="required-list-header">
        <div className="section-heading">
          <div>
            <span className="section-kicker">STEP 3</span>
            <h2>{title}</h2>
            {description && <p>{description}</p>}
          </div>
        </div>
        <span className="course-count">{completedCount} / {courses.length}</span>
      </div>

      <div className="required-course-grid">
        {courses.map((course) => {
          const isSelected = selectedCourses.includes(course.id);
          return (
            <label key={course.id} className={`required-course ${isSelected ? "is-selected" : ""}`}>
              <input type="checkbox" checked={isSelected} onChange={() => toggleCourse(course.id)} />
              <span className="custom-checkbox" aria-hidden="true">{isSelected ? "✓" : ""}</span>
              <span className="required-course-content">
                <span className="required-course-name">{course.name}</span>
                <span className="required-course-meta">{course.code} · {course.credit}학점{course.crossRecognition && " · 교차인정"}</span>
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default RequiredList;
