import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Infinity, ArrowLeft, Lock } from 'lucide-react';
import { motion } from 'motion/react';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    // Dummy login
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#010308]">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518066000714-58c45f1a2c0a?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-[0.03] mix-blend-screen" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#010308] via-transparent to-[#010308]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-md w-full space-y-8 relative z-10 bg-white/[0.02] border border-white/[0.05] p-10 rounded-[32px] backdrop-blur-2xl shadow-2xl"
      >
        <div className="text-center">
          <Infinity className="mx-auto h-12 w-12 text-[#C8A24C]" strokeWidth={1} />
          <h2 className="mt-6 text-3xl font-light text-white tracking-tight">כניסה למערכת</h2>
          <p className="mt-2 text-sm text-white/50 font-light">
            האזור האישי לתלמידי <span className="font-heading text-gold-gradient">Infinite Masterpiece</span>
          </p>
        </div>
        
        <form className="mt-10 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label className="sr-only">אימייל</label>
              <input
                type="email"
                required
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-5 py-4 border border-white/[0.08] bg-black/40 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-[#C8A24C] focus:border-[#C8A24C] focus:z-10 text-right transition-colors"
                placeholder="כתובת אימייל"
              />
            </div>
            <div>
              <label className="sr-only">סיסמה</label>
              <input
                type="password"
                required
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-5 py-4 border border-white/[0.08] bg-black/40 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-[#C8A24C] focus:border-[#C8A24C] focus:z-10 text-right transition-colors"
                placeholder="סיסמה"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <Link to="/reset-password" className="text-[#C8A24C] hover:text-[#F7E7B5] transition-colors">
              שכחת סיסמה?
            </Link>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent rounded-[16px] text-black bg-gradient-to-r from-[#C8A24C] via-[#F7E7B5] to-[#D4AF37] hover:shadow-[0_0_30px_rgba(200,162,76,0.3)] transition-all duration-300 font-bold"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-4">
                <Lock className="h-5 w-5 text-black/50 group-hover:text-black/80 transition-colors" />
              </span>
              התחברות
            </button>
          </div>
        </form>

        <div className="mt-8 text-center text-sm text-white/30 border-t border-white/[0.05] pt-6">
          <Link to="/" className="inline-flex items-center gap-2 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> חזרה לאתר הראשי
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
