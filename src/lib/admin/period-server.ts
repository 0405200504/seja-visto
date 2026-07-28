import { cookies } from "next/headers";
import { PERIOD_COOKIE, resolvePeriod, type Period } from "@/lib/admin/period";

/** Lê o período global no servidor (cookie, com override por searchParam). */
export async function getPeriod(searchParamValue?: string): Promise<Period> {
  if (searchParamValue) return resolvePeriod(searchParamValue);
  const store = await cookies();
  return resolvePeriod(store.get(PERIOD_COOKIE)?.value);
}
