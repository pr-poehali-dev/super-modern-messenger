import json
import os
import random
import secrets
import urllib.request
from datetime import datetime, timedelta

import psycopg2


def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json',
    }


def send_email(to_email: str, code: str) -> None:
    api_key = os.environ.get('RESEND_API_KEY')
    if not api_key:
        return
    payload = json.dumps({
        'from': 'Aura <onboarding@resend.dev>',
        'to': [to_email],
        'subject': f'Код входа в Aura: {code}',
        'html': f'<div style="font-family:sans-serif;padding:24px"><h2>Aura</h2><p>Ваш код для входа:</p><p style="font-size:32px;font-weight:bold;letter-spacing:8px">{code}</p><p style="color:#888">Код действует 10 минут.</p></div>',
    }).encode()
    req = urllib.request.Request(
        'https://api.resend.com/emails',
        data=payload,
        headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
        method='POST',
    )
    try:
        urllib.request.urlopen(req, timeout=10)
    except Exception:
        pass


def handler(event: dict, context) -> dict:
    '''Авторизация по email-коду: отправка кода и проверка кода для входа в мессенджер Aura'''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers(), 'body': ''}

    body = json.loads(event.get('body') or '{}')
    action = body.get('action')
    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()

    if action == 'request_code':
        email = (body.get('email') or '').strip().lower()
        if not email or '@' not in email:
            cur.close()
            conn.close()
            return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Неверный email'})}
        code = f'{random.randint(0, 999999):06d}'
        expires = datetime.utcnow() + timedelta(minutes=10)
        cur.execute(
            "INSERT INTO auth_codes (email, code, expires_at) VALUES (%s, %s, %s)",
            (email, code, expires),
        )
        conn.commit()
        send_email(email, code)
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'sent': True})}

    if action == 'verify_code':
        email = (body.get('email') or '').strip().lower()
        code = (body.get('code') or '').strip()
        cur.execute(
            "SELECT id FROM auth_codes WHERE email=%s AND code=%s AND is_used=FALSE AND expires_at > NOW() ORDER BY id DESC LIMIT 1",
            (email, code),
        )
        row = cur.fetchone()
        if not row:
            cur.close()
            conn.close()
            return {'statusCode': 401, 'headers': cors_headers(), 'body': json.dumps({'error': 'Неверный или просроченный код'})}
        cur.execute("UPDATE auth_codes SET is_used=TRUE WHERE id=%s", (row[0],))

        cur.execute("SELECT id, email, username, display_name, avatar_url, bio FROM users WHERE email=%s", (email,))
        user = cur.fetchone()
        if not user:
            default_name = email.split('@')[0]
            cur.execute(
                "INSERT INTO users (email, display_name, username) VALUES (%s, %s, %s) RETURNING id, email, username, display_name, avatar_url, bio",
                (email, default_name, default_name),
            )
            user = cur.fetchone()

        token = secrets.token_hex(32)
        expires = datetime.utcnow() + timedelta(days=30)
        cur.execute(
            "INSERT INTO sessions (user_id, token, expires_at) VALUES (%s, %s, %s)",
            (user[0], token, expires),
        )
        conn.commit()
        result = {
            'token': token,
            'user': {
                'id': user[0], 'email': user[1], 'username': user[2],
                'display_name': user[3], 'avatar_url': user[4], 'bio': user[5] or '',
            },
        }
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps(result)}

    cur.close()
    conn.close()
    return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Неизвестное действие'})}
