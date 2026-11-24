/*
  Seed the Tanzania Wildlife demo pack (0.14).
  Run: node scripts/seed-demo-lessons.js
  Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local.
*/
require("dotenv").config({ path: ".env.local" });

if (process.env.APP_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "1") {
  console.error("Refusing to seed demo data with APP_ENV=production (set ALLOW_DEMO_SEED=1 to override).");
  process.exit(1);
}


const U = process.env.SUPABASE_URL;
const K = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: K, Authorization: `Bearer ${K}`, "Content-Type": "application/json" };

async function req(path, method = "GET", body, prefer) {
  const res = await fetch(`${U}${path}`, {
    method,
    headers: prefer ? { ...H, Prefer: prefer } : H,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

const slide = (image, text) => ({
  type: "slide",
  title: "Slide",
  guide: { image, text, narration: text },
  hints: [{ tier: 1, text: "Look at the picture and listen to the story." }],
});

const check = (prompt, image, options) => ({
  type: "knowledge-check",
  title: "Quick check",
  guide: { questions: [{ prompt, image, options }] },
  rubric: { threshold: 0.6 },
  hints: [{ tier: 1, text: "Think about where the animal lives." }],
});

const match = {
  type: "match-pairs",
  title: "Match the animal",
  guide: {
    items: [
      { id: "lion", label: "Lion", image: "/art/animal/animal.lion-640.webp" },
      { id: "zebra", label: "Zebra", image: "/art/animal/animal.zebra-640.webp" },
      { id: "flamingo", label: "Flamingo", image: "/art/animal/animal.flamingo-640.webp" },
    ],
    targets: [
      { id: "grassland", label: "Grassland" },
      { id: "lake", label: "Lake" },
      { id: "forest", label: "Forest" },
    ],
    answers: { lion: "grassland", zebra: "grassland", flamingo: "lake" },
  },
  rubric: { threshold: 1 },
  hints: [{ tier: 1, text: "Lions and zebras live on open grassland." }],
};

const fill = {
  type: "area-fill",
  title: "Color the habitat",
  guide: { templateId: "amazing-animals", targetColor: "#D9A441" },
  rubric: { threshold: 0.8, coverageThreshold: 0.85 },
  hints: [{ tier: 1, text: "Fill the grass with warm ochre." }],
};

const stroke = {
  type: "stroke-path",
  title: "Trace the path",
  guide: { path: [{ x: 120, y: 300 }, { x: 480, y: 180 }] },
  rubric: { threshold: 0.65 },
  hints: [{ tier: 1, text: "Follow the line slowly." }],
};

const reward = {
  type: "reward",
  title: "Lesson complete",
  guide: {
    items: ["Met three animals", "Matched animals to habitats", "Answered the quiz"],
    badge: "badge.first-lesson",
  },
};

const lessons = [
  { id: "lesson_amazing_01", title: "Meet Tanzania's Wildlife", minutes: 8, steps: [
    slide("/art/scene/lesson.01.meet-wildlife-1024.webp", "Giraffes and zebras share the savanna."),
    match,
    check("Which animal has the longest neck?", "/art/animal/animal.giraffe-640.webp",
      [{ label: "Zebra", correct: false }, { label: "Giraffe", correct: true }, { label: "Elephant", correct: false }]),
  ]},
  { id: "lesson_amazing_02", title: "Homes in the Wild", minutes: 10, steps: [
    slide("/art/scene/lesson.02.habitats-1024.webp", "Grassland, lake and forest are all habitats."),
    fill,
    check("Where do flamingos live?", "/art/animal/animal.flamingo-640.webp",
      [{ label: "Lake", correct: true }, { label: "Forest", correct: false }, { label: "Desert", correct: false }]),
  ]},
  { id: "lesson_amazing_03", title: "Life in the Serengeti", minutes: 10, steps: [
    slide("/art/scene/lesson.03.serengeti-1024.webp", "Wildebeest and zebra cross the plains together."),
    stroke,
    check("What do wildebeest cross?", "/art/animal/animal.zebra-640.webp",
      [{ label: "The plains", correct: true }, { label: "The ocean", correct: false }, { label: "The city", correct: false }]),
  ]},
  { id: "lesson_amazing_04", title: "Protecting Our Animals", minutes: 8, steps: [
    slide("/art/scene/lesson.04.protection-1024.webp", "Rangers and families plant trees to protect wildlife."),
    match,
    check("Who helps protect wildlife?", "/art/scene/lesson.04.protection-1024.webp",
      [{ label: "Rangers", correct: true }, { label: "Nobody", correct: false }, { label: "Only tourists", correct: false }]),
  ]},
  { id: "lesson_amazing_05", title: "Be a Wildlife Hero", minutes: 6, steps: [
    slide("/art/scene/lesson.05.wildlife-hero-1024.webp", "You can help wildlife too."),
    stroke,
    reward,
  ]},
];

(async () => {
  const users = (await req("/auth/v1/admin/users?per_page=50")).users || [];
  const admin = users.find((u) => u.email === "admin@lucid.com");
  const parent = users.find((u) => u.email === "parent@lucid.com");
  const child = users.find((u) => u.email === "child@lucid.com");
  if (!admin || !parent || !child) throw new Error("demo accounts missing");

  const [pack] = await req(
    "/rest/v1/packs?on_conflict=slug",
    "POST",
    [{
      slug: "amazing-animals",
      title: "Amazing Animals of Tanzania",
      is_free: true,
      tags: ["Science", "Nature & Wildlife", "Tanzania"],
      objectives: ["Name five Tanzanian animals", "Match animals to habitats", "Explain one way to protect wildlife"],
    }],
    "resolution=merge-duplicates,return=representation",
  );

  const ids = lessons.map((l) => l.id);
  await req(`/rest/v1/pack_items?pack_id=eq.${pack.id}`, "DELETE");
  await req(`/rest/v1/lessons?id=in.(${ids.join(",")})`, "DELETE");

  for (const lesson of lessons) {
    await req("/rest/v1/lessons", "POST", [{
      id: lesson.id,
      title: lesson.title,
      owner_id: admin.id,
      status: "published",
      visibility: "catalog",
      skill_tag: "nature",
      est_minutes: lesson.minutes,
      locale: "en",
    }]);
    await req("/rest/v1/lesson_steps", "POST", lesson.steps.map((step, index) => ({
      id: `${lesson.id}_s${index + 1}`,
      lesson_id: lesson.id,
      order_index: index,
      type: step.type,
      title: step.title ?? null,
      guide: step.guide ?? null,
      rubric: step.rubric ?? null,
      hints: step.hints ?? null,
    })));
  }

  await req("/rest/v1/pack_items", "POST", lessons.map((lesson, index) => ({
    pack_id: pack.id,
    kind: "lesson",
    ref_id: lesson.id,
    position: index,
  })));

  let [profile] = await req(`/rest/v1/child_profiles?auth_user_id=eq.${child.id}&select=*`);
  if (!profile) {
    [profile] = await req("/rest/v1/child_profiles", "POST", [{
      nickname: "Amani",
      auth_user_id: child.id,
      birthdate: "2017-06-15",
      learning_interests: ["Nature & Wildlife"],
    }], "return=representation");
  }
  await req("/rest/v1/child_guardians?on_conflict=child_profile_id,guardian_id", "POST", [{
    child_profile_id: profile.id,
    guardian_id: parent.id,
    role: "owner",
  }], "resolution=merge-duplicates");
  const assigned = await req(
    `/rest/v1/child_pack_assignments?child_profile_id=eq.${profile.id}&pack_id=eq.${pack.id}&select=id`,
  );
  if (!assigned.length) {
    await req("/rest/v1/child_pack_assignments", "POST", [{
      child_profile_id: profile.id,
      pack_id: pack.id,
      assigned_by: parent.id,
    }]);
  }

  console.log(`Seeded pack ${pack.id}: ${lessons.length} lessons, ${lessons.length * 3} steps, child profile ${profile.id}`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
