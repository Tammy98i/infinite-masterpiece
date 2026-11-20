import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import type { Course } from '../types';
import { ClockLabel } from './ClockLabel';
import '../styles/CoursePreview.css';

type Props = {
  course: Course;
  instructorName?: string;
  accessLabel: string;
  returnFocusTo: HTMLButtonElement | null;
  onClose: () => void;
  onOpenCourse: () => void;
};

export function CoursePreview({ course, instructorName, accessLabel, returnFocusTo, onClose, onOpenCourse }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const trigger = returnFocusTo;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [returnFocusTo]);

  return (
    <dialog ref={dialogRef} className="library-course-preview" aria-labelledby={titleId} dir="rtl"
      onCancel={event => { event.preventDefault(); onClose(); }}>
      <header className="course-preview-header">
        <span>תצוגה מקדימה</span>
        <button autoFocus type="button" onClick={onClose} aria-label="סגירת תצוגה מקדימה"><X size={22} aria-hidden="true" /></button>
      </header>
      <div className="course-preview-body">
        <h2 id={titleId}>{course.title}</h2>
        <p className="course-preview-meta">
          {[instructorName, course.level, accessLabel].filter(Boolean).join(' · ')}
          {' · '}<ClockLabel seconds={course.episodes.reduce((sum, episode) => sum + episode.duration, 0)} />
        </p>
        <section aria-label="תקציר">
          <h3>תקציר</h3>
          <p>{course.description || course.subtitle || 'טרם נוסף תקציר לתוכן הזה.'}</p>
        </section>
        <section aria-label="מה לומדים">
          <h3>מה לומדים</h3>
          {course.whatYouWillLearn.length > 0 ? (
            <ul>{course.whatYouWillLearn.map((item, index) => <li key={index}>{item}</li>)}</ul>
          ) : <p>טרם נוסף פירוט של נושאי הלמידה.</p>}
        </section>
      </div>
      <footer className="course-preview-actions">
        <button type="button" className="course-preview-open" onClick={onOpenCourse}>לעמוד התוכן</button>
        <button type="button" onClick={onClose}>חזרה לספרייה</button>
      </footer>
    </dialog>
  );
}
