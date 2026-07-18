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
| `EMAILS_ENABLED` | **Dezactivat implicit.** Setați `true` doar dacă integrați ulterior un provider email. Magazinul funcționează complet fără email. |

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

## 7. Emailuri clienți (opțional — dezactivat implicit)

**Nu este necesară configurare email pentru lansare.** Magazinul funcționează fără DNS email sau provider extern.

| Funcție | Comportament fără email |
|---------|-------------------------|
| **Newsletter** | Cod reducere afișat direct pe pagină după abonare |
| **Confirmare comandă** | Cod comandă pe pagina de success / checkout |
| **Resetare parolă** | Mesaj „contactează suportul” (support@novra.ro) |
| **Tracking AWB** | Vizibil în cont client și la urmărire comandă |
| **Campanii newsletter** | Dezactivate în admin cât timp emailul este oprit |

Pentru a activa emailuri în viitor: setați `EMAILS_ENABLED=true` și integrați un provider în `src/lib/email.ts`.

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
| Email business | `contactnovraromania@gmail.com` |
| Stripe | [dashboard.stripe.com](https://dashboard.stripe.com) — mod **Live** |
| Vercel | Domenii: `novra.ro`, `www.novra.ro` |
| DNS | Hostico |

---

*Document generat pentru activarea producției NOVRA Store. Actualizați valorile secrete doar în Vercel / `.env.local`.*
