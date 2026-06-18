import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';

interface Chat {
  id: number;
  name: string;
  avatar: string;
  gradient: string;
  last: string;
  time: string;
  unread: number;
  online: boolean;
}

interface Message {
  id: number;
  text: string;
  me: boolean;
  time: string;
}

const CHATS: Chat[] = [
  { id: 1, name: 'Алиса Карпова', avatar: 'АК', gradient: 'from-pink-400 to-rose-500', last: 'Звучит отлично! Давай созвонимся вечером 🌙', time: '14:32', unread: 2, online: true },
  { id: 2, name: 'Космо команда', avatar: '🚀', gradient: 'from-indigo-400 to-purple-500', last: 'Дмитрий: запуск назначен на пятницу', time: '13:01', unread: 5, online: true },
  { id: 3, name: 'Максим Орлов', avatar: 'МО', gradient: 'from-sky-400 to-blue-500', last: 'Отправил файлы, проверь когда сможешь', time: '11:48', unread: 0, online: false },
  { id: 4, name: 'Дизайн чат', avatar: '🎨', gradient: 'from-amber-400 to-orange-500', last: 'Ты: обновил макеты в фигме', time: 'Вчера', unread: 0, online: false },
  { id: 5, name: 'Елена Смирнова', avatar: 'ЕС', gradient: 'from-emerald-400 to-teal-500', last: 'Спасибо большое! 💚', time: 'Вчера', unread: 0, online: true },
  { id: 6, name: 'Семья ❤️', avatar: '🏡', gradient: 'from-violet-400 to-fuchsia-500', last: 'Мама: не забудь позвонить бабушке', time: 'Пн', unread: 0, online: false },
];

const MESSAGES: Message[] = [
  { id: 1, text: 'Привет! Как продвигается проект мессенджера? 👀', me: false, time: '14:20' },
  { id: 2, text: 'Привет! Только что закончил дизайн — стекло, прозрачность, всё в стиле iOS', me: true, time: '14:22' },
  { id: 3, text: 'Вау, звучит круто! Покажешь?', me: false, time: '14:23' },
  { id: 4, text: 'Конечно, сейчас скину превью. Получилось очень воздушно ✨', me: true, time: '14:25' },
  { id: 5, text: 'Звучит отлично! Давай созвонимся вечером 🌙', me: false, time: '14:32' },
];

const AuthScreen = ({ onLogin }: { onLogin: () => void }) => {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  return (
    <div className="w-full max-w-md animate-scale-in">
      <div className="glass-strong rounded-[2.5rem] p-10 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-sky-400 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg mb-5 animate-float">
            <Icon name="Send" className="text-white" size={36} />
          </div>
          <h1 className="text-3xl font-display font-extrabold text-white tracking-tight">Aura</h1>
          <p className="text-white/60 mt-2 text-center">
            {step === 'phone' ? 'Введите номер телефона для входа' : 'Мы отправили код подтверждения'}
          </p>
        </div>

        {step === 'phone' ? (
          <div className="space-y-4">
            <div className="glass-soft rounded-2xl px-5 py-4 flex items-center gap-3">
              <Icon name="Phone" className="text-white/50" size={20} />
              <input
                className="bg-transparent outline-none text-white placeholder:text-white/40 w-full text-lg"
                placeholder="+7 999 123 45 67"
                defaultValue="+7 999 123 45 67"
              />
            </div>
            <button
              onClick={() => setStep('code')}
              className="w-full rounded-2xl bg-white text-black font-display font-bold py-4 text-lg transition-all hover:scale-[1.02] active:scale-95 shadow-lg"
            >
              Получить код
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="glass-soft rounded-2xl flex-1 aspect-square flex items-center justify-center text-2xl font-display font-bold text-white">
                  {['7', '4', '2', '9'][i]}
                </div>
              ))}
            </div>
            <button
              onClick={onLogin}
              className="w-full rounded-2xl bg-white text-black font-display font-bold py-4 text-lg transition-all hover:scale-[1.02] active:scale-95 shadow-lg"
            >
              Войти
            </button>
            <button onClick={() => setStep('phone')} className="w-full text-white/50 text-sm py-2 hover:text-white/80 transition-colors">
              Изменить номер
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Index = () => {
  const [authed, setAuthed] = useState(false);
  const [active, setActive] = useState<Chat>(CHATS[0]);
  const [messages, setMessages] = useState<Message[]>(MESSAGES);
  const [input, setInput] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    setMessages((m) => [...m, { id: Date.now(), text: input, me: true, time: 'сейчас' }]);
    setInput('');
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-[#0a0a1a]">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[40rem] h-[40rem] rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 opacity-40 blur-[120px] animate-float" />
        <div className="absolute top-1/3 -right-40 w-[35rem] h-[35rem] rounded-full bg-gradient-to-br from-sky-500 to-cyan-600 opacity-30 blur-[120px] animate-float" style={{ animationDelay: '-6s' }} />
        <div className="absolute -bottom-40 left-1/3 w-[38rem] h-[38rem] rounded-full bg-gradient-to-br from-rose-500 to-pink-600 opacity-30 blur-[120px] animate-float" style={{ animationDelay: '-12s' }} />
      </div>

      {!authed ? (
        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <AuthScreen onLogin={() => setAuthed(true)} />
        </div>
      ) : (
        <div className="relative z-10 min-h-screen p-4 md:p-6 flex items-center justify-center">
          <div className="w-full max-w-6xl h-[88vh] glass rounded-[2rem] overflow-hidden shadow-2xl flex animate-fade-in">
            <aside className="w-full md:w-[360px] flex-shrink-0 border-r border-white/10 flex flex-col">
              <div className="p-5 flex items-center justify-between">
                <h2 className="text-2xl font-display font-extrabold text-white tracking-tight">Чаты</h2>
                <div className="flex gap-2">
                  <button className="w-10 h-10 rounded-full glass-soft flex items-center justify-center text-white/70 hover:text-white transition-colors">
                    <Icon name="Search" size={18} />
                  </button>
                  <button className="w-10 h-10 rounded-full glass-soft flex items-center justify-center text-white/70 hover:text-white transition-colors">
                    <Icon name="SquarePen" size={18} />
                  </button>
                </div>
              </div>

              <div className="px-5 pb-3">
                <div className="glass-soft rounded-2xl px-4 py-3 flex items-center gap-3">
                  <Icon name="Search" className="text-white/40" size={18} />
                  <input className="bg-transparent outline-none text-white placeholder:text-white/40 w-full text-sm" placeholder="Поиск" />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-hide px-3 pb-3 space-y-1">
                {CHATS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActive(c)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${active.id === c.id ? 'glass-strong' : 'hover:bg-white/5'}`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${c.gradient} flex items-center justify-center text-white font-display font-bold text-lg`}>
                        {c.avatar}
                      </div>
                      {c.online && <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#1a1a2e]" />}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <span className="font-display font-semibold text-white truncate">{c.name}</span>
                        <span className="text-xs text-white/40 flex-shrink-0 ml-2">{c.time}</span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-sm text-white/50 truncate">{c.last}</span>
                        {c.unread > 0 && (
                          <span className="ml-2 flex-shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-white text-xs font-bold flex items-center justify-center">
                            {c.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-3 border-t border-white/10">
                <button onClick={() => setShowProfile(true)} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-all">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center text-white font-display font-bold">Я</div>
                  <div className="text-left flex-1">
                    <div className="font-display font-semibold text-white">Мой профиль</div>
                    <div className="text-xs text-white/40">@cosmonaut</div>
                  </div>
                  <Icon name="Settings" className="text-white/40" size={18} />
                </button>
              </div>
            </aside>

            <section className="hidden md:flex flex-1 flex-col">
              <header className="p-4 px-6 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${active.gradient} flex items-center justify-center text-white font-display font-bold`}>
                    {active.avatar}
                  </div>
                  <div>
                    <div className="font-display font-bold text-white">{active.name}</div>
                    <div className="text-xs text-emerald-400">{active.online ? 'в сети' : 'был недавно'}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {['Phone', 'Video', 'EllipsisVertical'].map((ic) => (
                    <button key={ic} className="w-10 h-10 rounded-full glass-soft flex items-center justify-center text-white/70 hover:text-white transition-colors">
                      <Icon name={ic} size={18} />
                    </button>
                  ))}
                </div>
              </header>

              <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-3">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.me ? 'justify-end' : 'justify-start'} animate-bubble-in`}>
                    <div
                      className={`max-w-[70%] px-4 py-2.5 rounded-3xl ${
                        m.me
                          ? 'bg-gradient-to-br from-sky-500 to-indigo-600 text-white rounded-br-lg'
                          : 'glass-strong text-white rounded-bl-lg'
                      }`}
                    >
                      <p className="leading-relaxed">{m.text}</p>
                      <span className={`text-[11px] block text-right mt-1 ${m.me ? 'text-white/70' : 'text-white/40'}`}>{m.time}</span>
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>

              <div className="p-4 px-6">
                <div className="glass-strong rounded-3xl px-4 py-2.5 flex items-center gap-3">
                  <button className="text-white/50 hover:text-white transition-colors">
                    <Icon name="Paperclip" size={22} />
                  </button>
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && send()}
                    className="bg-transparent outline-none text-white placeholder:text-white/40 w-full"
                    placeholder="Сообщение..."
                  />
                  <button className="text-white/50 hover:text-white transition-colors">
                    <Icon name="Smile" size={22} />
                  </button>
                  <button
                    onClick={send}
                    className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95"
                  >
                    <Icon name="Send" size={18} />
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}

      {showProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={() => setShowProfile(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative glass-strong rounded-[2rem] p-8 w-full max-w-sm animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowProfile(false)} className="absolute top-5 right-5 text-white/50 hover:text-white">
              <Icon name="X" size={22} />
            </button>
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center text-white font-display font-extrabold text-3xl shadow-lg">Я</div>
              <h3 className="text-2xl font-display font-extrabold text-white mt-4">Космонавт</h3>
              <p className="text-white/50">@cosmonaut</p>
            </div>
            <div className="mt-7 space-y-2">
              {[
                { icon: 'User', label: 'Изменить профиль' },
                { icon: 'Bell', label: 'Уведомления' },
                { icon: 'Lock', label: 'Приватность' },
                { icon: 'Palette', label: 'Оформление' },
                { icon: 'LogOut', label: 'Выйти' },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => item.icon === 'LogOut' && setAuthed(false)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl glass-soft hover:bg-white/10 transition-all text-white"
                >
                  <Icon name={item.icon} size={20} className="text-white/70" />
                  <span className="font-display font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
