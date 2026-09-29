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

    const discoveries = (result.data.discoveries && result.data.discoveries.length > 0)
      ? result.data.discoveries.map((d) => ({
          phrase: d.phrase,
          explanation: d.explanation,
        }))
      : result.data.tags.map((tag) => ({
          phrase: tag.label,
          explanation: tag.reason,
        }));

    return NextResponse.json({
      discoveries,
      features: discoveries.map((d) => ({
        label: d.phrase,
        type: "style" as const,
        reason: d.explanation,
      })),
    });
  } catch (error: unknown) {
    console.error("Analyze route error:", error);
    const message = error instanceof Error ? error.message : "写真の分析に失敗しました。";
    return NextResponse.json({
      error: { code: "AI_ANALYSIS_FAILED", message },
    }, { status: 500 });
  }
}
