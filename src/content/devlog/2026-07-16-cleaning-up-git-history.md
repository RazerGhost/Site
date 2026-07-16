---
title: "TIL: squashing a throwaway commit without git rebase -i"
date: 2026-07-16
tags: [git, til]
excerpt: A one-liner commit message snuck into main. Here's how to fold it into its neighbor without an interactive rebase.
---

Small one. A commit titled `Flipped from earliest to latest` snuck into
`main` — a real one-line fix, but not something worth its own line in the
history once this repo goes public.

`git rebase -i` is the usual tool for this, but it drops you into an editor,
which doesn't work well from a script or an agent. The non-interactive
version:

<div data-embed="Terminal" data-lines='["git checkout -b rewrite base-commit","git cherry-pick good-commit throwaway-commit","git reset --soft HEAD~2","git commit -m \"original message, reused\""]'></div>

`cherry-pick`-ing both commits onto a fresh branch, then `reset --soft` back
two commits, stages everything from both without touching the working tree —
so the follow-up `commit` combines them under whichever message you want.

Same trick works for squashing any run of trailing commits, not just two.
