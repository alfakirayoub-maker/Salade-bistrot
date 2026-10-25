import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <p className="t-eyebrow text-leaf-deep">404</p>
        <h1 className="t-h1 mt-3">{t("title")}</h1>
        <Link href="/" className="btn btn-primary mt-6">
          {t("back")}
        </Link>
      </div>
    </main>
  );
}
