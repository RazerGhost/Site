// Curated subset of lucide-svelte icons offered in the quick links icon
// picker (see QuickLinksModal.svelte) — not the full lucide set, just enough
// variety to cover common personal-dashboard destinations (dev tools,
// media, finance, productivity, social/web, misc). Keyed by the same
// kebab-case name lucide ships the icon under, so the stored `icon` value on
// a QuickLink is portable and self-describing rather than an opaque index.
import Code2 from '@lucide/svelte/icons/code-2';
import Terminal from '@lucide/svelte/icons/terminal';
import Database from '@lucide/svelte/icons/database';
import Server from '@lucide/svelte/icons/server';
import Cloud from '@lucide/svelte/icons/cloud';
import GitBranch from '@lucide/svelte/icons/git-branch';
import Cpu from '@lucide/svelte/icons/cpu';
import Mail from '@lucide/svelte/icons/mail';
import MessageCircle from '@lucide/svelte/icons/message-circle';
import Bell from '@lucide/svelte/icons/bell';
import Send from '@lucide/svelte/icons/send';
import Music from '@lucide/svelte/icons/music';
import Video from '@lucide/svelte/icons/video';
import ImageIcon from '@lucide/svelte/icons/image';
import Camera from '@lucide/svelte/icons/camera';
import Tv from '@lucide/svelte/icons/tv';
import Headphones from '@lucide/svelte/icons/headphones';
import Gamepad2 from '@lucide/svelte/icons/gamepad-2';
import Film from '@lucide/svelte/icons/film';
import Wallet from '@lucide/svelte/icons/wallet';
import CreditCard from '@lucide/svelte/icons/credit-card';
import Landmark from '@lucide/svelte/icons/landmark';
import ShoppingCart from '@lucide/svelte/icons/shopping-cart';
import Package from '@lucide/svelte/icons/package';
import Gift from '@lucide/svelte/icons/gift';
import Calendar from '@lucide/svelte/icons/calendar';
import ListTodo from '@lucide/svelte/icons/list-todo';
import Kanban from '@lucide/svelte/icons/kanban';
import Clock from '@lucide/svelte/icons/clock';
import Globe from '@lucide/svelte/icons/globe';
import Link2 from '@lucide/svelte/icons/link-2';
import Rss from '@lucide/svelte/icons/rss';
import Newspaper from '@lucide/svelte/icons/newspaper';
import Home from '@lucide/svelte/icons/home';
import User from '@lucide/svelte/icons/user';
import Users from '@lucide/svelte/icons/users';
import Heart from '@lucide/svelte/icons/heart';
import Star from '@lucide/svelte/icons/star';
import MapPin from '@lucide/svelte/icons/map-pin';
import Wrench from '@lucide/svelte/icons/wrench';
import type { Component } from 'svelte';

export const QUICK_LINK_ICONS: Record<string, Component> = {
	'code-2': Code2,
	terminal: Terminal,
	database: Database,
	server: Server,
	cloud: Cloud,
	'git-branch': GitBranch,
	cpu: Cpu,
	mail: Mail,
	'message-circle': MessageCircle,
	bell: Bell,
	send: Send,
	music: Music,
	video: Video,
	image: ImageIcon,
	camera: Camera,
	tv: Tv,
	headphones: Headphones,
	'gamepad-2': Gamepad2,
	film: Film,
	wallet: Wallet,
	'credit-card': CreditCard,
	landmark: Landmark,
	'shopping-cart': ShoppingCart,
	package: Package,
	gift: Gift,
	calendar: Calendar,
	'list-todo': ListTodo,
	kanban: Kanban,
	clock: Clock,
	globe: Globe,
	'link-2': Link2,
	rss: Rss,
	newspaper: Newspaper,
	home: Home,
	user: User,
	users: Users,
	heart: Heart,
	star: Star,
	'map-pin': MapPin,
	wrench: Wrench
};

export const QUICK_LINK_ICON_NAMES = Object.keys(QUICK_LINK_ICONS);
