/**
 * Uganda National Curriculum
 * Based on Uganda National Examinations Board (UNEB) and National Curriculum Development Centre (NCDC)
 * Covers O-Level (S1–S4) and A-Level (S5–S6)
 */

export const UGANDA_CURRICULUM = {
  levels: {
    primary: { label: "Primary (P1–P7)", grades: ["P1","P2","P3","P4","P5","P6","P7"] },
    olevel:  { label: "O-Level (S1–S4)", grades: ["S1","S2","S3","S4"] },
    alevel:  { label: "A-Level (S5–S6)", grades: ["S5","S6"] },
  },

  subjects: {
    mathematics: {
      label: "Mathematics",
      icon: "📐",
      olevel: {
        terms: [
          {
            term: 1,
            label: "Term 1",
            topics: [
              { id: "math-s1-t1-1", title: "Sets and Set Notation", grade: "S1" },
              { id: "math-s1-t1-2", title: "Natural Numbers and Integers", grade: "S1" },
              { id: "math-s1-t1-3", title: "Fractions and Decimals", grade: "S1" },
              { id: "math-s2-t1-1", title: "Algebra – Expressions and Equations", grade: "S2" },
              { id: "math-s3-t1-1", title: "Quadratic Equations", grade: "S3" },
              { id: "math-s4-t1-1", title: "Matrices and Transformations", grade: "S4" },
            ],
          },
          {
            term: 2,
            label: "Term 2",
            topics: [
              { id: "math-s1-t2-1", title: "Geometry – Lines and Angles", grade: "S1" },
              { id: "math-s2-t2-1", title: "Ratio, Proportion and Percentage", grade: "S2" },
              { id: "math-s3-t2-1", title: "Trigonometry", grade: "S3" },
              { id: "math-s4-t2-1", title: "Statistics and Probability", grade: "S4" },
            ],
          },
          {
            term: 3,
            label: "Term 3",
            topics: [
              { id: "math-s1-t3-1", title: "Mensuration – Area and Volume", grade: "S1" },
              { id: "math-s2-t3-1", title: "Graphs and Functions", grade: "S2" },
              { id: "math-s3-t3-1", title: "Vectors", grade: "S3" },
              { id: "math-s4-t3-1", title: "Calculus – Differentiation", grade: "S4" },
            ],
          },
        ],
      },
    },

    english: {
      label: "English Language",
      icon: "📖",
      olevel: {
        terms: [
          {
            term: 1,
            label: "Term 1",
            topics: [
              { id: "eng-s1-t1-1", title: "Reading Comprehension", grade: "S1" },
              { id: "eng-s1-t1-2", title: "Parts of Speech", grade: "S1" },
              { id: "eng-s2-t1-1", title: "Essay Writing – Narrative", grade: "S2" },
              { id: "eng-s3-t1-1", title: "Summary Writing", grade: "S3" },
              { id: "eng-s4-t1-1", title: "Report and Letter Writing", grade: "S4" },
            ],
          },
          {
            term: 2,
            label: "Term 2",
            topics: [
              { id: "eng-s1-t2-1", title: "Sentence Structure and Punctuation", grade: "S1" },
              { id: "eng-s2-t2-1", title: "Descriptive Writing", grade: "S2" },
              { id: "eng-s3-t2-1", title: "Oral Literature", grade: "S3" },
              { id: "eng-s4-t2-1", title: "Advanced Comprehension and Analysis", grade: "S4" },
            ],
          },
          {
            term: 3,
            label: "Term 3",
            topics: [
              { id: "eng-s1-t3-1", title: "Vocabulary Building", grade: "S1" },
              { id: "eng-s2-t3-1", title: "Argumentative Writing", grade: "S2" },
              { id: "eng-s3-t3-1", title: "Drama and Poetry", grade: "S3" },
              { id: "eng-s4-t3-1", title: "Revision – UNEB Past Papers", grade: "S4" },
            ],
          },
        ],
      },
    },

    biology: {
      label: "Biology",
      icon: "🧬",
      olevel: {
        terms: [
          {
            term: 1,
            label: "Term 1",
            topics: [
              { id: "bio-s1-t1-1", title: "Cell Structure and Organisation", grade: "S1" },
              { id: "bio-s2-t1-1", title: "Nutrition in Plants and Animals", grade: "S2" },
              { id: "bio-s3-t1-1", title: "Respiration", grade: "S3" },
              { id: "bio-s4-t1-1", title: "Genetics and Heredity", grade: "S4" },
            ],
          },
          {
            term: 2,
            label: "Term 2",
            topics: [
              { id: "bio-s1-t2-1", title: "Classification of Living Things", grade: "S1" },
              { id: "bio-s2-t2-1", title: "Transport in Plants and Animals", grade: "S2" },
              { id: "bio-s3-t2-1", title: "Reproduction", grade: "S3" },
              { id: "bio-s4-t2-1", title: "Ecology and Environment", grade: "S4" },
            ],
          },
          {
            term: 3,
            label: "Term 3",
            topics: [
              { id: "bio-s1-t3-1", title: "Photosynthesis", grade: "S1" },
              { id: "bio-s2-t3-1", title: "Excretion", grade: "S2" },
              { id: "bio-s3-t3-1", title: "Coordination and Response", grade: "S3" },
              { id: "bio-s4-t3-1", title: "Evolution and Adaptation", grade: "S4" },
            ],
          },
        ],
      },
    },

    chemistry: {
      label: "Chemistry",
      icon: "⚗️",
      olevel: {
        terms: [
          {
            term: 1,
            label: "Term 1",
            topics: [
              { id: "chem-s1-t1-1", title: "Separation Techniques", grade: "S1" },
              { id: "chem-s2-t1-1", title: "Atomic Structure", grade: "S2" },
              { id: "chem-s3-t1-1", title: "Chemical Bonding", grade: "S3" },
              { id: "chem-s4-t1-1", title: "Organic Chemistry", grade: "S4" },
            ],
          },
          {
            term: 2,
            label: "Term 2",
            topics: [
              { id: "chem-s1-t2-1", title: "States of Matter", grade: "S1" },
              { id: "chem-s2-t2-1", title: "The Periodic Table", grade: "S2" },
              { id: "chem-s3-t2-1", title: "Acids, Bases and Salts", grade: "S3" },
              { id: "chem-s4-t2-1", title: "Electrochemistry", grade: "S4" },
            ],
          },
          {
            term: 3,
            label: "Term 3",
            topics: [
              { id: "chem-s1-t3-1", title: "Introduction to Chemical Reactions", grade: "S1" },
              { id: "chem-s2-t3-1", title: "Stoichiometry and Mole Concept", grade: "S2" },
              { id: "chem-s3-t3-1", title: "Energetics", grade: "S3" },
              { id: "chem-s4-t3-1", title: "Industrial Chemistry", grade: "S4" },
            ],
          },
        ],
      },
    },

    physics: {
      label: "Physics",
      icon: "⚡",
      olevel: {
        terms: [
          {
            term: 1,
            label: "Term 1",
            topics: [
              { id: "phy-s1-t1-1", title: "Measurements and Units", grade: "S1" },
              { id: "phy-s2-t1-1", title: "Forces and Motion", grade: "S2" },
              { id: "phy-s3-t1-1", title: "Electricity – Current and Circuits", grade: "S3" },
              { id: "phy-s4-t1-1", title: "Nuclear Physics", grade: "S4" },
            ],
          },
          {
            term: 2,
            label: "Term 2",
            topics: [
              { id: "phy-s1-t2-1", title: "Light and Optics", grade: "S1" },
              { id: "phy-s2-t2-1", title: "Energy, Work and Power", grade: "S2" },
              { id: "phy-s3-t2-1", title: "Magnetism and Electromagnetism", grade: "S3" },
              { id: "phy-s4-t2-1", title: "Electronics", grade: "S4" },
            ],
          },
          {
            term: 3,
            label: "Term 3",
            topics: [
              { id: "phy-s1-t3-1", title: "Sound and Waves", grade: "S1" },
              { id: "phy-s2-t3-1", title: "Heat and Temperature", grade: "S2" },
              { id: "phy-s3-t3-1", title: "Waves and Electromagnetic Spectrum", grade: "S3" },
              { id: "phy-s4-t3-1", title: "Revision – UNEB Past Papers", grade: "S4" },
            ],
          },
        ],
      },
    },

    history: {
      label: "History",
      icon: "🏛️",
      olevel: {
        terms: [
          {
            term: 1,
            label: "Term 1",
            topics: [
              { id: "hist-s1-t1-1", title: "Early History of East Africa", grade: "S1" },
              { id: "hist-s2-t1-1", title: "Kingdoms of Uganda", grade: "S2" },
              { id: "hist-s3-t1-1", title: "Colonialism in East Africa", grade: "S3" },
              { id: "hist-s4-t1-1", title: "Independence Movements", grade: "S4" },
            ],
          },
          {
            term: 2,
            label: "Term 2",
            topics: [
              { id: "hist-s1-t2-1", title: "The Slave Trade", grade: "S1" },
              { id: "hist-s2-t2-1", title: "Missionaries and Their Impact", grade: "S2" },
              { id: "hist-s3-t2-1", title: "World War I and Its Effects on Africa", grade: "S3" },
              { id: "hist-s4-t2-1", title: "Post-Independence Uganda", grade: "S4" },
            ],
          },
          {
            term: 3,
            label: "Term 3",
            topics: [
              { id: "hist-s1-t3-1", title: "Trade Routes and Commerce", grade: "S1" },
              { id: "hist-s2-t3-1", title: "The Berlin Conference", grade: "S2" },
              { id: "hist-s3-t3-1", title: "World War II and Africa", grade: "S3" },
              { id: "hist-s4-t3-1", title: "The OAU and African Unity", grade: "S4" },
            ],
          },
        ],
      },
    },

    geography: {
      label: "Geography",
      icon: "🌍",
      olevel: {
        terms: [
          {
            term: 1,
            label: "Term 1",
            topics: [
              { id: "geo-s1-t1-1", title: "Maps and Map Reading", grade: "S1" },
              { id: "geo-s2-t1-1", title: "Weather and Climate", grade: "S2" },
              { id: "geo-s3-t1-1", title: "Population and Settlement", grade: "S3" },
              { id: "geo-s4-t1-1", title: "Agriculture and Food Production", grade: "S4" },
            ],
          },
          {
            term: 2,
            label: "Term 2",
            topics: [
              { id: "geo-s1-t2-1", title: "Landforms and Landscape", grade: "S1" },
              { id: "geo-s2-t2-1", title: "Soils and Vegetation", grade: "S2" },
              { id: "geo-s3-t2-1", title: "Natural Resources of East Africa", grade: "S3" },
              { id: "geo-s4-t2-1", title: "Transport and Trade", grade: "S4" },
            ],
          },
          {
            term: 3,
            label: "Term 3",
            topics: [
              { id: "geo-s1-t3-1", title: "Rivers and Lakes of Uganda", grade: "S1" },
              { id: "geo-s2-t3-1", title: "Environmental Issues", grade: "S2" },
              { id: "geo-s3-t3-1", title: "Industrialisation in East Africa", grade: "S3" },
              { id: "geo-s4-t3-1", title: "Globalisation and Its Effects", grade: "S4" },
            ],
          },
        ],
      },
    },

    ict: {
      label: "ICT",
      icon: "💻",
      olevel: {
        terms: [
          {
            term: 1,
            label: "Term 1",
            topics: [
              { id: "ict-s1-t1-1", title: "Introduction to Computers", grade: "S1" },
              { id: "ict-s2-t1-1", title: "Word Processing", grade: "S2" },
              { id: "ict-s3-t1-1", title: "Spreadsheets", grade: "S3" },
              { id: "ict-s4-t1-1", title: "Database Management", grade: "S4" },
            ],
          },
          {
            term: 2,
            label: "Term 2",
            topics: [
              { id: "ict-s1-t2-1", title: "The Internet and Email", grade: "S1" },
              { id: "ict-s2-t2-1", title: "Presentation Software", grade: "S2" },
              { id: "ict-s3-t2-1", title: "Programming Basics", grade: "S3" },
              { id: "ict-s4-t2-1", title: "Networking", grade: "S4" },
            ],
          },
          {
            term: 3,
            label: "Term 3",
            topics: [
              { id: "ict-s1-t3-1", title: "Computer Safety and Ethics", grade: "S1" },
              { id: "ict-s2-t3-1", title: "Digital Citizenship", grade: "S2" },
              { id: "ict-s3-t3-1", title: "Web Design Basics", grade: "S3" },
              { id: "ict-s4-t3-1", title: "ICT in Business", grade: "S4" },
            ],
          },
        ],
      },
    },
  },
};

/**
 * Returns all topics for a given subject and grade
 */
export function getTopicsForGrade(subjectKey, grade) {
  const subject = UGANDA_CURRICULUM.subjects[subjectKey];
  if (!subject?.olevel?.terms) return [];
  const all = [];
  for (const term of subject.olevel.terms) {
    for (const topic of term.topics) {
      if (!grade || topic.grade === grade) {
        all.push({ ...topic, term: term.term, termLabel: term.label });
      }
    }
  }
  return all;
}

/**
 * Returns a flat list of all subjects with their icons
 */
export function getAllSubjects() {
  return Object.entries(UGANDA_CURRICULUM.subjects).map(([key, val]) => ({
    key,
    label: val.label,
    icon: val.icon,
  }));
}
