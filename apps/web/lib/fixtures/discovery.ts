export type DiscoveryCard = {
  art: string;
  title: string;
  by: string;
  kind: string;
};

export const COMMUNITY_ITEMS: DiscoveryCard[] = [
  { art: "animal.lion", title: "The Lion of Tanzania", by: "Amani K.", kind: "Nature & Wildlife" },
  { art: "lesson.02.habitats", title: "Baobab at Sunset", by: "Neema M.", kind: "Our Environment" },
  { art: "animal.giraffe", title: "Giraffe in the Serengeti", by: "Baraka T.", kind: "Nature & Wildlife" },
  { art: "lesson.03.serengeti", title: "Zanzibar Dhow", by: "Zawadi A.", kind: "Culture & Heritage" },
  { art: "animal.elephant", title: "Mount Kilimanjaro", by: "Kito R.", kind: "Landforms & Geography" },
  { art: "lesson.04.protection", title: "My Tanzanian Village", by: "Rehema S.", kind: "Life in Tanzania" },
];

export const COMMUNITY_ARTISTS = [
  { art: "avatar.01", name: "Amani K." },
  { art: "avatar.05", name: "Neema M." },
  { art: "avatar.02", name: "Baraka T." },
  { art: "avatar.06", name: "Zawadi A." },
];

export const LIBRARY_ITEMS: DiscoveryCard[] = [
  { art: "animal.lion", title: "Tanzanian Lion", by: "Completed", kind: "Coloring" },
  { art: "animal.giraffe", title: "Giraffe in the Serengeti", by: "Completed", kind: "Coloring" },
  { art: "lesson.02.habitats", title: "Mount Kilimanjaro", by: "Completed", kind: "Lesson" },
  { art: "lesson.04.protection", title: "Tanzanian Drum Art", by: "Completed", kind: "Coloring" },
  { art: "animal.zebra", title: "Zebra at the Plains", by: "In progress · 50%", kind: "Coloring" },
  { art: "lesson.03.serengeti", title: "Zanzibar Dhow", by: "In progress · 75%", kind: "Lesson" },
  { art: "empty.library", title: "Baobab at Sunset", by: "Completed", kind: "Coloring" },
  { art: "lesson.01.meet-wildlife", title: "My Village Design", by: "Completed", kind: "Lesson" },
];
