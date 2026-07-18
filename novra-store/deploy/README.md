# Deploy NOVRA Store pe VPS (Apache + Node.js)

## Problema: `/admin` returnează Apache 404

Dacă homepage-ul (`/`) funcționează dar `/admin`, `/api` sau alte rute dau:

```text
Not Found - Apache Server at www.novra.ro Port 443
```

**Apache nu trimite cererile către Next.js.** Probabil:

1. Ați încărcat doar fișiere statice în `public_html` (un `index.html` merge, dar `/admin` nu există ca fișier), **sau**
2. Proxy-ul Apache acoperă doar `/` și nu toate subpath-urile.

Next.js **trebuie să ruleze ca proces Node.js** (PM2). Apache doar face reverse proxy către `http://127.0.0.1:3000`.

---

## Verificare rapidă pe server

```bash
# Next.js rulează?
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/admin
# Așteptat: 200 sau 307 (redirect login) — NU 000 sau connection refused

# PM2
pm2 list
pm2 logs novra-store --lines 30
```

Dacă `curl` pe localhost:3000 funcționează dar `https://www.novra.ro/admin` nu, problema e **100% la Apache**.

---

## Pași de remediere (acum)

### 1. Porniți Next.js cu PM2

```bash
cd /path/to/novra-store   # ex: /home/user/novra-store sau în afara public_html
npm ci
npm run build
pm2 start deploy/ecosystem.config.cjs
pm2 save
```

Verificați: `curl http://127.0.0.1:3000/admin` trebuie să răspundă.

### 2. Activați modulele Apache

```bash
# Debian/Ubuntu
sudo a2enmod proxy proxy_http ssl headers rewrite
sudo systemctl restart apache2

# CentOS/RHEL
sudo yum install mod_ssl   # dacă lipsește
# Asigurați-vă că proxy_module și proxy_http_module sunt încărcate
sudo systemctl restart httpd
```

### 3. Configurați VirtualHost cu proxy complet

Copiați `deploy/apache-novra.conf` pe server și adaptați căile SSL:

```bash
sudo cp deploy/apache-novra.conf /etc/apache2/sites-available/novra.conf
sudo nano /etc/apache2/sites-available/novra.conf   # SSL paths, ServerName
sudo a2ensite novra.conf
sudo apachectl configtest
sudo systemctl reload apache2
```

**Esential** — toate rutele trebuie proxate:

```apache
ProxyPreserveHost On
ProxyPass        / http://127.0.0.1:3000/
ProxyPassReverse / http://127.0.0.1:3000/
```

**Greșit** (doar homepage):

```apache
ProxyPass / http://127.0.0.1:3000/   # OK
# dar DocumentRoot public_html cu index.html — /admin nu merge
```

### 4. Test final

```bash
curl -I https://www.novra.ro/admin
curl -I https://www.novra.ro/api/store/products
curl -I https://www.novra.ro/_next/static/
```

Toate trebuie să vină de la Next.js (nu Apache 404).

---

## Hostico / cPanel

| Ce NU faceți | Ce faceți |
|--------------|-----------|
| `npm run build` + upload `out/` sau `.next/` în `public_html` | Rulați `npm run start` cu PM2 **în afara** `public_html` |
| Doar `index.html` în `public_html` | Apache proxy către `127.0.0.1:3000` |
| Așteptați ca `/admin` să existe ca folder fizic | Next.js gestionează toate rutele din `src/app/` |

Pe cPanel cu acces SSH:

1. Clonați repo-ul în `~/novra-store` (nu în `public_html`).
2. PM2 + build + start (pașii de mai sus).
3. În **Apache Configuration** sau fișier include custom, adăugați proxy-ul din `apache-novra.conf`.

Dacă **nu** aveți acces la VirtualHost, contactați suportul Hostico: *„Am nevoie de reverse proxy de la domeniu către localhost:3000 pentru aplicație Node.js/Next.js.”*

`.htaccess` cu `ProxyPass` **nu funcționează** pe majoritatea planurilor shared (mod_proxy dezactivat în `.htaccess`).

---

## Variabile de mediu

Copiați `.env.example` → `.env.local` pe server și completați cheile (Stripe, Redis, etc.). Reporniți PM2 după modificări:

```bash
pm2 restart novra-store
```

---

## next.config — fără probleme cunoscute

Proiectul **nu** folosește `basePath` sau `trailingSlash`. Rutele `/admin`, `/api`, `/_next` sunt standard. Dacă localhost:3000 merge, nu e nevoie de modificări Next.js.

---

## Fișiere din acest folder

| Fișier | Rol |
|--------|-----|
| `apache-novra.conf` | VirtualHost Apache (SSL + proxy complet) |
| `ecosystem.config.cjs` | PM2 — proces Node pe port 3000 |
| `README.md` | Acest ghid |

---

## Depanare

| Simptom | Cauză probabilă | Soluție |
|---------|-----------------|---------|
| Apache 404 pe `/admin` | Fără proxy sau fișiere statice în `public_html` | ProxyPass `/` + PM2 |
| `Connection refused` la curl :3000 | Next.js oprit | `pm2 start` / `pm2 restart` |
| 502 Bad Gateway | Node crash sau port greșit | `pm2 logs`, verificați port 3000 |
| Homepage OK, rest 404 | `DocumentRoot` servește static + proxy incomplet | Eliminați index static, proxy pe `/` |
| SSL OK dar app nu merge | Proxy doar pe HTTP intern | Verificați VirtualHost `*:443` |
