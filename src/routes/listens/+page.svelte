<script lang="ts">
    import Seo from "$lib/components/Seo.svelte";
    import ListeningNowCard from "$lib/components/ListeningNowCard.svelte";
    import Music from "@lucide/svelte/icons/music";
    import Search from "@lucide/svelte/icons/search";
    import X from "@lucide/svelte/icons/x";
    import { reveal } from "$lib/actions/reveal";
    import { goto } from "$app/navigation";
    import { fly } from "svelte/transition";
    import { albumArt } from "$lib/stores/album-art.svelte";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    const WEEKDAY_NAMES = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ];

    const listenTime = $derived.by(() => {
        const totalMinutes = data.stats.totalMsPlayed / 60000;
        const days = Math.floor(totalMinutes / (60 * 24));
        const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
        const minutes = Math.round(totalMinutes % 60);
        return { days, hours, minutes };
    });

    function formatDate(iso: string | null): string {
        if (!iso) return "—";
        return new Date(iso).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }

    function trackHref(spotifyUri: string | null): string | null {
        if (!spotifyUri) return null;
        const id = spotifyUri.split(":").pop();
        return id ? `https://open.spotify.com/track/${id}` : null;
    }

    const maxArtistMs = $derived(
        Math.max(1, ...data.stats.topArtists.map((a) => a.msPlayed)),
    );
    const maxTrackPlays = $derived(
        Math.max(1, ...data.stats.topTracks.map((t) => t.plays)),
    );
    const maxAlbumMs = $derived(
        Math.max(1, ...data.topAlbums.map((a) => a.msPlayed)),
    );

    function selectYear(e: Event) {
        const value = (e.target as HTMLSelectElement).value;
        const params = new URLSearchParams(location.search);
        // "all" needs its own explicit value in the URL — deleting the param
        // entirely would make it indistinguishable from a fresh /listens load
        // with no selection yet, which the server defaults to the latest year.
        params.set("year", value);
        goto(`?${params.toString()}`, {
            keepFocus: true,
            noScroll: true,
            invalidateAll: true,
        });
    }

    // --- Calendar heatmap ---
    const heatmapWeeks = $derived.by(() => {
        if (!data.heatmap.length || data.selectedYear == null) return [];
        const byDate = new Map(data.heatmap.map((d) => [d.date, d.plays]));
        const maxPlays = Math.max(1, ...data.heatmap.map((d) => d.plays));
        const start = new Date(Date.UTC(data.selectedYear, 0, 1));
        const startPad = start.getUTCDay();
        const end = new Date(Date.UTC(data.selectedYear, 11, 31));
        const days: { date: string; plays: number; level: number }[] = [];
        for (let i = 0; i < startPad; i++)
            days.push({ date: "", plays: 0, level: -1 });
        for (
            let d = new Date(start);
            d <= end;
            d.setUTCDate(d.getUTCDate() + 1)
        ) {
            const key = d.toISOString().slice(0, 10);
            const plays = byDate.get(key) ?? 0;
            const level =
                plays === 0
                    ? 0
                    : Math.min(4, Math.ceil((plays / maxPlays) * 4));
            days.push({ date: key, plays, level });
        }
        const weeks: { date: string; plays: number; level: number }[][] = [];
        for (let i = 0; i < days.length; i += 7)
            weeks.push(days.slice(i, i + 7));
        return weeks;
    });

    // --- Hourly listening clock ---
    const maxHourly = $derived(Math.max(1, ...data.hourly.map((h) => h.plays)));
    const hourlyByHour = $derived.by(() => {
        const byHour = new Map(data.hourly.map((h) => [h.hour, h.plays]));
        return Array.from({ length: 24 }, (_, hour) => byHour.get(hour) ?? 0);
    });

    // --- Monthly trend ---
    const MONTH_NAMES = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    function formatMonth(month: string): string {
        const [y, m] = month.split("-").map(Number);
        return `${MONTH_NAMES[m - 1]} ${y}`;
    }
    const monthlyBars = $derived.by(() => {
        const byMonth = new Map(data.monthlyTrend.map((m) => [m.month, m]));
        let months: string[];
        if (data.selectedYear != null) {
            months = Array.from(
                { length: 12 },
                (_, i) => `${data.selectedYear}-${String(i + 1).padStart(2, "0")}`,
            );
        } else {
            const keys = data.monthlyTrend.map((m) => m.month);
            if (!keys.length) return [];
            months = [];
            let [y, m] = keys[0].split("-").map(Number);
            const [ly, lm] = keys[keys.length - 1].split("-").map(Number);
            while (y < ly || (y === ly && m <= lm)) {
                months.push(`${y}-${String(m).padStart(2, "0")}`);
                m++;
                if (m > 12) {
                    m = 1;
                    y++;
                }
            }
        }
        return months.map((month) => ({
            month,
            plays: byMonth.get(month)?.plays ?? 0,
        }));
    });
    const maxMonthly = $derived(
        Math.max(1, ...monthlyBars.map((m) => m.plays)),
    );

    // --- Search ---
    type SearchResult = {
        track: string;
        artist: string;
        album: string | null;
        plays: number;
        spotifyUri: string | null;
    };

    let query = $state("");
    let searchResults = $state<SearchResult[]>([]);
    let searching = $state(false);
    let searchedFor = $state("");
    let searchTimeout: ReturnType<typeof setTimeout>;

    function onSearchInput() {
        clearTimeout(searchTimeout);
        const q = query.trim();
        if (q.length < 2) {
            searching = false;
            searchResults = [];
            searchedFor = "";
            return;
        }
        searching = true;
        searchTimeout = setTimeout(async () => {
            try {
                const res = await fetch(
                    `/api/listening/search?q=${encodeURIComponent(q)}`,
                );
                const body = await res.json();
                // A newer keystroke may have superseded this request while it
                // was in flight — never overwrite fresher results with stale ones.
                if (q !== query.trim()) return;
                searchResults = body.results ?? [];
                searchedFor = q;
            } catch {
                if (q !== query.trim()) return;
                searchResults = [];
                searchedFor = q;
            } finally {
                if (q === query.trim()) searching = false;
            }
        }, 250);
    }

    function clearSearch() {
        query = "";
        searchResults = [];
        searchedFor = "";
        searching = false;
    }

    function onSearchKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") clearSearch();
    }

    // --- Artist drill-down ---
    let expandedArtist = $state<string | null>(null);
    let artistTracks = $state<
        { track: string; plays: number; spotifyUri: string | null }[]
    >([]);

    async function toggleArtist(artist: string) {
        if (expandedArtist === artist) {
            expandedArtist = null;
            return;
        }
        expandedArtist = artist;
        artistTracks = [];
        try {
            const res = await fetch(
                `/api/listening/artist?artist=${encodeURIComponent(artist)}`,
            );
            const body = await res.json();
            // Ignore a slow response for an artist that's no longer the one
            // expanded — rapid clicks would otherwise show the wrong tracks.
            if (expandedArtist !== artist) return;
            artistTracks = body.tracks ?? [];
        } catch {
            // Row just stays empty — nothing worse to do here.
        }
    }
</script>

<Seo
    title="Listens — RazerGhost"
    description="What I've been listening to on Spotify, built from my own extended streaming history export."
    path="/listens"
/>

<main class="mx-auto max-w-6xl px-6 py-16">
    <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
            <h1
                class="text-3xl font-extrabold tracking-tight text-white"
                data-hero-reveal="0"
            >
                Listens
            </h1>
            <p class="mt-2 text-gray" data-hero-reveal="1">
                My Spotify listening history, imported from my own data export —
                not a live feed, just everything I've listened to so far.
            </p>
        </div>

        {#if data.configured && data.years.length > 1}
            <label class="flex items-center gap-2 text-sm text-dim">
                Year
                <select
                    class="rounded-md border border-border bg-surface px-2 py-1.5 text-white"
                    value={data.selectedYear ?? "all"}
                    onchange={selectYear}
                >
                    <option value="all">All time</option>
                    {#each data.years as y}
                        <option value={y}>{y}</option>
                    {/each}
                </select>
            </label>
        {/if}
    </div>

    {#if !data.configured}
        <p class="mt-10 flex items-center gap-2 text-sm text-dim">
            <Music size={15} aria-hidden="true" /> No listening history imported yet.
        </p>
    {:else}
        <div class="mt-6">
            <ListeningNowCard />
        </div>

        <div class="mt-6" use:reveal>
            <div class="relative">
                <Search
                    size={15}
                    class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-dim"
                    aria-hidden="true"
                />
                <input
                    type="search"
                    placeholder="Search your listening history…"
                    class="w-full rounded-lg border border-border bg-surface py-2 pr-9 pl-9 text-sm text-white placeholder:text-dim focus:border-primary focus:outline-none"
                    bind:value={query}
                    oninput={onSearchInput}
                    onkeydown={onSearchKeydown}
                />
                {#if query}
                    <button
                        type="button"
                        aria-label="Clear search"
                        onclick={clearSearch}
                        class="absolute top-1/2 right-3 -translate-y-1/2 text-dim hover:text-white"
                    >
                        <X size={15} aria-hidden="true" />
                    </button>
                {/if}
            </div>

            {#if searching}
                <p class="mt-4 text-xs text-dim">Searching…</p>
            {:else if searchedFor && !searchResults.length}
                <p class="mt-4 text-xs text-dim">
                    No plays match "{searchedFor}".
                </p>
            {:else if searchResults.length}
                <div
                    class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                >
                    {#each searchResults as r, i (r.spotifyUri ?? r.track + r.artist)}
                        {@const href = trackHref(r.spotifyUri)}
                        {@const art = albumArt(r.spotifyUri)}
                        <a
                            {href}
                            target={href ? "_blank" : undefined}
                            rel="noreferrer"
                            in:fly={{ y: 8, duration: 200, delay: i * 20 }}
                            class="group flex flex-col gap-2 rounded-lg border border-border bg-surface p-3 transition-colors hover:border-primary hover:bg-surface-2"
                        >
                            <div
                                class="relative aspect-square w-full overflow-hidden rounded-md bg-surface-2"
                            >
                                {#if art}
                                    <img
                                        src={art}
                                        alt=""
                                        class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                    />
                                {:else}
                                    <div
                                        class="flex h-full w-full items-center justify-center"
                                    >
                                        <Music
                                            size={20}
                                            class="text-dim"
                                            aria-hidden="true"
                                        />
                                    </div>
                                {/if}
                            </div>
                            <div class="min-w-0">
                                <p
                                    class="truncate text-sm font-medium text-white group-hover:text-primary"
                                >
                                    {r.track}
                                </p>
                                <p class="truncate text-xs text-dim">{r.artist}</p>
                            </div>
                            <p class="text-xs text-dim">
                                {r.plays} play{r.plays === 1 ? "" : "s"}
                            </p>
                        </a>
                    {/each}
                </div>
            {/if}
        </div>

        <div
            class="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
        >
            <div
                class="flex h-full flex-col rounded-lg border border-border p-5 sm:p-6"
                use:reveal
            >
                <p class="text-xs font-medium uppercase tracking-wide text-dim">
                    Spent listening
                </p>
                <p class="mt-2 flex items-baseline gap-1.5 text-white">
                    <span class="text-4xl font-extrabold sm:text-5xl"
                        >{listenTime.days}</span
                    >
                    <span class="text-sm text-dim">d</span>
                    <span class="text-4xl font-extrabold sm:text-5xl"
                        >{listenTime.hours}</span
                    >
                    <span class="text-sm text-dim">h</span>
                    <span class="text-4xl font-extrabold sm:text-5xl"
                        >{listenTime.minutes}</span
                    >
                    <span class="text-sm text-dim">m</span>
                </p>

                <div
                    class="mt-5 grid grid-cols-3 gap-4 border-t border-border pt-5 text-center"
                >
                    <div>
                        <p class="text-xl font-bold text-white">
                            {data.stats.totalPlays.toLocaleString()}
                        </p>
                        <p class="mt-0.5 text-xs text-dim">Total plays</p>
                    </div>
                    <div>
                        <p class="text-xl font-bold text-white">
                            {data.stats.peakYear ?? "—"}
                        </p>
                        <p class="mt-0.5 text-xs text-dim">Peak year</p>
                    </div>
                    <div>
                        <p class="text-xl font-bold text-white">
                            {data.stats.peakWeekday != null
                                ? WEEKDAY_NAMES[data.stats.peakWeekday]
                                : "—"}
                        </p>
                        <p class="mt-0.5 text-xs text-dim">Most active day</p>
                    </div>
                </div>

                <div
                    class="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 text-center"
                >
                    <div>
                        <p class="text-xl font-bold text-white">
                            {formatDate(data.stats.firstPlayedAt)}
                        </p>
                        <p class="mt-0.5 text-xs text-dim">Earliest play</p>
                    </div>
                    <div>
                        <p class="text-xl font-bold text-white">
                            {formatDate(data.stats.lastPlayedAt)}
                        </p>
                        <p class="mt-0.5 text-xs text-dim">Most recent play</p>
                    </div>
                </div>

                {#if data.skipShuffle.skipRate != null || data.skipShuffle.shuffleRate != null}
                    <div
                        class="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 text-center"
                    >
                        <div>
                            <p class="text-xl font-bold text-white">
                                {data.skipShuffle.skipRate != null
                                    ? `${Math.round(data.skipShuffle.skipRate)}%`
                                    : "—"}
                            </p>
                            <p class="mt-0.5 text-xs text-dim">Skip rate</p>
                        </div>
                        <div>
                            <p class="text-xl font-bold text-white">
                                {data.skipShuffle.shuffleRate != null
                                    ? `${Math.round(data.skipShuffle.shuffleRate)}%`
                                    : "—"}
                            </p>
                            <p class="mt-0.5 text-xs text-dim">Shuffle plays</p>
                        </div>
                    </div>
                {/if}

                {#if data.streaks.longest || data.streaks.current}
                    <div
                        class="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 text-center"
                    >
                        <div>
                            <p class="text-xl font-bold text-white">
                                {data.streaks.longest
                                    ? `${data.streaks.longest.days} day${data.streaks.longest.days === 1 ? "" : "s"}`
                                    : "—"}
                            </p>
                            <p class="mt-0.5 text-xs text-dim">Longest streak</p>
                        </div>
                        <div>
                            <p class="text-xl font-bold text-white">
                                {data.streaks.current
                                    ? `${data.streaks.current.days} day${data.streaks.current.days === 1 ? "" : "s"}`
                                    : "—"}
                            </p>
                            <p class="mt-0.5 text-xs text-dim">Current streak</p>
                        </div>
                    </div>
                {/if}

                {#if hourlyByHour.some((n) => n > 0)}
                    <div
                        class="mt-5 flex flex-1 flex-col justify-center border-t border-border pt-5"
                    >
                        <p
                            class="text-xs font-medium uppercase tracking-wide text-dim"
                        >
                            Listening clock
                        </p>
                        <div class="mt-3 flex h-16 items-end gap-[3px]">
                            {#each hourlyByHour as plays, hour}
                                <div
                                    class="flex-1 rounded-sm bg-primary/70"
                                    style:height="{Math.max(
                                        4,
                                        (plays / maxHourly) * 100,
                                    )}%"
                                    title="{hour}:00 — {plays} plays"
                                ></div>
                            {/each}
                        </div>
                        <div
                            class="mt-1 flex justify-between text-[10px] text-dim"
                        >
                            <span>12am</span>
                            <span>12pm</span>
                            <span>11pm</span>
                        </div>
                    </div>
                {/if}
            </div>

            <div class="flex flex-col gap-4">
                {#if data.stats.topArtists.length}
                    <div
                        class="rounded-lg border border-border p-5 sm:p-6"
                        use:reveal
                    >
                        <p
                            class="text-xs font-medium uppercase tracking-wide text-dim"
                        >
                            Top artists
                        </p>
                        <ul class="mt-4 flex flex-col gap-3">
                            {#each data.stats.topArtists as artist}
                                {@const art = albumArt(artist.spotifyUri)}
                                <li>
                                    <button
                                        type="button"
                                        class="flex w-full items-center gap-3 text-left"
                                        onclick={() =>
                                            toggleArtist(artist.artist)}
                                    >
                                        <div
                                            class="h-9 w-9 shrink-0 overflow-hidden rounded-md bg-surface-2"
                                        >
                                            {#if art}
                                                <img
                                                    src={art}
                                                    alt=""
                                                    class="h-full w-full object-cover"
                                                />
                                            {:else}
                                                <div
                                                    class="flex h-full w-full items-center justify-center"
                                                >
                                                    <Music
                                                        size={14}
                                                        class="text-dim"
                                                        aria-hidden="true"
                                                    />
                                                </div>
                                            {/if}
                                        </div>
                                        <div class="min-w-0 flex-1">
                                            <div
                                                class="flex items-center justify-between text-sm"
                                            >
                                                <span
                                                    class="truncate text-white hover:text-primary"
                                                    >{artist.artist}</span
                                                >
                                                <span
                                                    class="ml-3 shrink-0 text-dim"
                                                    >{artist.plays} plays</span
                                                >
                                            </div>
                                            <div
                                                class="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2"
                                            >
                                                <div
                                                    class="h-full rounded-full bg-primary"
                                                    style="width: {(artist.msPlayed /
                                                        maxArtistMs) *
                                                        100}%"
                                                ></div>
                                            </div>
                                        </div>
                                    </button>
                                    {#if expandedArtist === artist.artist}
                                        <ul
                                            class="mt-2 ml-3 flex flex-col gap-1.5 border-l border-border pl-3"
                                        >
                                            {#each artistTracks as t}
                                                {@const href = trackHref(
                                                    t.spotifyUri,
                                                )}
                                                <li
                                                    class="flex items-center justify-between text-xs"
                                                >
                                                    {#if href}
                                                        <a
                                                            {href}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            class="link truncate text-gray hover:text-primary"
                                                            >{t.track}</a
                                                        >
                                                    {:else}
                                                        <span
                                                            class="truncate text-gray"
                                                            >{t.track}</span
                                                        >
                                                    {/if}
                                                    <span
                                                        class="shrink-0 text-dim"
                                                        >{t.plays}</span
                                                    >
                                                </li>
                                            {/each}
                                        </ul>
                                    {/if}
                                </li>
                            {/each}
                        </ul>
                    </div>
                {/if}

                {#if data.stats.topTracks.length}
                    <div
                        class="rounded-lg border border-border p-5 sm:p-6"
                        use:reveal
                    >
                        <p
                            class="text-xs font-medium uppercase tracking-wide text-dim"
                        >
                            Top tracks
                        </p>
                        <ul class="mt-4 flex flex-col gap-3">
                            {#each data.stats.topTracks as track}
                                {@const href = trackHref(track.spotifyUri)}
                                {@const art = albumArt(track.spotifyUri)}
                                <li class="flex items-center gap-3">
                                    <div
                                        class="h-9 w-9 shrink-0 overflow-hidden rounded-md bg-surface-2"
                                    >
                                        {#if art}
                                            <img
                                                src={art}
                                                alt=""
                                                class="h-full w-full object-cover"
                                            />
                                        {:else}
                                            <div
                                                class="flex h-full w-full items-center justify-center"
                                            >
                                                <Music
                                                    size={14}
                                                    class="text-dim"
                                                    aria-hidden="true"
                                                />
                                            </div>
                                        {/if}
                                    </div>
                                    <div class="min-w-0 flex-1">
                                        <div
                                            class="flex items-center justify-between text-sm"
                                        >
                                            <span
                                                class="min-w-0 flex-1 truncate text-white"
                                            >
                                                {#if href}
                                                    <a
                                                        {href}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        class="link hover:text-primary"
                                                        >{track.track}</a
                                                    >
                                                {:else}
                                                    {track.track}
                                                {/if}
                                                <span class="text-dim">
                                                    — {track.artist}</span
                                                >
                                            </span>
                                            <span
                                                class="ml-3 shrink-0 text-dim"
                                                >{track.plays}</span
                                            >
                                        </div>
                                        <div
                                            class="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2"
                                        >
                                            <div
                                                class="h-full rounded-full bg-primary"
                                                style="width: {(track.plays /
                                                    maxTrackPlays) *
                                                    100}%"
                                            ></div>
                                        </div>
                                    </div>
                                </li>
                            {/each}
                        </ul>
                    </div>
                {/if}

            </div>
        </div>

        {#if data.topAlbums.length || data.discoveries.length}
            <div
                class="mt-4 grid grid-cols-1 gap-4"
                class:md:grid-cols-2={data.topAlbums.length && data.discoveries.length}
            >
                {#if data.topAlbums.length}
                    <div
                        class="rounded-lg border border-border p-5 sm:p-6"
                        use:reveal
                    >
                        <p
                            class="text-xs font-medium uppercase tracking-wide text-dim"
                        >
                            Top albums
                        </p>
                        <ul class="mt-4 flex flex-col gap-3">
                            {#each data.topAlbums as album}
                                {@const art = albumArt(album.spotifyUri)}
                                <li class="flex items-center gap-3">
                                    <div
                                        class="h-9 w-9 shrink-0 overflow-hidden rounded-md bg-surface-2"
                                    >
                                        {#if art}
                                            <img
                                                src={art}
                                                alt=""
                                                class="h-full w-full object-cover"
                                            />
                                        {:else}
                                            <div
                                                class="flex h-full w-full items-center justify-center"
                                            >
                                                <Music
                                                    size={14}
                                                    class="text-dim"
                                                    aria-hidden="true"
                                                />
                                            </div>
                                        {/if}
                                    </div>
                                    <div class="min-w-0 flex-1">
                                        <div
                                            class="flex items-center justify-between text-sm"
                                        >
                                            <span
                                                class="min-w-0 flex-1 truncate text-white"
                                            >
                                                {album.album}
                                                <span class="text-dim">
                                                    — {album.artist}</span
                                                >
                                            </span>
                                            <span
                                                class="ml-3 shrink-0 text-dim"
                                                >{album.plays} plays</span
                                            >
                                        </div>
                                        <div
                                            class="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2"
                                        >
                                            <div
                                                class="h-full rounded-full bg-primary"
                                                style="width: {(album.msPlayed /
                                                    maxAlbumMs) *
                                                    100}%"
                                            ></div>
                                        </div>
                                    </div>
                                </li>
                            {/each}
                        </ul>
                    </div>
                {/if}

                {#if data.discoveries.length}
                    <div
                        class="rounded-lg border border-border p-5 sm:p-6"
                        use:reveal
                    >
                        <p
                            class="text-xs font-medium uppercase tracking-wide text-dim"
                        >
                            Discovered in {data.selectedYear}
                        </p>
                        <ul class="mt-4 flex flex-col gap-3">
                            {#each data.discoveries as discovery}
                                <li
                                    class="flex items-center justify-between gap-3 text-sm"
                                >
                                    <span class="min-w-0 flex-1 truncate text-white"
                                        >{discovery.artist}</span
                                    >
                                    <span class="shrink-0 text-dim">
                                        {formatDate(discovery.firstPlayedAt)}
                                    </span>
                                </li>
                            {/each}
                        </ul>
                    </div>
                {/if}
            </div>
        {/if}

        {#if monthlyBars.length}
            <div
                class="mt-4 rounded-lg border border-border p-5 sm:p-6"
                use:reveal
            >
                <p class="text-xs font-medium uppercase tracking-wide text-dim">
                    Monthly trend
                </p>
                <div class="mt-3 flex h-20 items-end gap-[3px] overflow-x-auto pb-1">
                    {#each monthlyBars as m}
                        <div
                            class="w-2 shrink-0 rounded-sm bg-primary/70"
                            style:height="{Math.max(
                                4,
                                (m.plays / maxMonthly) * 100,
                            )}%"
                            title="{formatMonth(m.month)} — {m.plays} plays"
                        ></div>
                    {/each}
                </div>
                <div class="mt-1 flex justify-between text-[10px] text-dim">
                    <span>{formatMonth(monthlyBars[0].month)}</span>
                    <span
                        >{formatMonth(
                            monthlyBars[monthlyBars.length - 1].month,
                        )}</span
                    >
                </div>
            </div>
        {/if}

        {#if heatmapWeeks.length}
            <div
                class="mt-4 rounded-lg border border-border p-5 sm:p-6"
                use:reveal
            >
                <p class="text-xs font-medium uppercase tracking-wide text-dim">
                    {data.selectedYear} activity
                </p>
                <div class="mt-3 flex gap-[3px] overflow-x-auto pb-1">
                    {#each heatmapWeeks as week}
                        <div class="flex flex-col gap-[3px]">
                            {#each week as day}
                                {#if day.level === -1}
                                    <div class="h-3 w-3"></div>
                                {:else}
                                    <div
                                        class="h-3 w-3 rounded-sm"
                                        class:bg-surface-2={day.level === 0}
                                        class:bg-primary={day.level > 0}
                                        style:opacity={day.level > 0
                                            ? 0.25 + day.level * 0.1875
                                            : 1}
                                        title="{day.date}: {day.plays} plays"
                                    ></div>
                                {/if}
                            {/each}
                        </div>
                    {/each}
                </div>
            </div>
        {/if}

        {#if data.onThisDay.length}
            <div
                class="mt-4 rounded-lg border border-border p-5 sm:p-6"
                use:reveal
            >
                <p class="text-xs font-medium uppercase tracking-wide text-dim">
                    On this day
                </p>
                <ul class="mt-4 flex flex-col gap-3">
                    {#each data.onThisDay as entry}
                        {@const href = trackHref(entry.spotifyUri)}
                        <li
                            class="flex items-center justify-between gap-3 text-sm"
                        >
                            <span class="w-14 shrink-0 text-dim"
                                >{entry.year}</span
                            >
                            <span class="min-w-0 flex-1 truncate text-white">
                                {#if href}
                                    <a
                                        {href}
                                        target="_blank"
                                        rel="noreferrer"
                                        class="link hover:text-primary"
                                        >{entry.track}</a
                                    >
                                {:else}
                                    {entry.track}
                                {/if}
                                <span class="text-dim"> — {entry.artist}</span>
                            </span>
                            <span class="shrink-0 text-dim">
                                {entry.plays} play{entry.plays === 1 ? "" : "s"}
                            </span>
                        </li>
                    {/each}
                </ul>
            </div>
        {/if}
    {/if}
</main>
