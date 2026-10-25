import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-leaf-deep">404</p>
        <h1 className="display mt-2 text-4xl">{t("title")}</h1>
        <Link href="/" className="mt-6 inline-flex h-12 items-center rounded-full bg-ink px-6 font-bold text-white">
          {t("back")}
        </Link>
      </div>
    </main>
  );
}
