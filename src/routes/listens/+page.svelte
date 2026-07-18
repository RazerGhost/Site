<script lang="ts">
    import Seo from "$lib/components/Seo.svelte";
    import ListeningNowCard from "$lib/components/ListeningNowCard.svelte";
    import Music from "@lucide/svelte/icons/music";
    import Search from "@lucide/svelte/icons/search";
    import { reveal } from "$lib/actions/reveal";
    import { goto } from "$app/navigation";
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

    function selectYear(e: Event) {
        const value = (e.target as HTMLSelectElement).value;
        const params = new URLSearchParams(location.search);
        if (value === "all") params.delete("year");
        else params.set("year", value);
        goto(`?${params.toString()}`, { keepFocus: true, noScroll: true });
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

    // --- Search ---
    let query = $state("");
    let searchResults = $state<
        {
            track: string;
            artist: string;
            plays: number;
            spotifyUri: string | null;
        }[]
    >([]);
    let searchTimeout: ReturnType<typeof setTimeout>;
    let showResults = $state(false);
    let searchContainerEl = $state<HTMLDivElement>();

    function onSearchInput() {
        showResults = true;
        clearTimeout(searchTimeout);
        const q = query.trim();
        if (q.length < 2) {
            searchResults = [];
            return;
        }
        searchTimeout = setTimeout(async () => {
            const res = await fetch(
                `/api/listening/search?q=${encodeURIComponent(q)}`,
            );
            const body = await res.json();
            searchResults = body.results ?? [];
        }, 250);
    }

    function onDocumentClick(e: MouseEvent) {
        if (
            searchContainerEl &&
            !searchContainerEl.contains(e.target as Node)
        ) {
            showResults = false;
        }
    }

    function onSearchKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") showResults = false;
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
        const res = await fetch(
            `/api/listening/artist?artist=${encodeURIComponent(artist)}`,
        );
        const body = await res.json();
        artistTracks = body.tracks ?? [];
    }
</script>

<svelte:window onclick={onDocumentClick} />

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

        <div class="relative mt-6" bind:this={searchContainerEl} use:reveal>
            <Search
                size={15}
                class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-dim"
                aria-hidden="true"
            />
            <input
                type="search"
                placeholder="Search your listening history…"
                class="w-full rounded-lg border border-border bg-surface py-2 pr-3 pl-9 text-sm text-white placeholder:text-dim focus:border-primary focus:outline-none"
                bind:value={query}
                oninput={onSearchInput}
                onkeydown={onSearchKeydown}
            />
            {#if showResults && searchResults.length}
                <ul
                    class="absolute z-10 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-border bg-surface shadow-[var(--shadow-card-hover)]"
                >
                    {#each searchResults as r}
                        {@const href = trackHref(r.spotifyUri)}
                        <li>
                            <a
                                {href}
                                target={href ? "_blank" : undefined}
                                rel="noreferrer"
                                onclick={() => (showResults = false)}
                                class="flex items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-surface-2"
                            >
                                <span class="min-w-0 flex-1 truncate text-white"
                                    >{r.track}
                                    <span class="text-dim">— {r.artist}</span
                                    ></span
                                >
                                <span class="shrink-0 text-xs text-dim"
                                    >{r.plays} plays</span
                                >
                            </a>
                        </li>
                    {/each}
                </ul>
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
                                <li>
                                    <button
                                        type="button"
                                        class="w-full text-left"
                                        onclick={() =>
                                            toggleArtist(artist.artist)}
                                    >
                                        <div
                                            class="flex items-center justify-between text-sm"
                                        >
                                            <span
                                                class="text-white hover:text-primary"
                                                >{artist.artist}</span
                                            >
                                            <span class="text-dim"
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
                                <li>
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
                                        <span class="ml-3 shrink-0 text-dim"
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
                                </li>
                            {/each}
                        </ul>
                    </div>
                {/if}
            </div>
        </div>

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
