import fs from "fs";
import path from "path";

const root = path.resolve(".");

const patch = {
  errorBoundary: {
    ro: {
      message:
        "Catalogul nu s-a încărcat complet. Reîmprospătează pagina sau folosește meniul de navigare.",
    },
    en: {
      message:
        "The catalog did not load completely. Refresh the page or use the navigation menu.",
    },
    de: {
      message:
        "Der Katalog wurde nicht vollständig geladen. Aktualisieren Sie die Seite oder nutzen Sie das Navigationsmenü.",
    },
  },
  subscribeModal: {
    ro: {
      title: "Abonează-te acum!",
      description: "Introdu emailul pentru noutăți și oferte exclusive în newsletter-ul NOVRA.",
      emailPlaceholder: "exemplu@email.com",
      subscribeAria: "Abonează-te",
      closeAria: "Închide",
      agreePrefix: "Continuând, accepți",
      termsLink: "Termenii de utilizare",
      and: "și",
      privacyLink: "Politica de confidențialitate",
      mustAgree: "Trebuie să accepți Termenii și Politica de confidențialitate.",
    },
    en: {
      title: "Subscribe now!",
      description: "Enter your email to receive the latest updates and special offers in our newsletter.",
      emailPlaceholder: "example@email.com",
      subscribeAria: "Subscribe",
      closeAria: "Close",
      agreePrefix: "By continuing, you agree to our",
      termsLink: "Terms of Use",
      and: "and",
      privacyLink: "Privacy Policy",
      mustAgree: "You must accept the Terms and Privacy Policy.",
    },
    de: {
      title: "Jetzt abonnieren!",
      description:
        "Geben Sie Ihre E-Mail ein, um Neuigkeiten und exklusive Angebote in unserem Newsletter zu erhalten.",
      emailPlaceholder: "beispiel@email.com",
      subscribeAria: "Abonnieren",
      closeAria: "Schließen",
      agreePrefix: "Mit dem Fortfahren akzeptieren Sie unsere",
      termsLink: "Nutzungsbedingungen",
      and: "und",
      privacyLink: "Datenschutzrichtlinie",
      mustAgree: "Sie müssen die AGB und Datenschutzrichtlinie akzeptieren.",
    },
  },
};

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key])
    ) {
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}

for (const locale of ["ro", "en", "de"]) {
  const filePath = path.join(root, "messages", `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  for (const [namespace, locales] of Object.entries(patch)) {
    if (!data[namespace]) data[namespace] = {};
    deepMerge(data[namespace], locales[locale]);
  }

  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

console.log("Merged base i18n patch.");
