import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { api, saveAuth, User } from '@/lib/api';

const AuthScreen = ({ onLogin }: { onLogin: (u: User) => void }) => {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const requestCode = async () => {
    setError('');
    if (!email.includes('@')) {
      setError('Введите корректный email');
      return;
    }
    setLoading(true);
    try {
      await api.requestCode(email.trim().toLowerCase());
      setStep('code');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    setError('');
    setLoading(true);
    try {
      const { token, user } = await api.verifyCode(email.trim().toLowerCase(), code.trim());
      saveAuth(token, user);
      onLogin(user);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-scale-in">
      <div className="glass-strong rounded-[2.5rem] p-10 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-sky-400 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg mb-5 animate-float">
            <Icon name="Send" className="text-white" size={36} />
          </div>
          <h1 className="text-3xl font-display font-extrabold text-white tracking-tight">Aura</h1>
          <p className="text-white/60 mt-2 text-center">
            {step === 'email' ? 'Введите email для входа' : `Код отправлен на ${email}`}
          </p>
        </div>

        {step === 'email' ? (
          <div className="space-y-4">
            <div className="glass-soft rounded-2xl px-5 py-4 flex items-center gap-3">
              <Icon name="Mail" className="text-white/50" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && requestCode()}
                className="bg-transparent outline-none text-white placeholder:text-white/40 w-full text-lg"
                placeholder="you@example.com"
              />
            </div>
            {error && <p className="text-rose-300 text-sm px-2">{error}</p>}
            <button
              onClick={requestCode}
              disabled={loading}
              className="w-full rounded-2xl bg-white text-black font-display font-bold py-4 text-lg transition-all hover:scale-[1.02] active:scale-95 shadow-lg disabled:opacity-60"
            >
              {loading ? 'Отправляем...' : 'Получить код'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="glass-soft rounded-2xl px-5 py-4 flex items-center gap-3">
              <Icon name="KeyRound" className="text-white/50" size={20} />
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={(e) => e.key === 'Enter' && verify()}
                className="bg-transparent outline-none text-white placeholder:text-white/40 w-full text-2xl tracking-[0.5em] font-display font-bold"
                placeholder="000000"
                autoFocus
              />
            </div>
            {error && <p className="text-rose-300 text-sm px-2">{error}</p>}
            <button
              onClick={verify}
              disabled={loading}
              className="w-full rounded-2xl bg-white text-black font-display font-bold py-4 text-lg transition-all hover:scale-[1.02] active:scale-95 shadow-lg disabled:opacity-60"
            >
              {loading ? 'Проверяем...' : 'Войти'}
            </button>
            <button onClick={() => { setStep('email'); setError(''); }} className="w-full text-white/50 text-sm py-2 hover:text-white/80 transition-colors">
              Изменить email
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthScreen;
