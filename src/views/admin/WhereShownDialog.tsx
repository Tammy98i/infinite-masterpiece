import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { Bidi } from '../../components/Bidi';
import { fieldClass } from './adminConstants';

type Face = {
  id: string;
  name: string;
  title: string;
  webinar: boolean;
  site: boolean;
  library: boolean;
  linkedUserId: string;
};

type Places = { webinar: boolean; site: boolean; library: boolean };

const EMPTY: Places = { webinar: false, site: false, library: false };

function placeLabel(face: Face) {
  const where = [
    face.webinar ? 'וובינר' : '',
    face.site ? 'אתר' : '',
    face.library ? 'ספרייה' : '',
  ].filter(Boolean);
  return where.length ? where.join(' · ') : 'עדיין לא מוצג';
}

function PlaceRow({
  shown,
  canAdd,
  label,
  hint,
  pending,
  onAdd,
  onToggle,
}: {
  shown: boolean;
  canAdd: boolean;
  label: string;
  hint: string;
  pending: boolean;
  onAdd: () => void;
  onToggle: () => void;
}) {
  return (
    <div className="flex w-full items-center justify-between gap-4 rounded border border-white/10 px-3 py-2 text-start min-h-16">
      <span>
        <span className="block text-sm text-white">{label}</span>
        <span className="block text-xs text-white/45">{hint}</span>
      </span>
      {canAdd && !shown ? (
        <button
          type="button"
          disabled={pending}
          onClick={onAdd}
          className="shrink-0 rounded-full bg-[#b79043] px-3 min-h-9 text-xs text-black cursor-pointer disabled:opacity-50"
        >
          הוסף עם אותם פרטים
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={onToggle}
          aria-pressed={shown}
          className={`shrink-0 rounded-full px-3 min-h-9 text-xs cursor-pointer disabled:opacity-50 ${shown ? 'bg-[#b79043] text-black' : 'bg-white/10 text-white/55'}`}
        >
          {shown ? 'מוצג' : 'מוסתר'}
        </button>
      )}
    </div>
  );
}

export function WhereShownDialog({
  userId,
  name,
  email,
  onClose,
  onSaved,
}: {
  userId: string;
  name: string;
  email: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [faces, setFaces] = useState<Face[]>([]);
  const [faceId, setFaceId] = useState('');
  const [places, setPlaces] = useState<Places>(EMPTY);
  const [origin, setOrigin] = useState<Places>(EMPTY);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    adminApi
      .publicFaces()
      .then((res) => {
        setFaces(res.faces);
        const linked = res.faces.find((face) => face.linkedUserId === userId);
        if (!linked) return;
        const next = { webinar: linked.webinar, site: linked.site, library: linked.library };
        setFaceId(linked.id);
        setPlaces(next);
        setOrigin(next);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'טעינה נכשלה'));
  }, [userId]);

  const selected = faces.find((face) => face.id === faceId) || null;

  const choose = (id: string) => {
    setFaceId(id);
    const face = faces.find((item) => item.id === id);
    const next = face
      ? { webinar: face.webinar, site: face.site, library: face.library }
      : EMPTY;
    setPlaces(next);
    setOrigin(next);
  };

  const persist = async (next: Places, closeAfter: boolean) => {
    if (!faceId) {
      setError('בחרי פרופיל ציבורי.');
      return;
    }
    setPending(true);
    setError('');
    try {
      const saved = await adminApi.saveAppearance(userId, {
        faceId,
        showWebinar: next.webinar,
        showSite: next.site,
        showLibrary: next.library,
      });
      const face = saved.face;
      if (face) {
        const shown = { webinar: face.webinar, site: face.site, library: face.library };
        setFaceId(face.id);
        setPlaces(shown);
        setOrigin(shown);
        setFaces((current) => [
          { ...face, linkedUserId: userId },
          ...current.filter((item) => item.id !== faceId && item.id !== face.id),
        ]);
      }
      onSaved();
      if (closeAfter) onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'השמירה נכשלה');
    } finally {
      setPending(false);
    }
  };

  const addPlace = (key: keyof Places) => {
    void persist({ ...places, [key]: true }, false);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/75 cursor-pointer" aria-label="סגירה" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="where-shown-title" className="crm-desk-pop relative w-full max-w-xl max-h-[min(90dvh,40rem)] overflow-y-auto crm-desk-panel border border-[#b79043]/40 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="where-shown-title" className="text-2xl font-light">איפה מופיע</h2>
            <p className="mt-2 text-sm">{name}</p>
            <p className="text-xs text-white/45"><Bidi kind="email">{email}</Bidi></p>
          </div>
          <button type="button" onClick={onClose} className="min-h-11 min-w-11 rounded border border-white/15 cursor-pointer" aria-label="סגור">
            <X className="mx-auto w-4 h-4" />
          </button>
        </div>
        <label className="mt-6 grid gap-1 text-xs text-[#dfc47d]">
          הפרופיל הציבורי
          <select value={faceId} onChange={(event) => choose(event.target.value)} className={fieldClass}>
            <option value="">בחרי אדם שכבר מופיע</option>
            {faces.map((face) => (
              <option key={face.id} value={face.id}>
                {face.name} · {placeLabel(face)}
              </option>
            ))}
          </select>
        </label>
        {selected && selected.linkedUserId && selected.linkedUserId !== userId ? (
          <p className="mt-2 text-xs text-white/45">הפרופיל משויך לחשבון אחר. השמירה תעביר אותו לחשבון הזה.</p>
        ) : null}
        {selected ? <div className="mt-4 grid gap-2">
          <PlaceRow shown={places.webinar} canAdd={!origin.webinar} label="וובינר" hint="הכוכבים בעמוד הוובינר" pending={pending} onAdd={() => addPlace('webinar')} onToggle={() => setPlaces((current) => ({ ...current, webinar: !current.webinar }))} />
          <PlaceRow shown={places.site} canAdd={!origin.site} label="האתר" hint="הלשונית צוות המיזם" pending={pending} onAdd={() => addPlace('site')} onToggle={() => setPlaces((current) => ({ ...current, site: !current.site }))} />
          <PlaceRow shown={places.library} canAdd={!origin.library} label="הספרייה" hint="רשימת המרצים" pending={pending} onAdd={() => addPlace('library')} onToggle={() => setPlaces((current) => ({ ...current, library: !current.library }))} />
        </div> : <p className="mt-4 text-sm text-white/45">בחרי אדם שכבר מופיע. במקום חסר יהיה כפתור שמוסיף אותו עם אותם פרטים.</p>}
        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
        <button type="button" disabled={pending || !faceId} onClick={() => void persist(places, true)} className="mt-6 w-full rounded-full border border-white/20 min-h-11 text-sm cursor-pointer disabled:opacity-50">
          {pending ? 'שומר…' : 'סגירה'}
        </button>
      </div>
    </div>
  );
}
