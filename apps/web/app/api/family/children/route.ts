import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";
import { db } from "@/lib/db/server";
import { getValidatedImpersonation } from "@/lib/auth/impersonation";

export async function GET() {
  try {
    const auth = await requireApiUser();
    if (auth instanceof NextResponse) return auth;

    const payload = await getValidatedImpersonation();
    const adminView = Boolean(payload?.admin && payload.userId);
    const guardianId = adminView ? payload!.userId : auth.userId;

    const repo = adminView
      ? db.service()
      : db.user({ userId: auth.userId, role: auth.role });
    const children = await repo.family.childrenForGuardian(guardianId);

    return NextResponse.json({ children });
  } catch (error) {
    return NextResponse.json(
      { error: ((error as { message?: string } | null)?.message) ?? "Family lookup failed" },
      { status: 500 },
    );
  }
}
