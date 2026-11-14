import { updateLesson, useLessonProgress } from '../../stores/progress';

const OPTIONS = [
  { id: 'green', label: 'Green', text: 'I can do it and explain why it works.' },
  { id: 'yellow', label: 'Yellow', text: 'I can do it with hints, but can’t fully explain it yet.' },
  { id: 'red', label: 'Red', text: 'I’m stuck and need help.' },
] as const;

/** The curriculum's Green / Yellow / Red self-assessment, saved in this browser. */
export default function SelfRating({ lessonId }: { lessonId: string }) {
  const { rating } = useLessonProgress(lessonId);
  return (
    <fieldset className="lf-rating not-content">
      <legend>Rate yourself on this lesson</legend>
      {OPTIONS.map((o) => (
        <label key={o.id} className={`${o.id}${rating === o.id ? ' picked' : ''}`}>
          <input type="radio" name={`rating-${lessonId}`} checked={rating === o.id} onChange={() => updateLesson(lessonId, { rating: o.id })} />
          <b>{o.label}</b> <span>{o.text}</span>
        </label>
      ))}
      {rating && rating !== 'green' && <p>That’s useful to know. Replay the playground experiments, then ask a mentor about the part that feels shaky.</p>}
    </fieldset>
  );
}
