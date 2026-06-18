import { useState } from 'react';
import Icon from '@/components/ui/icon';
import Avatar from './Avatar';
import { api, User } from '@/lib/api';

interface ProfileModalProps {
  me: User;
  onClose: () => void;
  onUpdated: (u: User) => void;
  onLogout: () => void;
}

const ProfileModal = ({ me, onClose, onUpdated, onLogout }: ProfileModalProps) => {
  const [edit, setEdit] = useState(false);
  const [displayName, setDisplayName] = useState(me.display_name);
  const [username, setUsername] = useState(me.username || '');
  const [bio, setBio] = useState(me.bio || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const { user } = await api.updateProfile({ display_name: displayName, username, bio });
      onUpdated(user);
      setEdit(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative glass-strong rounded-[2rem] p-8 w-full max-w-sm animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-5 right-5 text-white/50 hover:text-white">
          <Icon name="X" size={22} />
        </button>
        <div className="flex flex-col items-center">
          <Avatar name={me.display_name} seed={me.id} url={me.avatar_url} size={96} />
          {!edit ? (
            <>
              <h3 className="text-2xl font-display font-extrabold text-white mt-4">{me.display_name}</h3>
              <p className="text-white/50">{me.username ? `@${me.username}` : me.email}</p>
              {me.bio && <p className="text-white/60 text-center mt-3 text-sm">{me.bio}</p>}
            </>
          ) : (
            <div className="w-full mt-4 space-y-3">
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full glass-soft rounded-xl px-4 py-3 bg-transparent outline-none text-white placeholder:text-white/40" placeholder="Имя" />
              <input value={username} onChange={(e) => setUsername(e.target.value.replace(/[^a-z0-9_]/gi, ''))} className="w-full glass-soft rounded-xl px-4 py-3 bg-transparent outline-none text-white placeholder:text-white/40" placeholder="username" />
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} className="w-full glass-soft rounded-xl px-4 py-3 bg-transparent outline-none text-white placeholder:text-white/40 resize-none" placeholder="О себе" />
            </div>
          )}
        </div>

        <div className="mt-7 space-y-2">
          {!edit ? (
            <>
              <button onClick={() => setEdit(true)} className="w-full flex items-center gap-3 p-3.5 rounded-2xl glass-soft hover:bg-white/10 transition-all text-white">
                <Icon name="User" size={20} className="text-white/70" />
                <span className="font-display font-medium">Изменить профиль</span>
              </button>
              <button onClick={onLogout} className="w-full flex items-center gap-3 p-3.5 rounded-2xl glass-soft hover:bg-white/10 transition-all text-rose-300">
                <Icon name="LogOut" size={20} />
                <span className="font-display font-medium">Выйти</span>
              </button>
            </>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setEdit(false)} className="flex-1 rounded-2xl glass-soft py-3.5 text-white font-display font-medium">Отмена</button>
              <button onClick={save} disabled={saving} className="flex-1 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-600 py-3.5 text-white font-display font-bold disabled:opacity-50">
                {saving ? '...' : 'Сохранить'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
