# Activare producție NOVRA Store (novra.ro)

Checklist complet pentru activarea tuturor serviciilor în producție pe **Vercel** + domeniul **novra.ro**.

> **Nu comiteți niciodată chei secrete** (`sk_live_*`, `re_*`, token-uri KV) în Git. Setați-le doar în Vercel Environment Variables sau în `.env.local` (gitignored).

---

## 1. Variabile de mediu Vercel (obligatorii)

Deschideți **Vercel → Project → Settings → Environment Variables**. Adăugați pentru **Production** (și recomandat **Preview** dacă testați pe branch-uri):

| Nume variabilă | Tip | Valoare / descriere |
|----------------|-----|---------------------|
| `STRIPE_SECRET_KEY` | Secret | Cheia secretă Stripe **live** (`sk_live_...`) din [Stripe Dashboard → API keys](https://dashboard.stripe.com/apikeys). **Nu** folosiți chei `sk_test_` în producție. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Public | Cheia publishable Stripe **live** (`pk_live_...`). Vizibilă în browser — normal pentru Stripe. |
| `NEXT_PUBLIC_SITE_URL` | Public | `https://novra.ro` — folosit la redirect după plată Stripe (success/cancel). |
| `RESEND_API_KEY` | Secret | Cheia API Resend (`re_...`) din [resend.com/api-keys](https://resend.com/api-keys). |
| `RESEND_FROM_EMAIL` | Secret | Adresa expeditor. **Faza 1 (test):** `NOVRA <onboarding@resend.dev>` (sandbox Resend, doar către emailul contului). **Faza 2 (producție):** `NOVRA <comenzi@novra.ro>` după verificarea domeniului `novra.ro` în Resend. |
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

### Copy-paste rapid (nume variabile)

```
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=https://novra.ro
RESEND_API_KEY=
RESEND_FROM_EMAIL=NOVRA <onboarding@resend.dev>
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
4. Verificați: `https://novra.ro/admin/setari` — badge-urile Stripe și Resend trebuie verzi dacă cheile sunt corecte.

---

## 4. Toggle-uri Admin (după redeploy)

Autentificare: `https://novra.ro/admin/login` — folosiți `ADMIN_EMAIL` și `ADMIN_PASSWORD` setate în Vercel (variabile **server-only**, nu publice).

În **Admin → Setări**:

| Setare | Acțiune pentru producție |
|--------|--------------------------|
| **Coming Soon** → „Coming Soon activ” | **Dezactivați** (debifați) — vizitatorii văd magazinul complet. |
| **Plată cu cardul (Stripe)** → „Activează Plată cu cardul” | **Activați** — necesită chei Stripe live în Vercel + redeploy. Implicit: `cardPaymentEnabled: false`. |
| **Email comenzi (Resend)** → „Trimite email confirmare” | **Lăsați activ** — implicit: `orderEmailsEnabled: true`. Necesită `RESEND_API_KEY` în Vercel. |
| Salvați fiecare secțiune | Apăsați **Salvează** pe Stripe, Email, Coming Soon. |

### Status badge-uri așteptate (când totul e OK)

- Stripe: **Chei Stripe configurate** + **Plată card activă pe site**
- Resend: **Resend configurat** + **Emailuri comenzi active**

---

## 5. Resend — verificare domeniu novra.ro (Hostico DNS)

Pentru emailuri către **orice client** (nu doar sandbox), verificați domeniul în Resend:

1. [Resend → Domains → Add Domain](https://resend.com/domains) → `novra.ro`.
2. Resend afișează înregistrări DNS — adăugați-le în **panoul DNS Hostico**:

| Tip | Nume / Host | Valoare (exemplu — copiați din Resend) |
|-----|-------------|----------------------------------------|
| **TXT** | `@` sau `novra.ro` | Verificare domeniu (SPF include) |
| **MX** | `@` | Prioritate + `feedback-smtp...` (Resend) |
| **TXT** | `resend._domainkey` | DKIM (cheie publică) |

3. Așteptați status **Verified** în Resend (minute – 48 h).
4. Actualizați în Vercel: `RESEND_FROM_EMAIL=NOVRA <comenzi@novra.ro>` (sau altă adresă pe `@novra.ro`).
5. **Redeploy** Vercel.

### Faza sandbox (înainte de verificare domeniu)

- `RESEND_FROM_EMAIL=NOVRA <onboarding@resend.dev>`
- Emailurile merg **doar** către adresa asociată contului Resend (`contactnovraromania@gmail.com`).
- Util pentru testare; **nu** pentru clienți reali.

---

## 6. Stripe — test vs live

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

## 7. DNS novra.ro → Vercel (reminder)

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

## 8. Emailuri Resend — tipuri activate când `RESEND_API_KEY` este setat

Setați **`RESEND_API_KEY`** în Vercel Dashboard → Project → Settings → Environment Variables (Production). **Nu lipiți cheia în Git sau în acest document.**

Cu cheia configurată și **`orderEmailsEnabled: true`** (implicit în Admin → Setări), se trimit automat:

| Tip email | Declanșator | Fișier / rută |
|-----------|-------------|---------------|
| **Confirmare comandă** | Ramburs la plasare; card după plată Stripe confirmată | `src/lib/email.ts` → `trySendOrderConfirmationEmail` |
| **Status comandă — procesare** | Admin schimbă status în „processing” | `trySendOrderStatusEmail` |
| **Status comandă — expediat** | Status „shipped” (inclusiv AWB) | `trySendOrderStatusEmail` |
| **Status comandă — livrat** | Status „delivered” | `trySendOrderStatusEmail` |
| **Status comandă — anulat** | Status „cancelled” | `trySendOrderStatusEmail` |
| **Tracking AWB** | Admin salvează AWB în Comenzi (dacă nu s-a trimis deja email shipped) | `sendTrackingEmail` |
| **Newsletter bun-venit + cod reducere** | Abonare homepage, Coming Soon, cont client, API newsletter | `sendNewsletterWelcomeEmail` |
| **Campanie newsletter (broadcast)** | Admin → Newsletter → Trimite campanie | `sendNewsletterBroadcastEmail` |
| **Resetare parolă** | Cont client → „Am uitat parola” | `sendPasswordResetEmail` |
| **Coș abandonat** | Cron orar `/api/cron/abandoned-carts` (2–24 h după snapshot checkout) | `src/lib/abandoned-cart-server.ts` |

**Variabile Resend:**

| Variabilă | Obligatoriu | Valoare recomandată |
|-----------|-------------|---------------------|
| `RESEND_API_KEY` | Da | Setat în Vercel dashboard (secret `re_...`) |
| `RESEND_FROM_EMAIL` | Recomandat | Sandbox: `NOVRA <onboarding@resend.dev>` · Producție: `NOVRA <comenzi@novra.ro>` după verificare domeniu |

**Toggle Admin:** Admin → Setări → **Email comenzi (Resend)** → „Trimite email confirmare la plasarea comenzii” — **lăsați bifat** (implicit activ). Newsletter, resetare parolă și coș abandonat nu depind de acest toggle.

**Coș abandonat în producție:** necesită și `CRON_SECRET` în Vercel (Vercel Cron trimite `Authorization: Bearer …`). Opțional: `ABANDONED_CART_HOURS=2`, `ABANDONED_CART_MAX_HOURS=24`.

**Notă:** Programul de afiliere **nu** trimite emailuri clienților — doar comision în admin.

**Securitate:** Dacă cheia API a fost expusă (chat, commit accidental), rotați-o în [Resend → API Keys](https://resend.com/api-keys) și actualizați Vercel + `.env.local`.

---

## 9. Test final producție

- [ ] `https://novra.ro` — magazin vizibil (Coming Soon **off**)
- [ ] Checkout ramburs — comandă + email confirmare (dacă Resend activ)
- [ ] Checkout card — plată Stripe live + email după confirmare
- [ ] Admin → Comenzi — salvare AWB → email tracking client
- [ ] Abonare newsletter — email cu cod `NOVRA10-XXXX`
- [ ] Cont → resetare parolă — email cu link (dacă Resend activ)
- [ ] `https://www.novra.ro` — același comportament ca apex

---

## Contact & conturi

| Serviciu | Cont / notă |
|----------|-------------|
| Email business | `contactnovraromania@gmail.com` |
| Stripe | [dashboard.stripe.com](https://dashboard.stripe.com) — mod **Live** |
| Resend | [resend.com](https://resend.com) |
| Vercel | Domenii: `novra.ro`, `www.novra.ro` |
| DNS | Hostico |

---

*Document generat pentru activarea producției NOVRA Store. Actualizați valorile secrete doar în Vercel / `.env.local`.*
