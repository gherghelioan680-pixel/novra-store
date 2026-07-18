import type { NextRequest } from "next/server";
import { sendReviewSubmissionEmails } from "@/lib/email";
import { isEmailsEnabled } from "@/lib/emails-enabled";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const rating = typeof body?.rating === "string" ? body.rating.trim() : "";
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    if (!name || !email || !rating || !message) {
      return Response.json({ ok: false, message: "Completează toate câmpurile." }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ ok: false, message: "Adresa de email este invalidă." }, { status: 400 });
    }

    if (!isEmailsEnabled()) {
      return Response.json(
        {
          ok: false,
          message: "Trimiterea recenziilor prin email nu este activă momentan. Contactează-ne la support@novra.ro.",
        },
        { status: 503 }
      );
    }

    const result = await sendReviewSubmissionEmails({ name, email, rating, message });

    if (!result.confirmationSent && !result.adminSent) {
      return Response.json(
        {
          ok: false,
          message: "Recenzia nu a putut fi trimisă. Verifică setările SMTP și automatizările din Email Center.",
        },
        { status: 500 }
      );
    }

    return Response.json({
      ok: true,
      message: "Recenzia a fost trimisă cu succes.",
      confirmationSent: result.confirmationSent,
      adminSent: result.adminSent,
    });
  } catch (error) {
    console.error("[ERROR] reviews/submit POST:", error);
    return Response.json({ ok: false, message: "Eroare la trimiterea recenziei." }, { status: 500 });
  }
}
