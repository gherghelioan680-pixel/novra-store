import type { NextRequest } from "next/server";
import { sendContactFormEmails } from "@/lib/email";
import { isEmailsEnabled } from "@/lib/emails-enabled";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    if (!name || !email || !subject || !message) {
      return Response.json({ ok: false, message: "Completează toate câmpurile." }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ ok: false, message: "Adresa de email este invalidă." }, { status: 400 });
    }

    if (!isEmailsEnabled()) {
      return Response.json(
        {
          ok: false,
          message: "Trimiterea mesajelor prin email nu este activă momentan. Contactează-ne la support@novra.ro.",
        },
        { status: 503 }
      );
    }

    const result = await sendContactFormEmails({ name, email, subject, message });

    if (!result.confirmationSent && !result.adminSent) {
      return Response.json(
        {
          ok: false,
          message: "Mesajul nu a putut fi trimis. Verifică setările SMTP și automatizările din Email Center.",
        },
        { status: 500 }
      );
    }

    return Response.json({
      ok: true,
      message: "Mesajul a fost trimis cu succes.",
      confirmationSent: result.confirmationSent,
      adminSent: result.adminSent,
    });
  } catch (error) {
    console.error("[contact] POST error:", error);
    return Response.json({ ok: false, message: "Eroare la trimiterea mesajului." }, { status: 500 });
  }
}
