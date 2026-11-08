# نشر Combat Protocol

اللعبة **ملفات ثابتة** بالكامل: لا backend، لا قاعدة بيانات، لا طلبات شبكة.
كل ما تحتاجه هو استضافة HTTP تخدم الملفات كما هي.

## 1. بناء نسخة النشر

```powershell
npm run build
```

يُنشئ مجلد `dist/` ويحتوي فقط على:

```text
dist/
  index.html
  css/
  js/
  vendor/
  _headers
  _redirects
  robots.txt
  .nojekyll
```

## 2. النشر على سيرفر خاص (VPS) - الأونلاين وWebSocket

سيرفر اللعبة المطور `server.mjs` يعتمد بالكامل على مكتبات Node.js القياسية (لا يحتاج أي مكتبات خارجية لتشغيل اللعبة والسيرفر الجماعي). يدعم استضافة ملفات اللعبة وخدمة WebSocket للعب الجماعي في نفس الوقت.

### الخطوة 1: استنساخ المشروع على الـ VPS
```bash
git clone <GITHUB_REPO_URL> combat-protocol
cd combat-protocol
```

### الخطوة 2: تشغيل السيرفر مباشرة
```bash
# تشغيل السيرفر على المنفذ الافتراضي 4173
node server.mjs

# أو تحديد منفذ ومضيف مخصص:
PORT=80 HOST=0.0.0.0 node server.mjs
```

### الخطوة 3: التشغيل في الخلفية بصورة دائمة (PM2)
```bash
# تثبيت PM2 إن لم يكن مثبتاً
npm install -g pm2

# تشغيل اللعبة
pm2 start server.mjs --name "combat-protocol" --time

# حفظ الإعدادات لتعمل تلقائياً عند إعادة تشغيل السيرفر
pm2 save
pm2 startup
```

### الخطوة 4: إعداد Nginx العكسي (Reverse Proxy) مع دعم WebSocket وSSL
إذا كنت تستخدم دومين وNginx، أنشئ ملف إعداد `/etc/nginx/sites-available/combat-protocol`:

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:4173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

قم بتفعيل الموقع وتحديث Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/combat-protocol /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 3. الرفع على استضافات سحابية ثابتة (Static Only)

### Netlify
- اسحب مجلد `dist` إلى <https://app.netlify.com/drop>، أو اربط المستودع؛
  ملف `netlify.toml` جاهز.
- الرابط النهائي سيكون مثل `https://your-site.netlify.app`.

### Vercel
- اربط المستودع؛ `vercel.json` جاهز، أو ارفع `dist` كـOutput Directory.

### Cloudflare Pages
- Framework preset: **None**.
- Build command: `npm run build` أو اتركه فارغاً وارفع `dist` مباشرة.
- Output directory: `dist`.

### GitHub Pages
- ارفع محتويات `dist` إلى فرع `gh-pages` (ملف `.nojekyll` موجود).
- الرابط: `https://<user>.github.io/<repo>/`.

### nginx / استضافة عادية
- انسخ محتويات `dist` إلى `root` الموقع.
- تأكد أن `.js` يُخدم بـ`text/javascript` (أو `application/javascript`).
- نموذج:

```nginx
server {
  listen 80;
  server_name game.example.com;
  root /var/www/combat-protocol;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location ~* \.(js|css|png|jpg|svg|woff2)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
  }

  types {
    text/javascript js mjs;
    text/css css;
  }
}
```

## 3. اختبار محلي لنسخة النشر

```powershell
npx serve dist
# أو
python -m http.server 8080 -d dist
```

ثم افتح `http://127.0.0.1:8080`.

## 4. ملاحظات

- لا ترفع `node_modules` أو `tests` أو `tools` أو `docs` إلى السيرفر.
- اللعبة تعمل على المسار الجذري أو داخل مجلد فرعي (كل المسارات نسبية).
- لا تحتاج HTTPS خصيصاً، لكنه مطلوب لبعض ميزات المتصفح على الموبايل.
- `?safe=1` يفعّل وضع التوافق للأجهزة الضعيفة.
