export async function POST(request) {
  try {
    const { pin } = await request.json();

    if (!pin || typeof pin !== "string") {
      return Response.json({ valid: false, error: "PIN is required." }, { status: 400 });
    }

    const teacherPin = process.env.TEACHER_PIN;

    if (!teacherPin) {
      console.error("[Auth] TEACHER_PIN is not set in .env.local");
      return Response.json({ valid: false, error: "Teacher PIN is not configured on the server." }, { status: 500 });
    }

    const valid = pin.trim() === teacherPin.trim();

    return Response.json({ valid });

  } catch (err) {
    console.error("[Auth Error]", err);
    return Response.json({ valid: false, error: "Internal server error." }, { status: 500 });
  }
}