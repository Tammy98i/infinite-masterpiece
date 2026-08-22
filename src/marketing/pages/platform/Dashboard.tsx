import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlaySquare, CheckSquare, Users, LineChart, ChevronLeft, Calendar, Shield, BookOpen, Crown, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

type Role = 'FREE' | 'STUDENT' | 'PREMIUM_88' | 'LECTURER' | 'ADMIN';

export function Dashboard() {
  const [role, setRole] = useState<Role>('STUDENT');
  
  const user = { fullName: 'ישראל ישראלי', progressScore: 68 };

  const renderRoleSwitcher = () => (
    <div className="mb-12 flex flex-wrap gap-2 p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl items-center">
      <span className="text-[11px] uppercase tracking-widest text-white/40 ml-4">תצוגת הדגמה (בחר תפקיד):</span>
      {(['FREE', 'STUDENT', 'PREMIUM_88', 'LECTURER', 'ADMIN'] as Role[]).map(r => (
        <button
          key={r}
          onClick={() => setRole(r)}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${role === r ? 'bg-[#C8A24C] text-black' : 'bg-white/[0.05] text-white/60 hover:bg-white/[0.1] hover:text-white'}`}
        >
          {r === 'FREE' && 'חינמי'}
          {r === 'STUDENT' && 'משלם (רגיל)'}
          {r === 'PREMIUM_88' && 'נבחרת 88'}
          {r === 'LECTURER' && 'מדריך / קפטן'}
          {r === 'ADMIN' && 'אדמין'}
        </button>
      ))}
    </div>
  );

  const renderStudentDashboard = (isPremium: boolean) => (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-light text-white tracking-tight">
              שלום, {user.fullName}
            </h1>
            {isPremium && (
              <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold flex items-center gap-1">
                <Crown className="w-3 h-3" /> 88
              </span>
            )}
          </div>
          <p className="text-white/50 font-light">
            יום 14 מתוך 33 • שלב 2: שיווק ומיצוב
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white/[0.03] border border-white/[0.05] rounded-2xl p-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C8A24C] to-[#010308] p-0.5">
            <div className="w-full h-full rounded-full bg-[#010308] flex items-center justify-center">
              <span className="text-[#C8A24C] font-bold text-lg">{user.progressScore}</span>
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-widest text-white/40">ציון ביצועים</div>
            <div className="text-white font-medium">קצב התקדמות מצוין</div>
          </div>
        </div>
      </div>

      {/* Daily Mission - Hero Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-r from-purple-900/20 to-transparent border border-purple-500/20 rounded-[32px] p-8 md:p-12 mb-12 overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full" />
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 justify-between items-start md:items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              משימת היום
            </div>
            <h2 className="text-3xl text-white font-light mb-4">בניית נכס התוכן הראשון שלך</h2>
            <p className="text-white/60 font-light leading-relaxed mb-8">
              היום אנחנו לוקחים את ההצעה שבנינו והופכים אותה לפיסת תוכן שמושכת את הלקוחות המדויקים. 
              צפה בשיעור, הורד את תבנית הפוסטים והגש למנטור.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/lessons/day-14" className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-white/90 transition-colors">
                <PlaySquare className="w-5 h-5" />
                צפייה בשיעור
              </Link>
              <Link to="/assignments/day-14" className="inline-flex items-center gap-2 bg-white/[0.05] border border-white/[0.1] text-white px-6 py-3 rounded-full font-medium hover:bg-white/[0.1] transition-colors">
                <CheckSquare className="w-5 h-5" />
                הגשת משימה
              </Link>
            </div>
          </div>
          
          <div className="w-full md:w-auto flex flex-col gap-4">
            <div className="bg-[#010308]/50 backdrop-blur-md rounded-2xl p-6 border border-white/[0.05]">
              <div className="text-[11px] uppercase tracking-widest text-white/40 mb-4">הפוד שלך. Pod Alpha</div>
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2 -space-x-reverse">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border border-[#010308] bg-slate-800" />
                  ))}
                </div>
                <Link to="/pod" className="text-xs text-[#C8A24C] hover:text-[#F7E7B5]">לפגישת הפוד הבאה &larr;</Link>
              </div>
            </div>
            {isPremium && (
              <div className="bg-purple-900/10 backdrop-blur-md rounded-2xl p-6 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-medium text-purple-300">הטבת 88</span>
                </div>
                <p className="text-[11px] text-white/60 mb-3">Hot Seat אישי השבוע עם המייסד.</p>
                <button className="text-[11px] bg-purple-500/20 text-purple-300 px-4 py-2 rounded-lg w-full hover:bg-purple-500/30 transition-colors">שריין שעה</button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {[
          { label: "שיעורים שהושלמו", value: "14/33", icon: PlaySquare },
          { label: "משימות שהוגשו", value: "12", icon: CheckSquare },
          { label: "פניות ללקוחות", value: "45", icon: Users },
          { label: "שיחות מכירה", value: "8", icon: LineChart },
        ].map((stat, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 flex flex-col items-center text-center">
            <stat.icon className="w-6 h-6 text-white/30 mb-4" strokeWidth={1.5} />
            <div className="text-3xl font-light text-white mb-1">{stat.value}</div>
            <div className="text-xs text-white/40 uppercase tracking-wide">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Next Up */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-light text-white">המשך הלמידה</h3>
          <Link to="/library" className="text-sm text-white/40 hover:text-white flex items-center gap-1">
            לספרייה המלאה <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { day: "יום 15", title: "אוטומציה בסיסית ו-CRM", duration: "45 דק'", type: "שיעור" },
            { day: "יום 16", title: "מבוא למשא ומתן", duration: "60 דק'", type: "שיעור" },
            { day: "Live", title: "Hot Seat. разбор cases", duration: "היום ב-20:00", type: "זום" }
          ].map((item, i) => (
            <div key={i} className="bg-white/[0.01] border border-white/[0.03] rounded-2xl p-6 hover:border-white/[0.1] transition-colors cursor-pointer group">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[11px] uppercase tracking-widest text-[#C8A24C]">{item.day}</span>
                {item.type === 'זום' ? <Calendar className="w-5 h-5 text-white/30" /> : <PlaySquare className="w-5 h-5 text-white/30" />}
              </div>
              <h4 className="text-lg text-white font-medium mb-2 group-hover:text-[#C8A24C] transition-colors">{item.title}</h4>
              <p className="text-sm text-white/40">{item.duration}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const renderFreeDashboard = () => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-24 h-24 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-8">
        <Lock className="w-10 h-10 text-[#C8A24C]/50" strokeWidth={1} />
      </div>
      <h2 className="text-3xl font-light text-white mb-4">הגעת לאזור האישי</h2>
      <p className="text-white/50 max-w-lg mb-10 leading-relaxed font-light">
        החשבון שלך הוא במעמד ״חינמי/הססן״. כדי לקבל גישה מלאה למסע 33 הימים, לספריית ה-VOD, לקהילה ולקפטנים, יש לשדרג למסלול המלא.
      </p>
      <Link to="/#pricing" className="px-10 py-4 rounded-full bg-gradient-to-r from-[#C8A24C] via-[#F7E7B5] to-[#D4AF37] text-black font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_30px_rgba(200,162,76,0.2)]">
        שדרוג למסלול המלא
      </Link>
      
      <div className="mt-20 w-full max-w-3xl text-right">
        <h3 className="text-xl font-light text-white mb-6">תכנים פתוחים עבורך:</h3>
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 flex justify-between items-center group cursor-pointer hover:border-[#C8A24C]/30 transition-colors">
          <div className="flex items-center gap-4">
            <PlaySquare className="w-8 h-8 text-[#C8A24C]" strokeWidth={1} />
            <div>
              <div className="text-white font-medium text-lg">שיחת הבהירות שלך (הקלטה)</div>
              <div className="text-white/40 text-sm">סיכום וידאו מהשיחה עם הצוות שלנו</div>
            </div>
          </div>
          <button className="text-[#C8A24C] text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">צפייה</button>
        </div>
      </div>
    </div>
  );

  const renderLecturerDashboard = () => (
    <>
      <div className="flex flex-col md:flex-row justify-between gap-6 mb-12 border-b border-white/[0.05] pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-light text-white tracking-tight">אזור קפטן / מדריך</h1>
            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold">סגל</span>
          </div>
          <p className="text-white/50 font-light">Pod Alpha. 12 תלמידים פעילים</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-white/50 uppercase tracking-widest">משימות לבדיקה</div>
            <CheckSquare className="w-5 h-5 text-[#C8A24C]" />
          </div>
          <div className="text-4xl font-light text-white mb-2">18</div>
          <div className="text-xs text-[#C8A24C]">דורש התייחסות דחופה</div>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-white/50 uppercase tracking-widest">תלמידים מתקשים</div>
            <Users className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-4xl font-light text-white mb-2">2</div>
          <div className="text-xs text-red-400">ציון ביצועים נמוך מ-50</div>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-white/50 uppercase tracking-widest">ממוצע הפוד</div>
            <LineChart className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-4xl font-light text-white mb-2">84%</div>
          <div className="text-xs text-green-400">+5% משבוע שעבר</div>
        </div>
      </div>
      
      <h3 className="text-xl font-light text-white mb-6">משימות אחרונות לבדיקה</h3>
      <div className="bg-white/[0.01] border border-white/[0.05] rounded-3xl overflow-hidden">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex flex-col md:flex-row items-center justify-between p-6 border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white/50 font-medium">ת.{i}</div>
              <div>
                <div className="text-white font-medium">תלמיד מס׳ {i}</div>
                <div className="text-white/40 text-sm">הגיש: משימת מכירות. יום 14</div>
              </div>
            </div>
            <button className="bg-white/[0.05] text-white border border-white/[0.1] px-6 py-2 rounded-xl text-sm hover:bg-[#C8A24C] hover:text-black hover:border-[#C8A24C] transition-colors">
              בדיקה ומתן פידבק
            </button>
          </div>
        ))}
      </div>
    </>
  );

  const renderAdminDashboard = () => (
    <>
      <div className="flex flex-col md:flex-row justify-between gap-6 mb-12 border-b border-white/[0.05] pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-light text-white tracking-tight">מבט על. מנהל מערכת</h1>
            <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold flex items-center gap-1">
              <Shield className="w-3 h-3" /> Root
            </span>
          </div>
          <p className="text-white/50 font-light">סקירה כללית של פלטפורמת Infinite Masterpiece</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        {[
          { label: "סה״כ משתמשים", value: "342", color: "text-white" },
          { label: "מנויי 88 פרימיום", value: "88/88", color: "text-[#C8A24C]" },
          { label: "הכנסות חודשיות", value: "₪450K", color: "text-green-400" },
          { label: "הססנים פעילים", value: "45", color: "text-purple-400" }
        ].map((stat, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 text-center">
            <div className={`text-3xl font-light mb-2 ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-white/50 uppercase tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-8">
          <h3 className="text-lg text-white font-medium mb-6">ביצועי קפטנים</h3>
          <div className="space-y-4">
            {['Pod Alpha. קפטן אורי', 'Pod Beta. קפטן שירה'].map((pod, i) => (
              <div key={i} className="flex justify-between items-center p-4 rounded-xl bg-white/[0.02]">
                <span className="text-white/70">{pod}</span>
                <span className="text-[#C8A24C]">98% שביעות רצון</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-8">
          <h3 className="text-lg text-white font-medium mb-6">פעולות מערכת</h3>
          <div className="space-y-3 flex flex-col items-start">
            <button className="text-white/70 hover:text-white flex items-center gap-2 text-sm p-2"><BookOpen className="w-4 h-4" /> ניהול ספריית VOD</button>
            <button className="text-white/70 hover:text-white flex items-center gap-2 text-sm p-2"><Users className="w-4 h-4" /> ניהול משתמשים והרשאות</button>
            <button className="text-white/70 hover:text-white flex items-center gap-2 text-sm p-2"><LineChart className="w-4 h-4" /> דוחות ופיננסים</button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen">
      {renderRoleSwitcher()}
      
      <AnimatePresence mode="wait">
        <motion.div
          key={role}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {role === 'STUDENT' && renderStudentDashboard(false)}
          {role === 'PREMIUM_88' && renderStudentDashboard(true)}
          {role === 'FREE' && renderFreeDashboard()}
          {role === 'LECTURER' && renderLecturerDashboard()}
          {role === 'ADMIN' && renderAdminDashboard()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
