import { useEffect, useState } from 'react';
import { apiRequest } from '../../api/auth';

export function Privacy() {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest<{ content: string }>('/api/legal/privacy')
      .then((res) => setContent(res.content || ''))
      .catch((err) => setError(err instanceof Error ? err.message : 'טעינה נכשלה'));
  }, []);

  return (
    <div className="min-h-screen bg-transparent pt-32 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-8">מדיניות פרטיות</h1>
        {error ? <p className="text-rose-300 text-sm">{error}</p> : null}
        {!error && !content ? <p className="text-slate-500 text-sm">טוען...</p> : null}
        {content ? (
          <div className="prose prose-invert prose-slate max-w-none text-slate-400 whitespace-pre-wrap leading-relaxed">
            {content}
          </div>
        ) : null}
      </div>
    </div>
  );
}
