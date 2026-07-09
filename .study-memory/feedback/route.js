const feedbackStore = [];

export async function POST(request) {
  try {
    const body = await request.json();
    const { messageIndex, rating, messageContent, agentType, userId, topic } = body;

    if (!rating || !["up", "down"].includes(rating)) {
      return Response.json({ error: "rating must be 'up' or 'down'" }, { status: 400 });
    }

    const entry = {
      id: `feedback_${Date.now()}`,
      messageIndex,
      rating,
      agentType: agentType || "GENERAL",
      topic: topic || "unknown",
      userId: userId || "anonymous",
      messagePreview: messageContent?.slice(0, 100) || "",
      timestamp: new Date().toISOString(),
    };

    feedbackStore.push(entry);
    console.log(`[Feedback] ${rating === "up" ? "👍" : "👎"} | Agent: ${entry.agentType} | Topic: ${entry.topic}`);

    const totalUp = feedbackStore.filter(f => f.rating === "up").length;
    const totalDown = feedbackStore.filter(f => f.rating === "down").length;
    const total = feedbackStore.length;
    const satisfactionRate = total > 0 ? Math.round((totalUp / total) * 100) : 0;

    return Response.json({
      success: true,
      message: rating === "up" ? "Thanks for the positive feedback!" : "Thanks — we'll use this to improve.",
      stats: { totalUp, totalDown, total, satisfactionRate },
    });

  } catch (error) {
    console.error("[Feedback Error]", error);
    return Response.json({ error: "Failed to save feedback." }, { status: 500 });
  }
}

export async function GET() {
  const totalUp = feedbackStore.filter(f => f.rating === "up").length;
  const totalDown = feedbackStore.filter(f => f.rating === "down").length;
  const total = feedbackStore.length;

  const byAgent = {};
  for (const f of feedbackStore) {
    if (!byAgent[f.agentType]) byAgent[f.agentType] = { up: 0, down: 0 };
    byAgent[f.agentType][f.rating]++;
  }

  return Response.json({
    total, totalUp, totalDown,
    satisfactionRate: total > 0 ? Math.round((totalUp / total) * 100) : 0,
    byAgent,
    recentFeedback: feedbackStore.slice(-10).reverse(),
  });
}