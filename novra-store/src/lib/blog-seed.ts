import type { BlogArticle } from "@/lib/blog-types";

export type BlogArticleTemplate = Omit<BlogArticle, "id" | "createdAt" | "updatedAt">;

export const DEFAULT_BLOG_ARTICLE_TEMPLATES: BlogArticleTemplate[] = [
  {
    slug: "cum-alegi-cablul-usb-c-potrivit-2026",
    title: "Cum alegi cablul USB-C potrivit în 2026",
    excerpt:
      "USB-C nu înseamnă automat calitate. În 2026, diferența dintre un cablu generic și unul certificat poate însemna încărcare lentă, supraîncălzire sau chiar deteriorarea portului dispozitivului tău.",
    metaTitle: "Cum alegi cablul USB-C potrivit în 2026 | Ghid NOVRA",
    metaDescription:
      "Ghid complet pentru alegerea cablului USB-C ideal: Power Delivery, E-Mark, lungime, materiale și ce verifici înainte de cumpărare. Recomandări NOVRA pentru 2026.",
    coverImageUrl: "/products/cabluri/violet.png",
    published: true,
    categories: ["Ghiduri", "Cabluri USB-C"],
    tags: ["usb-c", "power-delivery", "ghid", "2026"],
    content: `În 2026, aproape fiecare dispozitiv modern folosește USB-C — de la MacBook și iPad Pro la telefoane Android de top și console portabile. Problema? **Nu toate cablurile USB-C sunt create egal.** Un conector identic la exterior poate ascunde un cablu de date lent, un fir subdimensionat sau lipsa cipului E-Mark necesar pentru încărcare peste 60W.

## De ce contează specificațiile reale

Multe cabluri din piață poartă eticheta „USB-C” fără a suporta Power Delivery (PD) sau USB 3.x. Un cablu de încărcare pur transmite curent pe linii fixe; un cablu de date complet include fire suplimentare pentru transfer rapid și negociere inteligentă a puterii între încărcător și dispozitiv.

Când conectezi un laptop de 65W la un cablu fără E-Mark, sistemul poate limita automat puterea la 20W sau 45W — sau poate fluctua periculos. Rezultatul: încărcare lentă, cablu cald, uzură prematură a portului.

## Ce verifici înainte de cumpărare

**1. Puterea maximă declarată** — Pentru laptopuri, caută minimum 100W (20V/5A). Pentru telefoane, 30–45W este suficient, dar un cablu 100W rămâne compatibil și mai sigur pe termen lung.

**2. Cip E-Mark** — Obligatoriu pentru curenți peste 3A. Cablurile NOVRA UltraCharge și HyperPower integrează cipuri E-Mark certificate care comunică capacitatea reală către dispozitiv.

**3. Lungimea** — Un cablu de 2 metri este comod la birou, dar rezistența electrică crește cu lungimea. Pentru 100W+, NOVRA recomandă 1M pentru performanță maximă sau 2M cu secțiune internă mărită.

**4. Materialele** — Mânșonul din nylon balistic previne împletirea și ruperea la flexiune. Conectorii din aliaj de aluminiu anodizat disipă căldura și rezistă la coroziune.

**5. Certificări și garanție** — Evită produsele fără brand, fără specificații clare sau fără politică de retur. NOVRA oferă specificații transparente pe fiecare produs.

## USB-C la USB-C vs USB-A la USB-C

Dacă ai un încărcător vechi USB-A, un cablu hibrid precum NOVRA Hybrid 100W este soluția corectă — suportă protocoale Quick Charge și PD pe partea USB-C. Pentru laptopuri și tablete moderne, USB-C la USB-C cu PD 3.0 sau 3.1 este standardul de aur.

## Greșeli frecvente în 2026

- Cumpărarea celui mai ieftin cablu de la chioșc — risc de supraîncălzire.
- Folosirea aceluiași cablu pentru laptop 100W și pentru căști wireless — funcționează, dar nu optim.
- Ignorarea uzurii fizice: împletirea expusă sau conectorul jucău indică înlocuire imediată.
- Amestecarea cablurilor „rapid charge” proprietare cu PD universal fără verificarea compatibilității.

## Recomandarea NOVRA

Pentru utilizare zilnică universală, **NOVRA UltraCharge 100W** acoperă laptopuri, tablete și telefoane premium. Dacă ai un laptop de gaming sau stație grafică cu PD 3.1, **NOVRA HyperPower 240W** este pregătit pentru generația următoare de dispozitive.

Alegerea corectă a cablului USB-C nu este un detaliu minor — este investiția care protejează dispozitivele scumpe și îți garantează încărcare rapidă, stabilă, în fiecare zi.`,
  },
  {
    slug: "ce-inseamna-100w-power-delivery",
    title: "Ce înseamnă 100W Power Delivery și de ce contează",
    excerpt:
      "Power Delivery la 100W a transformat modul în care încărcăm laptopurile. Înțelege protocoalele PD, profilurile de tensiune și de ce ai nevoie de un cablu pe măsură.",
    metaTitle: "Ce înseamnă 100W Power Delivery | Explicație NOVRA",
    metaDescription:
      "Află ce este USB Power Delivery 100W, cum funcționează negocierea puterii, profilurile 5V–20V și de ce cablul și încărcătorul contează la fel de mult.",
    coverImageUrl: "/products/cabluri/albastru.png",
    published: true,
    categories: ["Tehnologie", "Încărcare rapidă"],
    tags: ["power-delivery", "100w", "pd-3.0", "usb-c"],
    content: `**USB Power Delivery (PD)** este protocolul care permite dispozitivelor să negocieze nu doar tensiunea, ci și puterea de încărcare prin USB-C. La **100W**, un singur cablu poate alimenta un MacBook Pro, o tabletă și un telefon — fără încărcătoare separate.

## Cum funcționează PD în practică

Spre deosebire de încărcarea tradițională fixă (5V/2A = 10W), PD schimbă mesaje digitale între sursă și dispozitiv. Încărcătorul anunță profilurile suportate: 5V, 9V, 12V, 15V, 20V — fiecare cu un curent maxim. Dispozitivul alege combinația optimă.

La 100W, profilul standard este **20V la 5A** — adică 20 × 5 = 100W. Atingerea acestui nivel necesită trei elemente aliniate: încărcător certificat PD, dispozitiv compatibil și **cablu cu cip E-Mark**.

## De ce 100W este pragul magic

Majoritatea laptopurilor ultrabook și business (MacBook Air, Dell XPS, Lenovo ThinkPad) se încarcă complet la 65W. Modelele Pro și workstation-urile cer 87W–100W pentru încărcare rapidă sub sarcină. Un sistem 100W oferă marjă de siguranță și permite alimentarea simultană a accesoriilor prin hub-uri USB-C.

Pentru telefoane, 100W este „overkill" deliberat: cablul funcționează la 9V/2A sau 9V/3A fără stres termic, iar viața utilă crește semnificativ față de cablurile subdimensionate.

## PD 3.0 vs PD 3.1

**PD 3.0** acoperă până la 100W (20V/5A) — standardul actual pentru majoritatea echipamentelor. **PD 3.1** extinde plafonul la 240W prin profiluri Extended Power Range (28V, 36V, 48V) — necesar pentru laptopuri de gaming de ultimă generație.

NOVRA UltraCharge 100W este optimizat pentru PD 3.0, iar HyperPower 240W pentru PD 3.1 — ambele cu cipuri E-Mark integrate.

## Semne că nu obții 100W reali

- Laptopul se încarcă, dar mesajul „Încărcare lentă" persistă.
- Cablul devine cald la atingere după 10–15 minute.
- Timpul de la 0% la 50% depășește 90 de minute pe un dispozitiv care suportă fast charge.
- Hub-ul USB-C raportează alimentare insuficientă.

Cauzele frecvente: cablu fără E-Mark, încărcător de 65W etichetat greșit, sau port USB-C murdar/uzat.

## Beneficii dincolo de viteză

Un sistem PD 100W bine configurat reduce numărul de încărcătoare în geantă, elimină adaptori proprietary și standardizează experiența între dispozitive Apple, Windows și Android. Mai puțină căldură înseamnă și mai puțină degradare a bateriei interne.

## Concluzie NOVRA

100W Power Delivery nu este marketing — este un standard verificabil. Investește într-un cablu care specifică clar 20V/5A cu E-Mark, ca **NOVRA UltraCharge 100W**, și împerechează-l cu un încărcător GaN de minimum 65W (ideal 100W) pentru rezultate complete. Viteza pe care o simți în prima săptămână va confirma diferența.`,
  },
  {
    slug: "diferenta-cablu-usb-c-original-aftermarket",
    title: "Diferența între cablu USB-C original și aftermarket",
    excerpt:
      "Cablul original de la producător merită prețul? Sau un cablu premium aftermarket precum NOVRA oferă mai mult? Comparație onestă pe performanță, durabilitate și valoare.",
    metaTitle: "Cablu USB-C original vs aftermarket | Comparație NOVRA",
    metaDescription:
      "Original sau aftermarket? Comparăm cablurile USB-C din cutie cu alternative premium: putere, durabilitate, preț și când merită să treci la NOVRA.",
    coverImageUrl: "/products/cabluri/roz.png",
    published: true,
    categories: ["Comparații", "Cabluri USB-C"],
    tags: ["original", "aftermarket", "calitate", "usb-c"],
    content: `Fiecare telefon sau laptop vine cu un cablu în cutie. Mulți utilizatori presupun că acela este singurul cablu „sigur" — iar alternativele aftermarket sunt inferioare. Realitatea din 2026 este mai nuanțată: **producătorii optimizează cablul din cutie pentru cost și compatibilitate strictă cu propriile dispozitive**, nu neapărat pentru durabilitate maximă sau flexibilitate cross-brand.

## Ce oferă cablul original

**Avantaje:**
- Certificare MFi (la Apple) sau testare strictă pe propriul ecosistem.
- Garanție asociată dispozitivului în primul an.
- Profil subțire, ușor de transportat.

**Dezavantaje:**
- Lungime fixă (adesea 1M sau mai puțin).
- Mânșon din PVC care se deteriorează în 12–18 luni de utilizare intensă.
- Putere limitată pe modelele entry-level (uneori doar 20W).
- Preț de înlocuire ridicat (30–50 EUR la branduri premium).

## Ce aduce un cablu aftermarket premium

Branduri specializate precum NOVRA proiectează cabluri ca produs principal, nu accesoriu de serie. Diferențele concrete:

**Materiale superioare** — Nylon balistic împletit, nuclee Kevlar, conectori aluminiu anodizat. Teste de flexiune de 10.000+ cicluri vs. 3.000–5.000 la cablurile OEM tipice.

**Putere explicită** — NOVRA declară 100W sau 240W cu E-Mark verificabil. Cablurile originale mid-range adesea nu specifică PD maxim.

**Versatilitate** — Un cablu NOVRA USB-C la USB-C încarcă MacBook, Samsung, Pixel și iPad Pro — fără a purta cabluri diferite.

**Raport calitate-preț** — La prețuri competitive, obții specificații de top fără taxa de brand al producătorului de telefon.

## Când să păstrezi originalul

- Dispozitiv sub garanție și politica producătorului exclude aftermarket (rar, dar posibil la unele enterprise).
- Ai nevoie de funcții foarte specifice (ex. cablu Thunderbolt 4 certificat Intel cu 40Gbps — verifică întotdeauna specificațiile).
- Cablul din cutie este încă nou și acoperă nevoile actuale.

## Când aftermarket este alegerea inteligentă

- Cablul original s-a împletit sau s-a crăpat la conector.
- Ai nevoie de 2M pentru birou sau pat.
- Încarci laptopuri și telefoane cu același cablu.
- Vrei culori și finisaje care se potrivesc setup-ului tău (Violet, Blue, Roz la NOVRA).

## Mituri de demontat

*„Aftermarket strică bateria"* — Fals, dacă cablul respectă PD și limitele dispozitivului. Bateria este protejată de controllerul intern al telefonului.

*„Originalul este mereu mai rapid"* — Depinde de generație. Un iPhone cu cablu Lightning original 5W vs. NOVRA USB-C PD 30W — diferența este dramatică în favoarea aftermarket-ului modern.

*„Toate cablurile ieftine sunt la fel cu premium"* — Nu. Diferența este în secțiunea conductorilor, calitatea lipiturilor și prezența E-Mark.

## Verdictul NOVRA

Cablul original este un punct de plecare decent. Pentru utilizare zilnică intensă, călătorii și încărcare multi-dispozitiv, un cablu aftermarket premium **nu este un compromis — este un upgrade**. NOVRA combină specificațiile transparente cu materiale de durată și design care se potrivește esteticii premium a setup-ului tău.`,
  },
  {
    slug: "ghid-incarcare-rapida-iphone-android",
    title: "Ghid complet: încărcare rapidă pentru iPhone și Android",
    excerpt:
      "De la PD la PPS, de la Lightning la USB-C — tot ce trebuie să știi pentru a încărca iPhone-ul și telefonul Android la viteza maximă sigură.",
    metaTitle: "Ghid încărcare rapidă iPhone și Android | NOVRA",
    metaDescription:
      "Încărcare rapidă iPhone și Android: protocoale PD, PPS, Quick Charge, wați recomandați, cabluri și greșeli de evitat. Ghid practic NOVRA.",
    coverImageUrl: "/products/adaptoare/violet.png",
    published: true,
    categories: ["Ghiduri", "Încărcare rapidă"],
    tags: ["iphone", "android", "fast-charge", "lightning", "usb-c"],
    content: `Încărcarea rapidă a evoluat de la un „nice to have" la o necesitate — telefoanele moderne au baterii de 4.000–5.000 mAh care ar dura ore întregi la 5W. Dar **„fast charge" pe etichetă nu garantează viteza reală**. Iată cum obții performanța maximă pe iPhone și Android.

## iPhone: Lightning și USB-C

**Modele cu Lightning (iPhone 14 și anterioare):**
- Încărcare rapidă de la 20W în sus cu adaptor USB-C PD + cablu MFi USB-C la Lightning.
- NOVRA AppleCharge Pro oferă PD optimizat pentru ecosistemul Apple.
- Plafon practic: ~27W pe iPhone 14 Pro; diferența 20W vs 30W este mică după 50%.

**Modele cu USB-C (iPhone 15+):**
- PD 3.0 nativ — cablu USB-C la USB-C de calitate, minimum 30W adaptor.
- iPhone 15 Pro atinge ~27W; iPhone 16 Pro până la ~30W în anumite condiții.

**Sfat NOVRA:** Folosește un încărcător GaN 65W — alimentează iPhone-ul la maxim și are rezervă pentru iPad sau AirPods simultan.

## Android: PD, PPS și Quick Charge

**Google Pixel și Motorola** — PD pur, de obicei 18–30W. Un cablu USB-C 100W și adaptor 30W+ sunt suficienți.

**Samsung Galaxy** — PPS (Programmable Power Supply) pentru Super Fast Charging 2.0 (45W pe S24 Ultra). Verifică că adaptorul suportă explicit PPS, nu doar PD fix.

**Xiaomi / OPPO / OnePlus** — Protocoale proprietare (HyperCharge, SUPERVOOC) la 67W–120W cu adaptorul din cutie. Pentru încărcare universală în călătorii, PD 30W funcționează dar nu la viteza maximă proprietară.

**Huawei** — SCP proprietar; cross-compatibilitate limitată.

## Combinația câștigătoare

- **iPhone Lightning** — Adaptor GaN 30–65W PD + cablu NOVRA USB-C la Lightning PD
- **iPhone USB-C** — Adaptor GaN 30–65W PD + cablu NOVRA UltraCharge 100W
- **Samsung flagship** — Adaptor 45W PPS + PD + cablu NOVRA UltraCharge 100W
- **Pixel / universal** — Adaptor GaN 30W PD + cablu NOVRA Hybrid sau UltraCharge

## Greșeli care îți încetinesc încărcarea

- Wireless charging ca metodă principală — 2–3× mai lent și mai cald.
- Cablu USB 2.0 subțire pentru „încărcare only" — limitează negocierea PD.
- Încărcare la 100% constantă — 20–80% este intervalul optim pentru viteză și sănătatea bateriei.
- Temperaturi extreme — scoate husa în încărcare intensă vara.

## Încărcare noaptea: e sigur?

Da, cu PD modern. Telefonul reduce curentul după 80%, iar încărcătorii GaN quality intră în standby eficient. Activează Optimized Battery Charging (iOS) sau Adaptive Charging (Android) pentru longevitate.

## Concluzie

Indiferent de ecosistem, **triada adaptor PD + cablu certificat + port curat** este universal valabilă. NOVRA acoperă atât Lightning cât și USB-C cu aceeași filozofie: putere declarată reală, materiale premium, compatibilitate largă. Investește o dată corect și uită de „se încarcă greu" timp de ani.`,
  },
  {
    slug: "prelungesti-viata-bateriei-incarcator-corect",
    title: "Cum îți prelungești viața bateriei cu încărcătorul corect",
    excerpt:
      "Bateria nu moare peste noapte — se degradează din mii de cicluri și căldură. Alege încărcătorul și cablul potrivit pentru a păstra capacitatea maximă ani de zile.",
    metaTitle: "Prelungește viața bateriei cu încărcătorul corect | NOVRA",
    metaDescription:
      "Sfaturi practice pentru longevitatea bateriei: încărcătoare PD, căldură, cicluri, încărcare nocturnă și de ce calitatea cablului influențează sănătatea bateriei.",
    coverImageUrl: "/products/adaptoare/albastru.png",
    published: true,
    categories: ["Sfaturi", "Baterie"],
    tags: ["baterie", "longevitate", "incarcator", "pd"],
    content: `Capacitatea bateriei tale scade inevitabil — dar viteza acestei scăderi depinde în mare măsură de **cum și cu ce încarci**. Un încărcător inadecvat sau un cablu de proastă calitate pot accelera degradarea mai mult decât utilizarea intensivă în sine.

## Cum funcționează degradarea

Bateriile Li-ion se degradează prin:
- **Cicluri complete** (0% → 100%) — fiecare ciclu reduce capacitatea cu o fracțiune de procent.
- **Căldură** — inamicul numărul unu; peste 40°C chimia internă accelerează.
- **Tensiune maximă prelungită** — staționarea la 100% ore întregi stresează celulele.
- **Curenți instabili** — cabluri și surse slabe provoacă fluctuații care suprasolicită controllerul BMS.

După 500 de cicluri bine gestionați, poți păstra 85–90% capacitate. După 500 de cicluri cu încărcare haotică, 75% nu este neobișnuit.

## Rolul încărcătorului corect

Un încărcător **USB Power Delivery certificat** comunică exact cu dispozitivul. Telefonul cere 9V/3A, primește 9V/3A stabil — nu 12V forțat sau 5V fluctuant. Stabilitatea reduce stresul asupra BMS-ului (Battery Management System).

**Încărcătoarele GaN** (Gallium Nitride) sunt mai eficiente termic — mai puțină căldură disipată în încărcător și în dispozitiv. NOVRA GaN Nova 65W este proiectat pentru sesiuni lungi fără supraîncălzire.

## De ce contează și cablul

Un cablu subdimensionat creează **cădere de tensiune** pe lungime. Dispozitivul detectează tensiune scăzută și poate crește curentul compensator — generând căldură localizată la port și în celulele apropiate de conector.

Cablurile NOVRA cu E-Mark mențin integritatea semnalului PD pe toată lungimea, chiar și la 100W. Rezistența internă mică înseamnă mai puțină energie pierdută ca heat.

## Obiceiuri care prelungesc viața bateriei

**1. Regula 20–80%** — Menține bateria între 20% și 80% în utilizarea zilnică. Încarcă complet doar înainte de călătorii lungi.

**2. Evită încărcarea în fundă** — Blochează disiparea căldurii. Dacă încarci noaptea, așază telefonul pe o suprafață rece, fără husă groasă.

**3. Folosește încărcare rapidă doar când ai nevoie** — PD 30W pentru urgențe; 18–20W pentru încărcare de rutină produce mai puțină căldură.

**4. Curăță portul periodic** — Praful crește rezistența de contact și generează arcing microscopic.

**5. Înlocuiește cablul la primele semne de uzură** — Împletirea expusă este un risc de scurtcircuit și fluctuații.

## Mitul „lăsat la priză strică bateria"

Parțial adevărat pe termen foarte lung. Telefoanele moderne opresc încărcarea activă la 100% și reiau la 99%. Problema reală este **căldura acumulată** dacă telefonul stă la soare sau pe o suprafață izolantă. Un încărcător eficient și ventilație bună minimizează riscul.

## Monitorizare și acțiune

Verifică sănătatea bateriei în Setări (iOS: Battery Health; Android: vary by OEM). Dacă capacitatea scade sub 80% în primii 2 ani, reevaluează sursa de alimentare și obiceiurile termice — nu da vina doar pe „bateria slabă".

## Mesajul NOVRA

Longevitatea bateriei nu ține de noroc — ține de **alegeri consistente**: sursă PD stabilă, cablu premium cu specificații reale, obiceiuri termice inteligente. Produsele NOVRA sunt proiectate nu doar pentru viteză, ci pentru încărcare sigură, predictibilă, zi de zi.`,
  },
  {
    slug: "novra-travelpack-ghid-complet",
    title: "NOVRA TravelPack: tot ce trebuie să știi despre bundle-ul Cablu + Adaptor",
    excerpt:
      "TravelPack Duo combină un încărcător GaN 65W cu un cablu premium împletit — un singur kit pentru birou, călătorii și cadou. Configurare culori, specificații și pentru cine este ideal.",
    metaTitle: "NOVRA TravelPack Duo — Ghid complet bundle | NOVRA",
    metaDescription:
      "Descoperă NOVRA TravelPack Duo: încărcător GaN 65W, cablu 100W, culori configurabile Violet/Blue/Roz. Specificații, scenarii de utilizare și comparație cu cumpărarea separată.",
    coverImageUrl: "/products/bundle/novra-bundle-preview.png",
    published: true,
    categories: ["Produse NOVRA", "Bundle"],
    tags: ["travelpack", "bundle", "gan", "cadou"],
    content: `**NOVRA TravelPack Duo** este răspunsul nostru la o întrebare simplă: de ce să cauți încărcător și cablu separat când poți avea un kit coerent, estetic și gata de drum? Bundle-ul combină tehnologia GaN de ultimă generație cu un cablu premium din gama NOVRA — într-un pachet configurabil pe culori.

## Ce conține TravelPack Duo

**Încărcător GaN Nova 65W**
- Tehnologie Gallium Nitride pentru dimensiuni reduse (comparabil cu un adaptor clasic de 20W).
- Un port USB-C cu Power Delivery 3.0 — suficient pentru MacBook Air, iPad Pro, iPhone și flagship-uri Android.
- Protecții integrate: supratensiune, supracurent, scurtcircuit, temperatură.

**Cablu premium NOVRA 100W**
- Nylon balistic împletit, conectori aluminiu anodizat.
- Cip E-Mark pentru PD până la 100W — compatibil cu laptopuri dacă extinzi setup-ul acasă.
- Disponibil în culorile NOVRA: Violet, Blue, Roz.

## Configurare independentă a culorilor

Spre deosebire de kituri fixe, TravelPack îți permite să alegi **culoarea adaptorului și a cablului independent**. Preferi adaptor Violet cu cablu Roz? Combinația este a ta. Paleta este aliniată cu restul catalogului NOVRA pentru un setup vizual coerent.

## Pentru cine este ideal

**Călători frecvenți** — Un singur adaptor compact înlocuiește încărcătoarele pentru telefon, tabletă și laptop ultrabook. Cablul împletit rezistă în rucsac fără împletire.

**Profesioniști la birou** — Design premium care se potrivește pe biroul de acasă sau în sala de ședințe. GaN 65W alimentează laptopul în timp ce telefonul se încarcă wireless separat.

**Cadou premium** — Ambalaj elegant, utilitate imediată, personalizare culori. Mai util decât un gadget de nișă, mai memorabil decât un voucher.

**Upgrade de la încărcătoare vechi** — Dacă încă folosești USB-A 12W din 2018, saltul la 65W PD este transformator.

## TravelPack vs cumpărare separată

- **Preț** — TravelPack oferă valoare bundle optimizată față de suma componentelor cumpărate separat
- **Estetică** — Culori coordonate din paleta NOVRA, fără combinații accidentale
- **Ambalaj** — Kit gata de cadou, spre deosebire de cutii individuale
- **Flexibilitate culori** — Alegi independent adaptorul și cablul, la fel ca la achiziția separată

## Scenarii de utilizare

**Zi de birou** — Adaptorul rămâne la priză; cablul merge cu tine la ședințe. 65W recuperă rapid procentele pierdute dimineața.

**Weekend city-break** — Un obiect în geantă în loc de trei. Trece fără probleme prin controlul de securitate.

**Setup dual** — Un TravelPack acasă, unul la birou. Cablurile colorate diferit evită confuzia „al cui e cablul?"

## Întrebări frecvente

*Pot încărca MacBook Pro 14"?* — Da, la 65W — suficient pentru utilizare și încărcare simultană; pentru încărcare maximă sub sarcină grea, recomandăm și UltraCharge 100W ca al doilea cablu.

*Este compatibil cu iPhone?* — Da, cu cablu USB-C la USB-C (iPhone 15+) sau USB-C la Lightning NOVRA (modele anterioare, achiziție separată).

*Ce primești în cutie?* — Încărcător GaN 65W, cablu premium configurat, documentație și garanție NOVRA.

## Concluzie

TravelPack Duo nu este doar un bundle — este **filosofia NOVRA condensată**: performanță reală, design premium, simplitate. Un kit, zero compromisuri, gata pentru orice zi sau orice destinație. [Vezi TravelPack în magazin](/produse/bundle-travel-pack).`,
  },
];
