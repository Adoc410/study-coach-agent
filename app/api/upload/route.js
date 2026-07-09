import { addDocument, getUserDocuments } from "@/app/lib/rag/knowledgeBase";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const userId = formData.get("userId");

    if (!file || !userId) {
      return Response.json({ error: "file and userId are required" }, { status: 400 });
    }

    const fileName = file.name;
    const fileType = fileName.split(".").pop().toLowerCase();
    let text = "";

    if (fileType === "txt") {
      text = await file.text();
    } else if (fileType === "pdf") {
      const buffer = await file.arrayBuffer();
      const pdfParse = (await import("pdf-parse")).default;
      const pdfData = await pdfParse(Buffer.from(buffer));
      text = pdfData.text;
    } else if (fileType === "docx") {
      const buffer = await file.arrayBuffer();
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
      text = result.value;
    } else {
      return Response.json(
        { error: "Unsupported file type. Please upload PDF, TXT, or DOCX files." },
        { status: 400 }
      );
    }

    if (!text || text.trim().length < 50) {
      return Response.json({ error: "Could not extract text from file. Please try a different file." }, { status: 400 });
    }

    const result = await addDocument(userId, text, fileName);
    const allDocs = getUserDocuments(userId);

    return Response.json({
      success: true,
      fileName,
      chunks: result.chunks,
      totalDocuments: allDocs.sources.length,
      totalChunks: allDocs.totalChunks,
      message: `Successfully processed "${fileName}" into ${result.chunks} searchable sections.`,
    });

  } catch (error) {
    console.error("[Upload Error]", error);
    return Response.json(
      { error: "Failed to process file. Please try again.", detail: error.message },
      { status: 500 }
    );
  }
}