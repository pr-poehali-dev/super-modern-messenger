import json
import os
from datetime import datetime

import psycopg2
from psycopg2.extras import RealDictCursor


def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json',
    }


def ok(data):
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps(data, default=str)}


def err(msg, code=400):
    return {'statusCode': code, 'headers': cors_headers(), 'body': json.dumps({'error': msg})}


def get_user(cur, token):
    if not token:
        return None
    cur.execute(
        "SELECT u.id, u.email, u.username, u.display_name, u.avatar_url, u.bio "
        "FROM sessions s JOIN users u ON u.id = s.user_id "
        "WHERE s.token=%s AND s.expires_at > NOW()",
        (token,),
    )
    return cur.fetchone()


def handler(event: dict, context) -> dict:
    '''Мессенджер Aura: чаты, сообщения, поиск людей, групповые чаты, профиль, редактирование и удаление сообщений'''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers(), 'body': ''}

    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token')

    params = event.get('queryStringParameters') or {}
    body = json.loads(event.get('body') or '{}')
    action = body.get('action') or params.get('action')

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor(cursor_factory=RealDictCursor)

    user = get_user(cur, token)
    if not user:
        cur.close()
        conn.close()
        return err('Не авторизован', 401)

    uid = user['id']

    try:
        if action == 'me':
            return ok({'user': user})

        if action == 'update_profile':
            display_name = body.get('display_name', user['display_name'])
            username = body.get('username', user['username'])
            bio = body.get('bio', user['bio'])
            avatar_url = body.get('avatar_url', user['avatar_url'])
            cur.execute(
                "UPDATE users SET display_name=%s, username=%s, bio=%s, avatar_url=%s WHERE id=%s "
                "RETURNING id, email, username, display_name, avatar_url, bio",
                (display_name, username, bio, avatar_url, uid),
            )
            conn.commit()
            return ok({'user': cur.fetchone()})

        if action == 'search_users':
            q = (body.get('query') or params.get('query') or '').strip().lower()
            if not q:
                return ok({'users': []})
            cur.execute(
                "SELECT id, username, display_name, avatar_url FROM users "
                "WHERE id != %s AND (LOWER(display_name) LIKE %s OR LOWER(username) LIKE %s OR LOWER(email) LIKE %s) LIMIT 20",
                (uid, f'%{q}%', f'%{q}%', f'%{q}%'),
            )
            return ok({'users': cur.fetchall()})

        if action == 'list_chats':
            cur.execute(
                "SELECT c.id, c.is_group, c.title, c.avatar_url, c.created_by "
                "FROM chats c JOIN chat_members m ON m.chat_id = c.id WHERE m.user_id=%s",
                (uid,),
            )
            chats = cur.fetchall()
            result = []
            for c in chats:
                last = None
                cur.execute(
                    "SELECT m.text, m.created_at, m.is_removed, u.display_name as sender "
                    "FROM messages m JOIN users u ON u.id=m.sender_id "
                    "WHERE m.chat_id=%s ORDER BY m.id DESC LIMIT 1",
                    (c['id'],),
                )
                lm = cur.fetchone()
                if lm:
                    last = {'text': '' if lm['is_removed'] else lm['text'], 'created_at': lm['created_at'], 'sender': lm['sender']}
                title = c['title']
                avatar = c['avatar_url']
                peer = None
                if not c['is_group']:
                    cur.execute(
                        "SELECT u.id, u.display_name, u.username, u.avatar_url FROM chat_members m "
                        "JOIN users u ON u.id=m.user_id WHERE m.chat_id=%s AND m.user_id != %s LIMIT 1",
                        (c['id'], uid),
                    )
                    peer = cur.fetchone()
                    if peer:
                        title = peer['display_name']
                        avatar = peer['avatar_url']
                result.append({
                    'id': c['id'], 'is_group': c['is_group'], 'title': title,
                    'avatar_url': avatar, 'last_message': last, 'peer': peer,
                })
            result.sort(key=lambda x: (x['last_message']['created_at'] if x['last_message'] else ''), reverse=True)
            return ok({'chats': result})

        if action == 'open_dialog':
            other_id = body.get('user_id')
            cur.execute(
                "SELECT c.id FROM chats c "
                "JOIN chat_members a ON a.chat_id=c.id AND a.user_id=%s "
                "JOIN chat_members b ON b.chat_id=c.id AND b.user_id=%s "
                "WHERE c.is_group=FALSE LIMIT 1",
                (uid, other_id),
            )
            row = cur.fetchone()
            if row:
                return ok({'chat_id': row['id']})
            cur.execute("INSERT INTO chats (is_group, created_by) VALUES (FALSE, %s) RETURNING id", (uid,))
            chat_id = cur.fetchone()['id']
            cur.execute("INSERT INTO chat_members (chat_id, user_id) VALUES (%s, %s)", (chat_id, uid))
            cur.execute("INSERT INTO chat_members (chat_id, user_id) VALUES (%s, %s)", (chat_id, other_id))
            conn.commit()
            return ok({'chat_id': chat_id})

        if action == 'create_group':
            title = (body.get('title') or 'Новая группа').strip()
            member_ids = body.get('member_ids') or []
            cur.execute("INSERT INTO chats (is_group, title, created_by) VALUES (TRUE, %s, %s) RETURNING id", (title, uid))
            chat_id = cur.fetchone()['id']
            cur.execute("INSERT INTO chat_members (chat_id, user_id) VALUES (%s, %s)", (chat_id, uid))
            for mid in member_ids:
                cur.execute("INSERT INTO chat_members (chat_id, user_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", (chat_id, mid))
            conn.commit()
            return ok({'chat_id': chat_id})

        if action == 'get_messages':
            chat_id = body.get('chat_id') or params.get('chat_id')
            cur.execute("SELECT 1 FROM chat_members WHERE chat_id=%s AND user_id=%s", (chat_id, uid))
            if not cur.fetchone():
                return err('Нет доступа', 403)
            cur.execute(
                "SELECT m.id, m.text, m.sender_id, m.is_edited, m.is_removed, m.created_at, "
                "u.display_name as sender_name, u.avatar_url as sender_avatar "
                "FROM messages m JOIN users u ON u.id=m.sender_id "
                "WHERE m.chat_id=%s ORDER BY m.id ASC",
                (chat_id,),
            )
            return ok({'messages': cur.fetchall()})

        if action == 'send_message':
            chat_id = body.get('chat_id')
            text = (body.get('text') or '').strip()
            if not text:
                return err('Пустое сообщение')
            cur.execute("SELECT 1 FROM chat_members WHERE chat_id=%s AND user_id=%s", (chat_id, uid))
            if not cur.fetchone():
                return err('Нет доступа', 403)
            cur.execute(
                "INSERT INTO messages (chat_id, sender_id, text) VALUES (%s, %s, %s) "
                "RETURNING id, text, sender_id, is_edited, is_removed, created_at",
                (chat_id, uid, text),
            )
            conn.commit()
            return ok({'message': cur.fetchone()})

        if action == 'edit_message':
            msg_id = body.get('message_id')
            text = (body.get('text') or '').strip()
            cur.execute("SELECT sender_id FROM messages WHERE id=%s", (msg_id,))
            m = cur.fetchone()
            if not m or m['sender_id'] != uid:
                return err('Нельзя редактировать', 403)
            cur.execute("UPDATE messages SET text=%s, is_edited=TRUE WHERE id=%s", (text, msg_id))
            conn.commit()
            return ok({'updated': True})

        if action == 'delete_message':
            msg_id = body.get('message_id')
            cur.execute("SELECT sender_id FROM messages WHERE id=%s", (msg_id,))
            m = cur.fetchone()
            if not m or m['sender_id'] != uid:
                return err('Нельзя удалить', 403)
            cur.execute("UPDATE messages SET is_removed=TRUE, text='' WHERE id=%s", (msg_id,))
            conn.commit()
            return ok({'removed': True})

        return err('Неизвестное действие')
    finally:
        cur.close()
        conn.close()
