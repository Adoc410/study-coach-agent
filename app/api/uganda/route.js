import { queryUgandaSources, getUgandaCurriculumInfo, UGANDA_LEVELS } from "@/lib/api/uganda/sources";

export async function POST(request) {
  try {
    const body = await request.json();
    const { query, subject, level } = body;

    if (!query) {
      return Response.json({ error: "query is required" }, { status: 400 });
    }

    const curriculumInfo = subject && level
      ? getUgandaCurriculumInfo(subject, level)
      : null;

    const result = await queryUgandaSources(query);

    return Response.json({
      answer: result.answer,
      sourcesChecked: result.sourcesChecked,
      liveDataFetched: result.liveDataFetched,
      relevantLinks: result.relevantLinks,
      curriculumInfo,
      ugandaLevels: UGANDA_LEVELS,
    });

  } catch (error) {
    console.error("[Uganda Sources Error]", error);
    return Response.json(
      { error: "Failed to fetch Uganda education content. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  return Response.json({
    sources: {
      UNEB: { name: "Uganda National Examinations Board", url: "https://www.uneb.ac.ug", description: "Past papers, marking guides, examiners reports" },
      NCDC: { name: "National Curriculum Development Centre", url: "https://www.ncdc.go.ug", description: "Official syllabi for all levels" },
      MOES: { name: "Ministry of Education and Sports", url: "https://www.education.go.ug", description: "Education policy and approved textbooks" },
    },
    levels: UGANDA_LEVELS,
  });
}