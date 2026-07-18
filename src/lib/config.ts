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

// Trackers linked from the Watchlist page rather than the site-wide social
// links, since they're only relevant in that context.
export const watchProfiles = [
  {
    label: "Simkl",
    href: "https://simkl.com/8788331/",
    icon: "simkl" as const,
  },
  {
    label: "MyDramaList",
    href: "https://mydramalist.com/profile/RazerGhost",
    icon: "mydramalist" as const,
  },
  {
    label: "MyAnimeList",
    href: "https://myanimelist.net/profile/RazerGhost",
    icon: "myanimelist" as const,
  },
];

export const gearGroups = [
  {
    label: "Editor",
    icon: "code" as const,
    items: ["Zed", "Claude Code"],
  },
  {
    label: "Stack",
    icon: "layers" as const,
    items: ["SvelteKit", "TypeScript", "Tailwind CSS", "Node.js"],
  },
  {
    label: "Daily Tools",
    icon: "wrench" as const,
    items: [
      "Zen Browser",
      "Windows",
      "Windows Terminal",
      "Tabby",
      "PowerShell",
      "Figma",
      "Affinity",
      "DaVinci Resolve",
      "Proton Mail",
      "Proton Pass",
      "Proton Drive",
      "Proton VPN",
      "Discord",
      "WhatsApp",
    ],
  },
  {
    label: "Desktop",
    icon: "cpu" as const,
    items: [
      "AMD Ryzen 7 7800X3D",
      "Gigabyte RTX 3070 Eagle OC",
      "AOC 24G1WG4 (24\")",
      "Dell P2414H (24\")",
    ],
  },
  {
    label: "Peripherals",
    icon: "keyboard" as const,
    items: ["Keychron K10 HE Wireless", "Keychron M6 8K"],
  },
  {
    label: "Audio",
    icon: "headphones" as const,
    items: ["Elgato Wave:3 MK.2", "Simgot EW300 DSP"],
  },
  {
    label: "Sim & Gaming",
    icon: "gamepad" as const,
    items: ["MOZA R3 Racing Kit", "GameSir Xbox Controller", "Steam Controller"],
  },
  {
    label: "Streaming",
    icon: "video" as const,
    items: ["Elgato Stream Deck MK.1"],
  },
];

export const navLinks = [
  { label: "Projects", href: "/projects" },
  { label: "Devlog", href: "/devlog" },
  { label: "Status", href: "/status" },
  { label: "Gear", href: "/gear" },
  { label: "Watchlist", href: "/watchlist" },
];
