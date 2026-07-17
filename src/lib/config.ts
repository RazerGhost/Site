export const site = {
  name: "RazerGhost",
  tagline: "working on the most random things",
  url: "https://razerghost.xyz",
  description: "Personal link hub and devlog.",
  githubUsername: "RazerGhost",
  // Discord user ID (not secret — Discord IDs are public), used by Lanyard
  // (https://github.com/Phineas/lanyard) to show live presence. For this to
  // return data, this Discord account must have joined Lanyard's Discord
  // server (discord.gg/lanyard) at least once.
  discordUserId:
    "425729668482859008"
};

export const socialLinks = [
  {
    label: "GitHub",
    href: "https://github.com/RazerGhost",
    icon: "github" as const,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/dimitri-eleazar-de-jong/",
    icon: "linkedin" as const,
  },
  {
    label: "Email",
    href: "contact@rg-digital.dev",
    icon: "mail" as const,
  },
];

export const navLinks = [
  { label: "Projects", href: "/projects" },
  { label: "Devlog", href: "/devlog" },
  { label: "Status", href: "/status" },
  { label: "Gear", href: "/gear" },
];

// Comments on devlog posts, via giscus (https://giscus.app) — backed by
// GitHub Discussions on this repo. Not secret (same "public identifier"
// status as discordUserId above), so it lives here rather than in an env
// var. Comments.svelte renders nothing until repoId/categoryId are filled in.
//
// One-time setup (repo admin):
// 1. Enable Discussions on https://github.com/RazerGhost/Site
//    (repo Settings → Features → Discussions)
// 2. Visit https://giscus.app, enter the repo, pick a discussion category
//    (e.g. "General" or a dedicated "Comments" category), and copy the
//    repoId/categoryId values it generates into this object.
export const giscus = {
  repo: "RazerGhost/Site" as const,
  repoId: "",
  category: "General",
  categoryId: "",
};

export function giscusConfigured(): boolean {
  return Boolean(giscus.repoId && giscus.categoryId);
}
