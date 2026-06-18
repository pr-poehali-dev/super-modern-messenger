const GRADIENTS = [
  'from-pink-400 to-rose-500',
  'from-indigo-400 to-purple-500',
  'from-sky-400 to-blue-500',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-teal-500',
  'from-violet-400 to-fuchsia-500',
];

export function gradientFor(seed: number | string) {
  const n = typeof seed === 'number' ? seed : seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return GRADIENTS[Math.abs(n) % GRADIENTS.length];
}

export function initials(name: string) {
  const parts = (name || '?').trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name || '?').slice(0, 2).toUpperCase();
}

interface AvatarProps {
  name: string;
  seed: number | string;
  url?: string | null;
  size?: number;
  isGroup?: boolean;
  className?: string;
}

const Avatar = ({ name, seed, url, size = 48, isGroup, className = '' }: AvatarProps) => {
  if (url) {
    return <img src={url} alt={name} style={{ width: size, height: size }} className={`rounded-full object-cover ${className}`} />;
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      className={`rounded-full bg-gradient-to-br ${gradientFor(seed)} flex items-center justify-center text-white font-display font-bold ${className}`}
    >
      {isGroup ? '👥' : initials(name)}
    </div>
  );
};

export default Avatar;
