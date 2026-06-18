import { useState, useRef, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import Avatar from './Avatar';
import { api, Chat, Message, User } from '@/lib/api';

interface ConversationProps {
  chat: Chat;
  me: User;
  onBack: () => void;
  onSent: () => void;
}

function fmtTime(iso: string) {
  const d = new Date(iso.replace(' ', 'T') + (iso.includes('Z') ? '' : 'Z'));
  return d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
}

const Conversation = ({ chat, me, onBack, onSent }: ConversationProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [editing, setEditing] = useState<Message | null>(null);
  const [menuFor, setMenuFor] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const { messages } = await api.getMessages(chat.id);
    setMessages(messages);
  }, [chat.id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    if (editing) {
      await api.editMessage(editing.id, input.trim());
      setEditing(null);
    } else {
      await api.sendMessage(chat.id, input.trim());
    }
    setInput('');
    await load();
    onSent();
  };

  const remove = async (id: number) => {
    await api.deleteMessage(id);
    setMenuFor(null);
    await load();
    onSent();
  };

  const startEdit = (m: Message) => {
    setEditing(m);
    setInput(m.text);
    setMenuFor(null);
  };

  return (
    <section className="flex flex-1 flex-col">
      <header className="p-4 px-5 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="md:hidden text-white/70 mr-1">
            <Icon name="ChevronLeft" size={24} />
          </button>
          <Avatar name={chat.title} seed={chat.peer?.id ?? chat.id} url={chat.avatar_url} size={44} isGroup={chat.is_group} />
          <div>
            <div className="font-display font-bold text-white">{chat.title || 'Без названия'}</div>
            <div className="text-xs text-white/40">{chat.is_group ? 'Группа' : chat.peer?.username ? `@${chat.peer.username}` : 'Личный чат'}</div>
          </div>
        </div>
        <div className="flex gap-2">
          {['Phone', 'Video'].map((ic) => (
            <button key={ic} className="w-10 h-10 rounded-full glass-soft flex items-center justify-center text-white/70 hover:text-white transition-colors">
              <Icon name={ic} size={18} />
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-hide p-5 space-y-2.5" onClick={() => setMenuFor(null)}>
        {messages.length === 0 && <p className="text-white/40 text-center py-10">Напишите первое сообщение ✨</p>}
        {messages.map((m) => {
          const mine = m.sender_id === me.id;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} animate-bubble-in`}>
              <div className="relative group max-w-[75%]">
                {chat.is_group && !mine && !m.is_removed && (
                  <div className="text-xs text-sky-300 font-semibold mb-0.5 ml-3">{m.sender_name}</div>
                )}
                <div
                  onClick={(e) => { e.stopPropagation(); if (mine && !m.is_removed) setMenuFor(menuFor === m.id ? null : m.id); }}
                  className={`px-4 py-2.5 rounded-3xl ${mine ? 'bg-gradient-to-br from-sky-500 to-indigo-600 text-white rounded-br-lg cursor-pointer' : 'glass-strong text-white rounded-bl-lg'}`}
                >
                  {m.is_removed ? (
                    <p className="italic text-white/50">Сообщение удалено</p>
                  ) : (
                    <p className="leading-relaxed whitespace-pre-wrap break-words">{m.text}</p>
                  )}
                  <span className={`text-[11px] block text-right mt-1 ${mine ? 'text-white/70' : 'text-white/40'}`}>
                    {m.is_edited && !m.is_removed && 'изм. '}{fmtTime(m.created_at)}
                  </span>
                </div>
                {menuFor === m.id && (
                  <div className="absolute right-0 top-full mt-1 glass-strong rounded-2xl p-1.5 z-20 flex gap-1 animate-scale-in">
                    <button onClick={(e) => { e.stopPropagation(); startEdit(m); }} className="px-3 py-2 rounded-xl hover:bg-white/10 text-white text-sm flex items-center gap-2">
                      <Icon name="Pencil" size={15} /> Изменить
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); remove(m.id); }} className="px-3 py-2 rounded-xl hover:bg-white/10 text-rose-300 text-sm flex items-center gap-2">
                      <Icon name="Trash2" size={15} /> Удалить
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="p-4 px-5">
        {editing && (
          <div className="glass-soft rounded-2xl px-4 py-2 mb-2 flex items-center justify-between">
            <span className="text-white/70 text-sm flex items-center gap-2"><Icon name="Pencil" size={14} /> Редактирование</span>
            <button onClick={() => { setEditing(null); setInput(''); }} className="text-white/50"><Icon name="X" size={16} /></button>
          </div>
        )}
        <div className="glass-strong rounded-3xl px-4 py-2.5 flex items-center gap-3">
          <button className="text-white/50 hover:text-white transition-colors"><Icon name="Paperclip" size={22} /></button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            className="bg-transparent outline-none text-white placeholder:text-white/40 w-full"
            placeholder="Сообщение..."
          />
          <button onClick={send} className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95">
            <Icon name="Send" size={18} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default Conversation;
