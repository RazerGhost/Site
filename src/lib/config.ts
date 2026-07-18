export const site = {
  name: "RazerGhost",
  tagline: "working on the most random things",
  url: "https://razerghost.xyz",
  description: "Personal link hub and devlog.",
  githubUsername: "RazerGhost",
  // Numeric GitHub user ID (immutable, unlike the username) — this is what
  // auth actually checks against, so a future username change/reclaim can't
  // let someone else in. From https://api.github.com/users/RazerGhost.
  githubUserId: 90572937,
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
    icon: "github",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/dimitri-eleazar-de-jong/",
    icon: "linkedin",
  },
  {
    label: "Email",
    href: "contact@rg-digital.dev",
    icon: "mail",
  },
];

// Trackers linked from the Watchlist page rather than the site-wide social
// links, since they're only relevant in that context.
export const watchProfiles = [
  {
    label: "Simkl",
    href: "https://simkl.com/8788331/",
    icon: "simkl",
  },
  {
    label: "MyDramaList",
    href: "https://mydramalist.com/profile/RazerGhost",
    icon: "mydramalist",
  },
  {
    label: "MyAnimeList",
    href: "https://myanimelist.net/profile/RazerGhost",
    icon: "myanimelist",
  },
];

export type GearItem = { name: string; note?: string; href?: string };

type GearIcon =
  | "code"
  | "layers"
  | "wrench"
  | "cpu"
  | "keyboard"
  | "headphones"
  | "gamepad"
  | "video";

export const gearGroups: { label: string; icon: GearIcon; items: GearItem[] }[] = [
  {
    label: "Editor",
    icon: "code",
    items: [
      { name: "Zed", href: "https://zed.dev" },
      { name: "Claude Code", href: "https://claude.com/product/claude-code" },
    ],
  },
  {
    label: "Stack",
    icon: "layers",
    items: [
      { name: "SvelteKit", href: "https://svelte.dev/docs/kit" },
      { name: "TypeScript", href: "https://www.typescriptlang.org" },
      { name: "Tailwind CSS", href: "https://tailwindcss.com" },
      { name: "Node.js", href: "https://nodejs.org" },
    ],
  },
  {
    label: "Daily Tools",
    icon: "wrench",
    items: [
      { name: "Zen Browser", href: "https://zen-browser.app" },
      { name: "Windows", href: "https://www.microsoft.com/windows" },
      { name: "Windows Terminal", href: "https://github.com/microsoft/terminal" },
      { name: "Tabby", href: "https://tabby.sh" },
      { name: "PowerShell", href: "https://learn.microsoft.com/powershell" },
      { name: "Figma", href: "https://www.figma.com" },
      { name: "Affinity", href: "https://affinity.serif.com" },
      {
        name: "DaVinci Resolve",
        href: "https://www.blackmagicdesign.com/products/davinciresolve",
      },
      { name: "Proton Mail", href: "https://proton.me/mail" },
      { name: "Proton Pass", href: "https://proton.me/pass" },
      { name: "Proton Drive", href: "https://proton.me/drive" },
      { name: "Proton VPN", href: "https://protonvpn.com" },
      { name: "Discord", href: "https://discord.com" },
      { name: "WhatsApp", href: "https://www.whatsapp.com" },
    ],
  },
  {
    label: "Desktop",
    icon: "cpu",
    items: [
      {
        name: "AMD Ryzen 7 7800X3D",
        href: "https://www.amd.com/en/products/processors/desktops/ryzen/7000-series/amd-ryzen-7-7800x3d.html",
      },
      {
        name: "Gigabyte RTX 3070 Eagle OC",
        href: "https://www.gigabyte.com/Graphics-Card/GV-N3070EAGLE-OC-8GD-rev-20",
      },
      { name: "AOC 24G1WG4 (24\")" },
      { name: "Dell P2414H (24\")" },
    ],
  },
  {
    label: "Peripherals",
    icon: "keyboard",
    items: [
      {
        name: "Keychron K10 HE Wireless",
        href: "https://www.keychron.com/products/keychron-k10-he-wireless-magnetic-switch-keyboard",
      },
      { name: "Keychron M6 8K", href: "https://www.keychron.com/products/keychron-m6-wireless-mouse" },
    ],
  },
  {
    label: "Audio",
    icon: "headphones",
    items: [
      { name: "Elgato Wave:3 MK.2", href: "https://www.elgato.com/us/en/p/wave-3" },
      { name: "Simgot EW300 DSP", href: "https://www.linsoul.com/products/simgot-ew300?variant=45798828277977" },
    ],
  },
  {
    label: "Sim & Gaming",
    icon: "gamepad",
    items: [
      { name: "MOZA R3 Racing Kit", href: "https://mozaracing.com/pages/r3-racing-bundle" },
      {
        name: "GameSir G7 Pro (Shadow Ember)",
        href: "https://gamesir.com/products/gamesir-g7-pro",
      },
      { name: "Steam Controller", href: "https://store.steampowered.com/hardware/steamcontroller" },
    ],
  },
  {
    label: "Streaming",
    icon: "video",
    items: [{ name: "Elgato Stream Deck MK.1", href: "https://www.elgato.com/us/en/p/stream-deck" }],
  },
];

export const navLinks = [
  { label: "Projects", href: "/projects" },
  { label: "Devlog", href: "/devlog" },
  { label: "Gear", href: "/gear" },
  { label: "Watchlist", href: "/watchlist" },
  { label: "Listens", href: "/listens" },
];
