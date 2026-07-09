export async function POST(request) {
  try {
    const { prompt } = await request.json();

    if (!prompt?.trim()) {
      return Response.json({ error: "Prompt is required." }, { status: 400 });
    }

    const cleanPrompt = prompt.trim();

    // Build Pollinations.ai URL — no API key needed, completely free
    const encoded = encodeURIComponent(cleanPrompt);
    const width   = 1024;
    const height  = 768;
    const seed    = Math.floor(Math.random() * 1000000);

    const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=true`;

    // Fetch the image server-side to avoid browser CORS issues
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      throw new Error(`Pollinations.ai returned status ${imgRes.status}. Please try again.`);
    }

    const buffer     = await imgRes.arrayBuffer();
    const base64     = Buffer.from(buffer).toString("base64");
    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
    const dataUrl    = `data:${contentType};base64,${base64}`;

    return Response.json({
      url:   dataUrl,
      model: "Pollinations AI (free)",
    });

  } catch (err) {
    console.error("[Image Gen Error]", err);
    return Response.json(
      { error: err.message || "Image generation failed. Please try again." },
      { status: 500 }
    );
  }
}