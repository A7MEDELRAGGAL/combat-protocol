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

## 2. الرفع على استضافة

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
