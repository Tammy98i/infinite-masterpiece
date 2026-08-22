import { Search, PlaySquare, FileText, Lock } from 'lucide-react';

export function Library() {
  const categories = ["הכל", "מכירות (ימים 1-8)", "שיווק (ימים 9-16)", "מודל (ימים 17-24)", "סקייל (ימים 25-33)", "הקלטות Live"];
  
  const lessons = [
    { id: 1, title: "הצעת הערך שאי אפשר לסרב לה", category: "מכירות", locked: false, progress: 100 },
    { id: 2, title: "תסריט שיחת המכירה. חלק א'", category: "מכירות", locked: false, progress: 100 },
    { id: 3, title: "טיפול בהתנגדויות אמת", category: "מכירות", locked: false, progress: 50 },
    { id: 4, title: "אסטרטגיית תוכן ממירה", category: "שיווק", locked: true, progress: 0 },
    { id: 5, title: "הקמת תשתיות אוטומציה", category: "מודל", locked: true, progress: 0 },
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-light text-white mb-2">ספריית VOD</h1>
          <p className="text-white/50 font-light">מאגר התוכן של Infinite Masterpiece</p>
        </div>
        <div className="relative w-full md:w-auto">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
          <input 
            type="text" 
            placeholder="חיפוש שיעור או נושא..." 
            className="w-full md:w-80 bg-white/[0.03] border border-white/[0.05] rounded-full py-3 pr-12 pl-4 text-white focus:outline-none focus:border-[#C8A24C]/50 transition-colors"
          />
        </div>
      </div>

      <div className="flex overflow-x-auto gap-2 mb-10 pb-2 scrollbar-hide">
        {categories.map((cat, i) => (
          <button 
            key={i}
            className={`whitespace-nowrap px-6 py-2 rounded-full text-sm transition-colors ${
              i === 0 
                ? 'bg-[#C8A24C] text-black font-medium' 
                : 'bg-white/[0.03] text-white/60 hover:bg-white/[0.08] hover:text-white border border-white/[0.05]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {lessons.map((lesson) => (
          <div key={lesson.id} className="bg-white/[0.02] border border-white/[0.05] rounded-3xl overflow-hidden group">
            <div className="aspect-video bg-[#010308] relative flex items-center justify-center border-b border-white/[0.05]">
              {lesson.locked ? (
                <Lock className="w-8 h-8 text-white/20" strokeWidth={1} />
              ) : (
                <PlaySquare className="w-10 h-10 text-white/30 group-hover:text-[#C8A24C] transition-colors group-hover:scale-110 duration-500" strokeWidth={1} />
              )}
              {/* Progress bar line at bottom of image */}
              {!lesson.locked && lesson.progress > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                  <div className="h-full bg-[#C8A24C]" style={{ width: `${lesson.progress}%` }} />
                </div>
              )}
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[11px] uppercase tracking-widest text-[#C8A24C]">{lesson.category}</span>
              </div>
              <h3 className={`text-lg font-medium mb-4 ${lesson.locked ? 'text-white/40' : 'text-white'}`}>
                {lesson.title}
              </h3>
              <div className="flex items-center gap-4 text-sm">
                <button className={`flex items-center gap-1.5 ${lesson.locked ? 'text-white/20 cursor-not-allowed' : 'text-white/50 hover:text-white'}`}>
                  <PlaySquare className="w-4 h-4" /> <span>צפייה</span>
                </button>
                <button className={`flex items-center gap-1.5 ${lesson.locked ? 'text-white/20 cursor-not-allowed' : 'text-white/50 hover:text-white'}`}>
                  <FileText className="w-4 h-4" /> <span>סיכום שיעור</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
