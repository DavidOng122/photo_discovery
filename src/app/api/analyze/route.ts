import { NextResponse } from "next/server";
import { analyzeWalk } from "@/lib/ai/analyzeWalk";

async function fileToDataUrl(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return `data:${file.type || "image/jpeg"};base64,${buffer.toString("base64")}`;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("photos").filter((item): item is File => item instanceof File);

    if (!files.length) {
      return NextResponse.json({ error: { code: "INVALID_INPUT", message: "At least one photo is required." } }, { status: 400 });
    }

    const images = await Promise.all(
      files.map(async (file, index) => ({
        url: await fileToDataUrl(file),
        order: index + 1,
      }))
    );

    const result = await analyzeWalk({
      images,
      location: null,
      outputLanguage: "ja",
    });

    return NextResponse.json({
      features: result.tags.map((tag) => ({
        label: tag.label,
        type: tag.type,
        reason: tag.reason,
      })),
    });
  } catch (error: any) {
    console.error("Analyze route error:", error);
    return NextResponse.json({
      error: { code: "AI_ANALYSIS_FAILED", message: error?.message || "写真の分析に失敗しました。" },
    }, { status: 500 });
  }
}
