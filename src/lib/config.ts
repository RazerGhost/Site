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
