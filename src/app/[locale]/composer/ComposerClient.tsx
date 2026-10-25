"use client";

import { useSearchParams } from "next/navigation";
import { Builder } from "@/components/builder/Builder";

export function ComposerClient() {
  const params = useSearchParams();
  const edit = params.get("modifier");
  // Remount when the edited line or chosen formula changes.
  return <Builder key={`${edit ?? ""}:${params.get("formule") ?? ""}`} initialFormulaId={params.get("formule")} editId={edit} />;
}
