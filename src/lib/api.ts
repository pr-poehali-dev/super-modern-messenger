const AUTH_URL = 'https://functions.poehali.dev/24aec2a5-97b1-448a-b76c-499b279330e1';
const MSG_URL = 'https://functions.poehali.dev/8c061fb5-2e49-4e40-911f-7e0de5e07ea4';

export interface User {
  id: number;
  email?: string;
  username: string | null;
  display_name: string;
  avatar_url: string | null;
  bio?: string;
}

export interface LastMessage {
  text: string;
  created_at: string;
  sender: string;
}

export interface Chat {
  id: number;
  is_group: boolean;
  title: string;
  avatar_url: string | null;
  last_message: LastMessage | null;
  peer: User | null;
}

export interface Message {
  id: number;
  text: string;
  sender_id: number;
  is_edited: boolean;
  is_removed: boolean;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string | null;
}

function getToken() {
  return localStorage.getItem('aura_token') || '';
}

export function saveAuth(token: string, user: User) {
  localStorage.setItem('aura_token', token);
  localStorage.setItem('aura_user', JSON.stringify(user));
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem('aura_user');
  return raw ? JSON.parse(raw) : null;
}

export function logout() {
  localStorage.removeItem('aura_token');
  localStorage.removeItem('aura_user');
}

async function authReq(action: string, payload: Record<string, unknown> = {}) {
  const res = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка');
  return data;
}

async function msgReq(action: string, payload: Record<string, unknown> = {}) {
  const res = await fetch(MSG_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Auth-Token': getToken() },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка');
  return data;
}

export const api = {
  requestCode: (email: string) => authReq('request_code', { email }),
  verifyCode: (email: string, code: string) => authReq('verify_code', { email, code }),
  me: () => msgReq('me'),
  updateProfile: (p: Partial<User>) => msgReq('update_profile', p),
  searchUsers: (query: string): Promise<{ users: User[] }> => msgReq('search_users', { query }),
  listChats: (): Promise<{ chats: Chat[] }> => msgReq('list_chats'),
  openDialog: (user_id: number): Promise<{ chat_id: number }> => msgReq('open_dialog', { user_id }),
  createGroup: (title: string, member_ids: number[]): Promise<{ chat_id: number }> =>
    msgReq('create_group', { title, member_ids }),
  getMessages: (chat_id: number): Promise<{ messages: Message[] }> => msgReq('get_messages', { chat_id }),
  sendMessage: (chat_id: number, text: string): Promise<{ message: Message }> =>
    msgReq('send_message', { chat_id, text }),
  editMessage: (message_id: number, text: string) => msgReq('edit_message', { message_id, text }),
  deleteMessage: (message_id: number) => msgReq('delete_message', { message_id }),
};
