# Activare producție NOVRA Store (novra.ro)

Checklist complet pentru activarea tuturor serviciilor în producție pe **Vercel** + domeniul **novra.ro**.

> **Nu comiteți niciodată chei secrete** (`sk_live_*`, token-uri KV) în Git. Setați-le doar în Vercel Environment Variables sau în `.env.local` (gitignored).

---

## 1. Variabile de mediu Vercel (obligatorii)

Deschideți **Vercel → Project → Settings → Environment Variables**. Adăugați pentru **Production** (și recomandat **Preview** dacă testați pe branch-uri):

| Nume variabilă | Tip | Valoare / descriere |
|----------------|-----|---------------------|
| `STRIPE_SECRET_KEY` | Secret | Cheia secretă Stripe **live** (`sk_live_...`) din [Stripe Dashboard → API keys](https://dashboard.stripe.com/apikeys). **Nu** folosiți chei `sk_test_` în producție. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Public | Cheia publishable Stripe **live** (`pk_live_...`). Vizibilă în browser — normal pentru Stripe. |
| `NEXT_PUBLIC_SITE_URL` | Public | `https://novra.ro` — folosit la redirect după plată Stripe (success/cancel). |
| `KV_REST_API_URL` | Secret | URL REST Upstash Redis — setat automat dacă adăugați **Upstash Redis** din Vercel Storage → Marketplace. |
| `KV_REST_API_TOKEN` | Secret | Token REST Upstash — setat automat împreună cu URL-ul de mai sus. **Obligatoriu** pe Vercel (persistență comenzi, setări, produse). |

### Variabile opționale

| Nume variabilă | Descriere |
|----------------|-----------|
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` — recomandat în producție. Endpoint: `https://novra.ro/api/store/stripe/webhook`, eveniment: `checkout.session.completed`. Confirmă plăți chiar dacă clientul nu revine pe pagina de success. |
| `CRON_SECRET` | Secret pentru `/api/cron/abandoned-carts` și `/api/cron/push-notifications` (Vercel Cron). |
| `ADMIN_EMAIL` | Email login admin (server-only, **nu** `NEXT_PUBLIC_*`). Implicit: `admin@novra.ro`. |
| `ADMIN_PASSWORD` | Parolă login admin (server-only). **Schimbați în producție!** |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | ID măsurare Google Analytics 4 (`G-...`). Scriptul se încarcă **doar** după consimțământ cookie analytics. |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Chei Web Push pentru notificări PWA. Generare: `npx web-push generate-vapid-keys` |
| `VAPID_SUBJECT` | Contact mailto pentru Web Push (ex. `mailto:contact@novra.ro`). |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Alternative la `KV_*` dacă conectați Upstash direct. |
| `EMAILS_ENABLED` | Setați `true` pentru a activa emailurile clienților. Necesită variabilele SMTP de mai jos. |
| `SMTP_HOST` | Server SMTP Hostico (ex. `mail.novra.ro`). |
| `SMTP_PORT` | `465` (SSL) sau `587` (TLS/STARTTLS). |
| `SMTP_USER` | Utilizator SMTP (ex. `contact@novra.ro`). |
| `SMTP_PASS` | Parola contului SMTP. |
| `SMTP_FROM` | Expeditor fallback (ex. `NOVRA <noreply@novra.ro>`). |
| `SMTP_CONTACT_EMAIL` | Contact + confirmare contact client (implicit `contact@novra.ro`). |
| `SMTP_NEWSLETTER_EMAIL` | Campanii și welcome newsletter (implicit `newsletter@novra.ro`). |
| `SMTP_NOREPLY_EMAIL` | Emailuri automate clienți (implicit `noreply@novra.ro`). |
| `SMTP_ORDERS_EMAIL` | Notificări admin comenzi (implicit `orders@novra.ro`; fallback: `ADMIN_EMAIL`). |
| `SMTP_SUPPORT_EMAIL` | Retururi, garanție, suport (implicit `support@novra.ro`). |
| `ABANDONED_CART_HOURS` | Ore până la primul reminder coș abandonat (implicit `2`). |
| `ABANDONED_CART_MAX_HOURS` | Fereastră maximă reminder coș abandonat (implicit `24`). |

### Copy-paste rapid (nume variabile)

```
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=https://novra.ro
KV_REST_API_URL=
KV_REST_API_TOKEN=
ADMIN_EMAIL=admin@novra.ro
ADMIN_PASSWORD=
NEXT_PUBLIC_GA_MEASUREMENT_ID=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
EMAILS_ENABLED=true
SMTP_HOST=mail.novra.ro
SMTP_PORT=465
SMTP_USER=contact@novra.ro
SMTP_PASS=
SMTP_FROM=NOVRA <noreply@novra.ro>
SMTP_CONTACT_EMAIL=contact@novra.ro
SMTP_NEWSLETTER_EMAIL=newsletter@novra.ro
SMTP_NOREPLY_EMAIL=noreply@novra.ro
SMTP_ORDERS_EMAIL=orders@novra.ro
SMTP_SUPPORT_EMAIL=support@novra.ro
```

---

## 2. Upstash Redis (Vercel KV)

1. **Vercel → Project → Storage → Create Database → Upstash Redis** (sau Marketplace → Upstash).
2. Conectați baza la proiect — Vercel injectează `KV_REST_API_URL` și `KV_REST_API_TOKEN`.
3. **Redeploy** după conectare (vezi secțiunea 3).

Fără Redis, aplicația **nu poate persista date** pe Vercel (comenzi, setări admin, produse).

---

## 3. Redeploy pe Vercel

După **orice** modificare de Environment Variables:

1. **Vercel → Deployments → ultimul deployment → ⋮ → Redeploy**.
2. Bifați **Use existing Build Cache** (opțional) sau redeploy complet.
3. Așteptați status **Ready**.
4. Verificați: `https://novra.ro/admin/setari` — badge-ul Stripe trebuie verde dacă cheile sunt corecte.

---

## 4. Toggle-uri Admin (după redeploy)

Autentificare: `https://novra.ro/admin/login` — folosiți `ADMIN_EMAIL` și `ADMIN_PASSWORD` setate în Vercel (variabile **server-only**, nu publice).

În **Admin → Setări**:

| Setare | Acțiune pentru producție |
|--------|--------------------------|
| **Coming Soon** → „Coming Soon activ” | **Dezactivați** (debifați) — vizitatorii văd magazinul complet. |
| **Plată cu cardul (Stripe)** → „Activează Plată cu cardul” | **Activați** — necesită chei Stripe live în Vercel + redeploy. Implicit: `cardPaymentEnabled: false`. |
| Salvați fiecare secțiune | Apăsați **Salvează** pe Stripe, Coming Soon. |

### Status badge-uri așteptate (când totul e OK)

- Stripe: **Chei Stripe configurate** + **Plată card activă pe site**
- Email: **Email dezactivat** (normal — magazinul nu necesită configurare email pentru lansare)

---

## 5. Stripe — test vs live

| Mediu | Chei | Comportament |
|-------|------|--------------|
| **Test** | `sk_test_...` / `pk_test_...` | Plăți fictive, carduri test Stripe. Pentru development local. |
| **Live (producție)** | `sk_live_...` / `pk_live_...` | Plăți reale în RON. **Folosiți doar acestea pe Vercel Production.** |

### Verificare rapidă Stripe live

1. Admin → Setări → badge **Chei Stripe configurate** = verde.
2. Checkout → opțiunea **Plată cu cardul** vizibilă.
3. Plată test mică (ex. 1 RON) cu card real → confirmare în [Stripe Dashboard → Payments](https://dashboard.stripe.com/payments).

**Webhook:** nu este obligatoriu. Fluxul confirmă plata la redirect (`success_url`) din Stripe Checkout.

---

## 6. DNS novra.ro → Vercel (reminder)

Traficul trebuie să ajungă pe **Vercel**, nu pe Apache static Hostico.

În **Hostico DNS**:

| Tip | Nume | Valoare |
|-----|------|---------|
| **A** | `@` | `76.76.21.21` |
| **CNAME** | `www` | `cname.vercel-dns.com` |

Ștergeți recordurile vechi (A către IP VPS Hostico, CNAME `www` → `novra.ro`).

Detalii complete: [VERCEL-DNS.md](./VERCEL-DNS.md).

### Verificare

```bash
curl -I https://novra.ro/admin/login
# Așteptat: server: Vercel, HTTP 200 sau 307
```

---

## 7. Emailuri clienți (SMTP Hostico — opțional)

**Nu este necesară configurare email pentru lansare.** Magazinul funcționează fără SMTP. Pentru emailuri automate, configurați contul Hostico și variabilele Vercel de mai sus.

| Funcție | Când se trimite | Condiții |
|---------|-----------------|----------|
| **Confirmare comandă** | La plasare (ramburs / card) | `EMAILS_ENABLED=true` + toggle „Email confirmare” în admin |
| **Status comandă** | processing, shipped, delivered, cancelled | Idem + schimbare status în admin |
| **Tracking AWB** | La salvare AWB | Idem |
| **Newsletter bun-venit** | La abonare (dacă e activat explicit) | `EMAILS_ENABLED=true` + cod reducere generat |
| **Campanii newsletter** | Din admin → Newsletter | `EMAILS_ENABLED=true` |
| **Resetare parolă** | Din cont client | `EMAILS_ENABLED=true` + SMTP configurat |
| **Coș abandonat** | Cron `/api/cron/abandoned-carts` | `EMAILS_ENABLED=true` + `CRON_SECRET` |

### Configurare Hostico pe Vercel

1. Creați cont email în cPanel Hostico (ex. `contact@novra.ro`).
2. În Vercel → Environment Variables (Production), setați:
   - `EMAILS_ENABLED` = `true`
   - `SMTP_HOST` = `mail.novra.ro` (sau hostul din cPanel)
   - `SMTP_PORT` = `465` (SSL) sau `587` (TLS)
   - `SMTP_USER` = adresa completă (ex. `contact@novra.ro`)
   - `SMTP_PASS` = parola contului
   - `SMTP_FROM` = `NOVRA <noreply@novra.ro>`
   - `SMTP_CONTACT_EMAIL` = `contact@novra.ro`
   - `SMTP_NEWSLETTER_EMAIL` = `newsletter@novra.ro`
   - `SMTP_NOREPLY_EMAIL` = `noreply@novra.ro`
   - `SMTP_ORDERS_EMAIL` = `orders@novra.ro`
   - `SMTP_SUPPORT_EMAIL` = `support@novra.ro`
3. Redeploy proiectul după salvarea variabilelor.
4. În admin → Setări, activați **Email confirmare comandă** dacă doriți confirmări automate.

**Formulare contact și recenzii:** paginile `/contact` și `/recenzii` trimit emailuri via SMTP Hostico (Nodemailer). Notificările contact merg la `SMTP_CONTACT_EMAIL`; recenziile la `SMTP_SUPPORT_EMAIL`. Comenzile noi/anulate → `SMTP_ORDERS_EMAIL`.

**Notă:** Programul de afiliere **nu** trimite emailuri clienților — doar comision în admin.

---

## 8. Test final producție

- [ ] `https://novra.ro` — magazin vizibil (Coming Soon **off**)
- [ ] Checkout ramburs — comandă + cod afișat pe pagină
- [ ] Checkout card — plată Stripe live + cod pe pagina de success
- [ ] Admin → Comenzi — salvare AWB
- [ ] Abonare newsletter — cod `NOVRA10-XXXX` afișat pe pagină
- [ ] Cont → resetare parolă — mesaj contact suport (email dezactivat)
- [ ] `https://www.novra.ro` — același comportament ca apex

---

## Contact & conturi

| Serviciu | Cont / notă |
|----------|-------------|
| Email business | `contact@novra.ro` (SMTP Hostico) |
| Stripe | [dashboard.stripe.com](https://dashboard.stripe.com) — mod **Live** |
| Vercel | Domenii: `novra.ro`, `www.novra.ro` |
| DNS | Hostico |

---

*Document generat pentru activarea producției NOVRA Store. Actualizați valorile secrete doar în Vercel / `.env.local`.*
