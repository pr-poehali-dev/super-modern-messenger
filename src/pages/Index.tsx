import { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import AuthScreen from '@/components/messenger/AuthScreen';
import Sidebar from '@/components/messenger/Sidebar';
import Conversation from '@/components/messenger/Conversation';
import ProfileModal from '@/components/messenger/ProfileModal';
import { api, Chat, User, getStoredUser, logout as doLogout } from '@/lib/api';

const Index = () => {
  const [me, setMe] = useState<User | null>(getStoredUser());
  const [chats, setChats] = useState<Chat[]>([]);
  const [active, setActive] = useState<Chat | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  const loadChats = useCallback(async () => {
    try {
      const { chats } = await api.listChats();
      setChats(chats);
      setActive((prev) => (prev ? chats.find((c) => c.id === prev.id) || prev : prev));
    } catch {
      doLogout();
      setMe(null);
    }
  }, []);

  useEffect(() => {
    if (me) loadChats();
  }, [me, loadChats]);

  useEffect(() => {
    if (!me) return;
    const t = setInterval(loadChats, 5000);
    return () => clearInterval(t);
  }, [me, loadChats]);

  const handleLogout = () => {
    doLogout();
    setMe(null);
    setActive(null);
    setShowProfile(false);
    setChats([]);
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-[#0a0a1a]">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[40rem] h-[40rem] rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 opacity-40 blur-[120px] animate-float" />
        <div className="absolute top-1/3 -right-40 w-[35rem] h-[35rem] rounded-full bg-gradient-to-br from-sky-500 to-cyan-600 opacity-30 blur-[120px] animate-float" style={{ animationDelay: '-6s' }} />
        <div className="absolute -bottom-40 left-1/3 w-[38rem] h-[38rem] rounded-full bg-gradient-to-br from-rose-500 to-pink-600 opacity-30 blur-[120px] animate-float" style={{ animationDelay: '-12s' }} />
      </div>

      {!me ? (
        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <AuthScreen onLogin={setMe} />
        </div>
      ) : (
        <div className="relative z-10 min-h-screen p-4 md:p-6 flex items-center justify-center">
          <div className="w-full max-w-6xl h-[88vh] glass rounded-[2rem] overflow-hidden shadow-2xl flex animate-fade-in">
            <div className={`${active ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-auto`}>
              <Sidebar
                me={me}
                chats={chats}
                activeChatId={active?.id ?? null}
                onSelectChat={setActive}
                onChatsChange={loadChats}
                onOpenProfile={() => setShowProfile(true)}
              />
            </div>

            {active ? (
              <Conversation chat={active} me={me} onBack={() => setActive(null)} onSent={loadChats} />
            ) : (
              <section className="hidden md:flex flex-1 flex-col items-center justify-center text-center px-8">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-sky-400 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg mb-6 animate-float">
                  <Icon name="MessagesSquare" className="text-white" size={44} />
                </div>
                <h2 className="text-2xl font-display font-extrabold text-white">Добро пожаловать в Aura</h2>
                <p className="text-white/50 mt-2 max-w-xs">Выберите чат или найдите людей через поиск, чтобы начать общение.</p>
              </section>
            )}
          </div>
        </div>
      )}

      {showProfile && me && (
        <ProfileModal me={me} onClose={() => setShowProfile(false)} onUpdated={setMe} onLogout={handleLogout} />
      )}
    </div>
  );
};

export default Index;
