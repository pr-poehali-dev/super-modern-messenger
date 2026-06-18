import { useState } from 'react';
import Icon from '@/components/ui/icon';
import Avatar from './Avatar';
import { api, Chat, User } from '@/lib/api';

interface SidebarProps {
  me: User;
  chats: Chat[];
  activeChatId: number | null;
  onSelectChat: (chat: Chat) => void;
  onChatsChange: () => void;
  onOpenProfile: () => void;
}

function fmtTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso.replace(' ', 'T') + (iso.includes('Z') ? '' : 'Z'));
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('ru', { day: '2-digit', month: '2-digit' });
}

const Sidebar = ({ me, chats, activeChatId, onSelectChat, onChatsChange, onOpenProfile }: SidebarProps) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [groupMode, setGroupMode] = useState(false);
  const [groupTitle, setGroupTitle] = useState('');
  const [selected, setSelected] = useState<User[]>([]);

  const doSearch = async (q: string) => {
    setQuery(q);
    if (q.trim().length < 1) {
      setResults([]);
      return;
    }
    const { users } = await api.searchUsers(q);
    setResults(users);
  };

  const startDialog = async (u: User) => {
    const { chat_id } = await api.openDialog(u.id);
    setSearchOpen(false);
    setQuery('');
    setResults([]);
    await onChatsChange();
    onSelectChat({ id: chat_id, is_group: false, title: u.display_name, avatar_url: u.avatar_url, last_message: null, peer: u });
  };

  const toggleSelect = (u: User) => {
    setSelected((prev) => (prev.find((p) => p.id === u.id) ? prev.filter((p) => p.id !== u.id) : [...prev, u]));
  };

  const createGroup = async () => {
    if (!groupTitle.trim() || selected.length === 0) return;
    await api.createGroup(groupTitle.trim(), selected.map((u) => u.id));
    setGroupMode(false);
    setSearchOpen(false);
    setGroupTitle('');
    setSelected([]);
    setQuery('');
    setResults([]);
    await onChatsChange();
  };

  return (
    <aside className="w-full md:w-[360px] flex-shrink-0 border-r border-white/10 flex flex-col">
      <div className="p-5 flex items-center justify-between">
        <h2 className="text-2xl font-display font-extrabold text-white tracking-tight">
          {searchOpen ? (groupMode ? 'Новая группа' : 'Поиск') : 'Чаты'}
        </h2>
        <div className="flex gap-2">
          {!searchOpen ? (
            <>
              <button onClick={() => setSearchOpen(true)} className="w-10 h-10 rounded-full glass-soft flex items-center justify-center text-white/70 hover:text-white transition-colors">
                <Icon name="Search" size={18} />
              </button>
              <button onClick={() => { setSearchOpen(true); setGroupMode(true); }} className="w-10 h-10 rounded-full glass-soft flex items-center justify-center text-white/70 hover:text-white transition-colors">
                <Icon name="Users" size={18} />
              </button>
            </>
          ) : (
            <button onClick={() => { setSearchOpen(false); setGroupMode(false); setSelected([]); setQuery(''); setResults([]); }} className="w-10 h-10 rounded-full glass-soft flex items-center justify-center text-white/70 hover:text-white transition-colors">
              <Icon name="X" size={18} />
            </button>
          )}
        </div>
      </div>

      {searchOpen ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {groupMode && (
            <div className="px-5 pb-3">
              <div className="glass-soft rounded-2xl px-4 py-3 flex items-center gap-3">
                <Icon name="Type" className="text-white/40" size={18} />
                <input value={groupTitle} onChange={(e) => setGroupTitle(e.target.value)} className="bg-transparent outline-none text-white placeholder:text-white/40 w-full text-sm" placeholder="Название группы" />
              </div>
              {selected.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selected.map((u) => (
                    <span key={u.id} className="text-xs glass-soft px-3 py-1.5 rounded-full text-white flex items-center gap-1">
                      {u.display_name}
                      <button onClick={() => toggleSelect(u)}><Icon name="X" size={12} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="px-5 pb-3">
            <div className="glass-soft rounded-2xl px-4 py-3 flex items-center gap-3">
              <Icon name="Search" className="text-white/40" size={18} />
              <input autoFocus value={query} onChange={(e) => doSearch(e.target.value)} className="bg-transparent outline-none text-white placeholder:text-white/40 w-full text-sm" placeholder="Имя, @username или email" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hide px-3 pb-3 space-y-1">
            {results.map((u) => {
              const isSel = !!selected.find((p) => p.id === u.id);
              return (
                <button key={u.id} onClick={() => (groupMode ? toggleSelect(u) : startDialog(u))} className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${isSel ? 'glass-strong' : 'hover:bg-white/5'}`}>
                  <Avatar name={u.display_name} seed={u.id} url={u.avatar_url} />
                  <div className="flex-1 text-left">
                    <div className="font-display font-semibold text-white">{u.display_name}</div>
                    {u.username && <div className="text-xs text-white/40">@{u.username}</div>}
                  </div>
                  {groupMode && isSel && <Icon name="Check" className="text-sky-400" size={20} />}
                </button>
              );
            })}
            {query && results.length === 0 && <p className="text-white/40 text-sm text-center py-6">Никого не найдено</p>}
          </div>
          {groupMode && (
            <div className="p-4">
              <button onClick={createGroup} disabled={!groupTitle.trim() || selected.length === 0} className="w-full rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-600 text-white font-display font-bold py-3.5 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50">
                Создать группу
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto scrollbar-hide px-3 pb-3 space-y-1">
          {chats.length === 0 && (
            <div className="text-center text-white/40 text-sm py-10 px-6">
              Пока нет чатов. Нажми <Icon name="Search" size={14} className="inline" /> чтобы найти людей.
            </div>
          )}
          {chats.map((c) => (
            <button key={c.id} onClick={() => onSelectChat(c)} className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${activeChatId === c.id ? 'glass-strong' : 'hover:bg-white/5'}`}>
              <Avatar name={c.title} seed={c.peer?.id ?? c.id} url={c.avatar_url} isGroup={c.is_group} />
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <span className="font-display font-semibold text-white truncate">{c.title || 'Без названия'}</span>
                  <span className="text-xs text-white/40 flex-shrink-0 ml-2">{fmtTime(c.last_message?.created_at)}</span>
                </div>
                <div className="text-sm text-white/50 truncate mt-0.5">
                  {c.last_message ? (c.is_group ? `${c.last_message.sender}: ${c.last_message.text}` : c.last_message.text) : 'Нет сообщений'}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="p-3 border-t border-white/10">
        <button onClick={onOpenProfile} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-all">
          <Avatar name={me.display_name} seed={me.id} url={me.avatar_url} size={44} />
          <div className="text-left flex-1">
            <div className="font-display font-semibold text-white truncate">{me.display_name}</div>
            <div className="text-xs text-white/40">{me.username ? `@${me.username}` : me.email}</div>
          </div>
          <Icon name="Settings" className="text-white/40" size={18} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
