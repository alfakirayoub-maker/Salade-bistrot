"use client";

import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import { sendMagicLink, type LoginState } from "@/app/admin/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(sendMagicLink, { status: "idle" });

  if (state.status === "sent") {
    return (
      <div role="status" className="card mt-6 p-5">
        <MailCheck size={28} className="text-leaf-deep" aria-hidden />
        <p className="t-title mt-3">Vérifiez votre boîte mail</p>
        <p className="t-small mt-1 text-ink-soft">
          Si <strong>{state.email}</strong> est une adresse autorisée, un lien de connexion vient d&apos;être envoyé. Ouvrez-le sur cet
          appareil. Pensez à regarder dans les spams.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="mt-6">
      <label className="block">
        <span className="t-label">Adresse e-mail</span>
        <input name="email" type="email" required autoComplete="email" inputMode="email" defaultValue={state.email} className="field" />
      </label>
      {state.status === "error" && (
        <p role="alert" className="t-small mt-2 text-red-700">
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-leaf mt-4 min-h-14 w-full disabled:opacity-60">
        {pending ? "Envoi…" : "Recevoir le lien de connexion"}
      </button>
    </form>
  );
}
