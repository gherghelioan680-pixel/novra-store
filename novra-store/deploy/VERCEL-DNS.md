# DNS Hostico → Vercel (novra.ro)

## Simptom

- Homepage (`/`) pare OK, dar `/admin` dă **Apache 404 Not Found**
- `curl -I https://www.novra.ro/admin` arată `Server: Apache` (nu `Server: Vercel`)
- Site-ul Next.js funcționează pe Vercel, dar unele rețele încă ajung pe VPS-ul Hostico

## Cauză

DNS-ul de la Hostico trimite traficul către **Apache + fișiere statice** (`public_html`), nu către Vercel. Apache servește un `index.html` pentru `/`, dar `/admin` nu există ca fișier fizic → 404.

Configurație greșită observată:

| Record | Valoare greșită | Efect |
|--------|-----------------|-------|
| `www` CNAME | `novra.ro` | www urmează apex-ul Hostico, nu Vercel |
| `@` A | `188.241.222.239` (sau IP VPS Hostico) | apex-ul nu ajunge pe Vercel |

## Remediere în panoul DNS Hostico

1. Deschideți **Vercel → Project → Settings → Domains** și confirmați că `novra.ro` și `www.novra.ro` sunt adăugate.
2. În **Hostico DNS**, setați:

| Tip | Nume | Valoare |
|-----|------|---------|
| **A** | `@` | `76.76.21.21` |
| **CNAME** | `www` | `cname.vercel-dns.com` |

3. **Ștergeți** recordurile vechi:
   - CNAME `www` → `novra.ro`
   - A `@` → IP-ul VPS Hostico (`188.241.222.x`)
4. Așteptați propagarea DNS (5 min – 48 h). TTL mic (300 s) accelerează.

## Verificare

```bash
# Trebuie să arate Vercel, NU Apache
curl -I https://www.novra.ro/admin
curl -I https://novra.ro/admin

# Așteptat:
# HTTP/2 200 (sau 307)
# server: Vercel
```

În browser: `https://www.novra.ro/admin/login` → formular de autentificare admin.

## Autentificare admin

| Câmp | Valoare |
|------|---------|
| Email | `admin@novra.ro` |
| Parolă | `NovraAdmin2026!` |

## Dacă rămâneți pe VPS Hostico (alternativă la Vercel)

Nu folosiți upload static în `public_html`. Rulați Next.js cu PM2 și configurați Apache reverse proxy complet — vezi [README.md](./README.md) și `apache-novra.conf`.
