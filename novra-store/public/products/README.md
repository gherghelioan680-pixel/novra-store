# Imagini produse NOVRA

Pune aici imaginile pentru cardurile de produs de pe homepage, pagina `/produse` și paginile de detaliu.

## Structura folderelor

| Folder | Categorie catalog | Produse |
|--------|-------------------|---------|
| `cabluri/` | Cabluri (`usb-c`) | Cabluri USB-C, USB-A → USB-C |
| `adaptoare/` | Adaptoare (`lightning`) | Cabluri Lightning, adaptoare |
| `bundle/` | Cablu + Adaptor (`accesorii`) | Pachete încărcător + cablu |

## Convenție de denumire

Format recomandat: `novra-{slug-produs}-{varianta}.jpg`

Exemple:

```
cabluri/novra-ultracharge-100w.jpg
cabluri/novra-hyperpower-240w.jpg
cabluri/novra-hybrid-100w.jpg
adaptoare/novra-applecharge-pro-violet.jpg
adaptoare/novra-lightning-classic-blue.jpg
adaptoare/novra-flexlink-nova-roz.jpg
bundle/novra-gan-nova-65w.jpg
bundle/novra-drivespeed-45w.jpg
bundle/novra-travelpack-duo.jpg
```

## Mapare în catalog

Fișierele sunt mapate în `src/lib/catalog.ts` prin câmpul `imageSrc`, folosind ID-ul produsului:

| ID produs | Cale imagine |
|-----------|--------------|
| `usb-c-100w` | `/products/cabluri/novra-ultracharge-100w.jpg` |
| `usb-c-pro-240w` | `/products/cabluri/novra-hyperpower-240w.jpg` |
| `usb-a-c-100w` | `/products/cabluri/novra-hybrid-100w.jpg` |
| `usb-c-lightning-pd` | `/products/adaptoare/novra-applecharge-pro-violet.jpg` |
| `usb-a-lightning-classic` | `/products/adaptoare/novra-lightning-classic-blue.jpg` |
| `usb-c-lightning-flex` | `/products/adaptoare/novra-flexlink-nova-roz.jpg` |
| `incarcator-gan-65w` | `/products/bundle/novra-gan-nova-65w.jpg` |
| `incarcator-auto-metal` | `/products/bundle/novra-drivespeed-45w.jpg` |
| `bundle-travel-pack` | `/products/bundle/novra-travelpack-duo.jpg` |

## Formate acceptate

- `.jpg` / `.jpeg` (recomandat)
- `.webp`
- `.png`

Rezoluție recomandată: **800×800 px**, fundal transparent sau dark, raport 1:1.

## Placeholder

Dacă fișierul lipsește, site-ul afișează automat un placeholder din `placeholders/` (per categorie).
