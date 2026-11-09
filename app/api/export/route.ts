import { NextResponse } from "next/server";
import { getExportSnapshot } from "@/db/export";
import { createSupabaseServerClient } from "@/db/server";

const EXPORT_ERROR = "Couldn't export your progress.";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getClaims();

    if (error) {
      console.error("Could not read the signed-in user for export.", error);
      return unauthorized();
    }

    const userId = data?.claims?.sub;

    if (typeof userId !== "string" || !userId) {
      return unauthorized();
    }

    const snapshot = await getExportSnapshot(supabase, userId);
    const filename = `vocamdy-export-${snapshot.exported_at.slice(0, 10)}.json`;

    return new NextResponse(JSON.stringify(snapshot, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (exportError) {
    console.error("Could not export progress.", exportError);
    return NextResponse.json({ error: EXPORT_ERROR }, { status: 500 });
  }
}
