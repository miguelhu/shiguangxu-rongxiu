const SHANGHAI_TIME_ZONE = 'Asia/Shanghai'

const TARGETS = {
  frame: { label: '相框端', hash: '/#/frame?menu=1&scenario=ama-letter&demo=tablet&device=frame-11' },
  member: { label: '子女端', hash: '/#/member/home?scenario=ama-letter' },
}

export async function onRequest(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const pathname = url.pathname

  if (pathname === '/_team/invite') {
    return renderTeamInvitePage()
  }

  if (pathname.startsWith('/_team/invite/api/')) {
    return handleTeamInviteApi(request, env, pathname)
  }

  if (pathname.startsWith('/invite/')) {
    return handleInviteOpen(request, env)
  }

  return context.next()
}

async function handleTeamInviteApi(request, env, pathname) {
  if (!env.INVITE_SECRET) {
    return jsonResponse({ ok: false, error: 'missing_env' }, 500)
  }

  const body = await readJson(request)
  const targetId = normalizeTarget(body?.target)
  const dateKey = getShanghaiDateKey()
  const secondsUntilMidnight = getSecondsUntilShanghaiMidnight()
  let token

  if (pathname.endsWith('/rotate')) {
    if (!env.INVITE_KV) {
      return jsonResponse({ ok: false, error: 'missing_kv' }, 500)
    }
    token = randomToken()
    await env.INVITE_KV.put(getTokenKvKey(dateKey), token, { expirationTtl: secondsUntilMidnight + 3600 })
  } else {
    token = await getTodayToken(env, dateKey)
  }

  const url = new URL(request.url)
  const inviteUrl = `${url.origin}/invite/${token}?target=${targetId}`
  return jsonResponse({
    ok: true,
    url: inviteUrl,
    token,
    target: targetId,
    targetLabel: TARGETS[targetId].label,
    expiresAt: `${dateKey} 23:59:59`,
    secondsUntilMidnight,
  })
}

async function handleInviteOpen(request, env) {
  if (!env.INVITE_SECRET) {
    return renderExpiredPage('演示链接服务还没有配置完成。', 500)
  }

  const url = new URL(request.url)
  const token = decodeURIComponent(url.pathname.replace(/^\/invite\//, '').split('/')[0] || '')
  const dateKey = getShanghaiDateKey()
  const currentToken = await getTodayToken(env, dateKey)

  if (!token || token !== currentToken) {
    return renderExpiredPage('这个演示链接已失效，请向团队获取最新链接。', 403)
  }

  const targetId = normalizeTarget(url.searchParams.get('target'))
  const headers = new Headers({
    Location: TARGETS[targetId].hash,
    'Cache-Control': 'no-store',
  })
  return new Response(null, { status: 302, headers })
}

async function getTodayToken(env, dateKey) {
  const storedToken = env.INVITE_KV ? await env.INVITE_KV.get(getTokenKvKey(dateKey)) : null
  if (storedToken) return storedToken
  return createDailyToken(env.INVITE_SECRET, dateKey)
}

function getTokenKvKey(dateKey) {
  return `invite:${dateKey}:token`
}

function normalizeTarget(target) {
  if (target && Object.prototype.hasOwnProperty.call(TARGETS, target)) return target
  return 'frame'
}

async function createDailyToken(secret, dateKey) {
  const bytes = await hmacBytes(secret, `sgx-invite:${dateKey}`)
  return toBase64Url(bytes).slice(0, 14)
}

async function hmacBytes(secret, message) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
  return new Uint8Array(signature)
}

function toBase64Url(bytes) {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function randomToken() {
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  return toBase64Url(bytes).slice(0, 14)
}

function getShanghaiDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: SHANGHAI_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const year = parts.find((part) => part.type === 'year')?.value || '2026'
  const month = parts.find((part) => part.type === 'month')?.value || '01'
  const day = parts.find((part) => part.type === 'day')?.value || '01'
  return `${year}-${month}-${day}`
}

function getSecondsUntilShanghaiMidnight(date = new Date()) {
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: SHANGHAI_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date)
  const hour = Number(parts.find((part) => part.type === 'hour')?.value || '0')
  const minute = Number(parts.find((part) => part.type === 'minute')?.value || '0')
  const second = Number(parts.find((part) => part.type === 'second')?.value || '0')
  return Math.max(1, 24 * 60 * 60 - (hour * 60 * 60 + minute * 60 + second))
}

async function readJson(request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

function renderTeamInvitePage() {
  const targetButtons = Object.entries(TARGETS)
    .map(([id, target]) => `<button class="target${id === 'frame' ? ' is-active' : ''}" data-target="${id}" type="button"><strong>${target.label}</strong></button>`)
    .join('')

  return new Response(`<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>最新演示链接 - 拾光叙</title>
  <style>
    *{box-sizing:border-box}body{margin:0;min-height:100vh;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;background:linear-gradient(135deg,#f8efe2,#fffaf4 50%,#edf3ed);color:#26372d}.page{min-height:100vh;padding:52px 24px}.shell{display:grid;gap:24px;margin:0 auto;max-width:760px}.hero{display:grid;gap:12px}.hero h1{margin:0;font-size:clamp(36px,5vw,56px);letter-spacing:0;line-height:1.05}.hero p{margin:0;color:rgba(38,55,45,.72);font-size:18px;font-weight:650;line-height:1.7;white-space:nowrap}.card{display:grid;gap:18px;padding:24px;border:1px solid rgba(143,119,88,.16);border-radius:22px;background:rgba(255,252,247,.9);box-shadow:0 24px 60px rgba(88,64,38,.14)}.login{display:grid;gap:12px;grid-template-columns:1fr auto}.login input{height:52px;border:1px solid rgba(143,119,88,.22);border-radius:16px;background:#fff8ef;color:#26372d;font-size:17px;font-weight:750;padding:0 16px}.login button,.actions button{min-height:52px;border:0;border-radius:16px;cursor:pointer;font-size:17px;font-weight:900}.login button,.primary{background:#2f704e;color:#fffaf2;box-shadow:0 14px 28px rgba(47,112,78,.23)}.targets{display:grid;gap:12px;grid-template-columns:repeat(2,minmax(0,1fr))}.target{align-items:center;display:flex;min-height:78px;padding:16px;border:1px solid rgba(143,119,88,.18);border-radius:16px;background:#fff8ef;cursor:pointer;text-align:left}.target.is-active{border-color:rgba(47,112,78,.55);background:#eef8ef;box-shadow:inset 0 0 0 2px rgba(47,112,78,.16)}.target strong{font-size:20px}.link{display:grid;gap:8px;padding:16px;border:1px solid rgba(47,112,78,.16);border-radius:16px;background:rgba(244,250,242,.82);color:#24392d}.link small{color:rgba(47,85,65,.72);font-size:14px;font-weight:850}.link p{margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:16px;line-height:1.6;overflow-wrap:anywhere}.actions{display:grid;grid-template-columns:1fr;gap:14px}.secondary{border:1px solid rgba(186,74,52,.22)!important;background:#fff5f2;color:#a13b2b;padding:0 18px}.toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);padding:12px 18px;border-radius:999px;background:rgba(38,55,45,.94);color:#fffaf2;font-size:15px;font-weight:850;box-shadow:0 16px 34px rgba(38,55,45,.22)}.hidden{display:none}@media(max-width:760px){.page{padding:28px 16px}.shell{max-width:100%}.hero h1{font-size:38px}.hero p{font-size:16px;white-space:normal}.card{padding:18px;border-radius:20px}.targets,.login{grid-template-columns:1fr}}
  </style>
</head>
<body>
  <main class="page">
    <section class="shell">
      <header class="hero">
        <h1>最新演示链接</h1>
        <p>每天一个公共链接，当天 24 点自动失效。需要提前作废时，重新生成最新链接即可。</p>
      </header>
      <section class="card">
        <div class="targets">${targetButtons}</div>
        <div class="link"><small>可直接发给外部体验者</small><p id="inviteUrl">生成中...</p></div>
      </section>
      <div class="actions">
        <button class="primary" id="copyButton" type="button">复制链接</button>
        <button class="secondary" id="rotateButton" type="button">重新生成最新链接（当前链接将失效）</button>
      </div>
    </section>
    <div class="toast hidden" id="toast"></div>
  </main>
  <script>
    let target = 'frame';
    const inviteUrlEl = document.getElementById('inviteUrl');
    const toastEl = document.getElementById('toast');
    const showToast = (text) => { toastEl.textContent = text; toastEl.classList.remove('hidden'); clearTimeout(window.__toastTimer); window.__toastTimer = setTimeout(() => toastEl.classList.add('hidden'), 2200); };
    async function requestLink(mode) {
      const response = await fetch('/_team/invite/api/' + mode, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target })
      });
      const data = await response.json();
      if (!data.ok) throw new Error(data.error || 'unknown_error');
      inviteUrlEl.textContent = data.url;
    }
    requestLink('today').catch(() => showToast('链接生成失败，请检查 Cloudflare 配置'));
    document.querySelectorAll('.target').forEach((button) => {
      button.addEventListener('click', async () => {
        document.querySelectorAll('.target').forEach((item) => item.classList.remove('is-active'));
        button.classList.add('is-active');
        target = button.dataset.target || 'frame';
        await requestLink('today');
      });
    });
    document.getElementById('copyButton').addEventListener('click', async () => {
      await navigator.clipboard.writeText(inviteUrlEl.textContent);
      showToast('链接已复制');
    });
    document.getElementById('rotateButton').addEventListener('click', async () => {
      if (!confirm('确定重新生成最新链接？今天已发出去的旧链接会失效。')) return;
      try {
        await requestLink('rotate');
        showToast('最新链接已重新生成');
      } catch {
        showToast('重新生成失败，请检查 KV 绑定');
      }
    });
  </script>
</body>
</html>`, htmlHeaders())
}

function renderExpiredPage(message, status) {
  return new Response(`<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>演示链接已失效</title>
  <style>
    body{margin:0;min-height:100vh;display:grid;place-items:center;background:linear-gradient(135deg,#f8efe2,#fffaf4 48%,#edf3ed);font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;color:#26372d}.card{width:min(520px,calc(100vw - 40px));padding:34px;border-radius:22px;background:rgba(255,252,247,.92);box-shadow:0 24px 60px rgba(88,64,38,.14);text-align:center}.card h1{margin:0 0 12px;font-size:30px}.card p{margin:0;color:rgba(38,55,45,.68);font-size:17px;font-weight:650;line-height:1.7}
  </style>
</head>
<body><section class="card"><h1>演示链接已失效</h1><p>${escapeHtml(message)}</p></section></body>
</html>`, { status, headers: htmlHeaders().headers })
}

function htmlHeaders() {
  return {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  }
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
