# Local Label Studio setup notes

Personal reference for the local Label Studio install used to review this package (`tasks_all10.json`, `tasks_selected.json`, `label_config.xml`). Not read by the app or `scripts/validate_data.py`; kept here purely so this environment can be recreated or reactivated without re-deriving any of it.

## Why a virtual environment

Label Studio (current PyPI release) requires **Python ≥3.10**. This Mac's default `python3`/`pip3` on `PATH` resolve to Python 3.9.6 (Xcode Command Line Tools' bundled interpreter), which doesn't meet that requirement, and its global `site-packages` isn't writable without `sudo` anyway. Homebrew Python 3.13 was already installed on this machine (`/opt/homebrew/bin/python3.13`), so a virtual environment was built from that instead — a self-contained folder holding its own Python + packages, isolated from both the system Python and Homebrew's own package set.

## What was actually run

```bash
python3.13 -m venv ~/label-studio-env
~/label-studio-env/bin/pip install --upgrade pip
~/label-studio-env/bin/pip install -U label-studio
```

This created the venv at `~/label-studio-env` and installed `label-studio` **1.23.0** (with `label-studio-sdk` 2.0.18 and its full dependency set) into it. The `-U`/`--upgrade` flag makes no difference on this first install into an empty venv, but is worth keeping in future re-runs of the last command, since it's what makes `pip install -U label-studio` actually fetch a newer release later instead of silently leaving an older one in place.

Verifying the install (`~/label-studio-env/bin/label-studio --version`) turned out to itself boot the full application — in this release, `--version` isn't a lightweight print-and-exit, it starts the Django app the same as `start` does. That's what opened the browser automatically. It came up on **`http://localhost:8081`**, not the usual default `8080`, because this repository's own `python3 -m http.server 8080` was occupying `8080` at the time — Label Studio fell back to the next port rather than failing.

Sign-up was completed directly in that browser session (any email works locally; there's no org-domain requirement outside the hosted Starter Cloud product).

## Where your data actually lives

Confirmed directly from this install's own startup log (not assumed from generic docs, which describe the Linux path — macOS differs):

```
~/Library/Application Support/label-studio
```

This directory holds the SQLite database (your account, every project, every imported task and prediction, and any annotation you create) plus a `media/` folder for uploaded files. It is **completely independent of the `~/label-studio-env` virtual environment** — the venv only holds the software; this folder holds your work. Deactivating the venv, closing Terminal, or restarting the Mac has no effect on it. It persists across every future `label-studio start` unless this specific folder is deleted.

## Reactivating this environment in future

```bash
source ~/label-studio-env/bin/activate
label-studio start
```

- `source ...activate` just tells the current Terminal tab to use this venv's Python/pip/label-studio instead of the system ones. It doesn't run or restore anything by itself, and forgetting it only means the `label-studio` command won't be found — nothing is lost.
- `label-studio start` picks up the same database at `~/Library/Application Support/label-studio` automatically and reopens the browser to your existing account, projects, and any annotations already made.
- To leave the venv active in a Terminal tab: `deactivate`.

**Useful `label-studio start` flags** (from `label-studio start --help` on this install):

| Flag | Effect |
|---|---|
| `-p PORT` / `--port PORT` | Force a specific port instead of auto-picking (e.g. `-p 8080` once this repo's own dev server isn't running, or `-p 8081` to match what you're used to). |
| `-b` / `--no-browser` | Start the server without auto-opening a browser tab. |
| `--data-dir DATA_DIR` | Point at a different data directory than the default above. |

## Controlling whether Sol's predictions pre-fill your own annotation

By default, a new annotation you open on a task with an existing prediction gets seeded ("pre-labeled") with that prediction's regions, so your own tab shows Sol's highlights already sitting there rather than a blank output. This is controlled by two project-level fields (confirmed directly in the installed `label_studio` package, `projects/models.py`), not anything in `label_config.xml`:

- `show_collab_predictions` (verbose name "show predictions to annotator", default `True`) — whether predictions are shown/usable for pre-labeling at all.
- `model_version` — which prediction set (matched by its `model_version`, here `"GPT-5.6 Sol"`) is used for pre-labeling. Must be cleared for pre-labeling to stop.

In the UI, this is the **"Use predictions to prelabel tasks"** toggle under project Settings (not "Machine Learning" / "Live Predictions" as in Label Studio's paid Enterprise docs — that section doesn't exist in this Community edition install; that was a wrong guess corrected after checking). Turning it off sets both fields correctly on the backend (verified via the API, see below) — **it does not retroactively clear a draft annotation you'd already opened before switching it off**; delete that task's existing draft and reopen it to get a genuinely blank annotation.

This does **not** affect the separate `GPT-5.6 Sol` tab, which always shows Sol's prediction regardless — that's the intended, permanent read-only reference view of Sol's assessment for that task.

## Using the API directly (personal access token)

Only needed if you want to change a project setting (or anything else) without hunting through the UI. Getting a token: avatar (top right) → **Account & Settings** → API token section.

**Important:** the token shown there is a JWT **refresh** token (Label Studio's current Personal Access Token format), not a plain opaque key — confirmed by decoding it and reading `jwt_auth/auth.py` and `jwt_auth/middleware.py` in the installed package. It cannot be used directly as `Authorization: Token <PAT>` (that's the older/legacy scheme, and doesn't apply here) or `Authorization: Bearer <PAT>` (SimpleJWT rejects a refresh-type token used where an access token is expected). It must first be exchanged for a short-lived access token:

```bash
# 1. Exchange your refresh PAT for a short-lived access token
curl -s -X POST http://localhost:8081/api/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh": "YOUR_PAT_HERE"}'
# -> {"access": "..."}

# 2. Use that access token as a Bearer token for actual API calls
curl -s http://localhost:8081/api/projects/1/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"

# Example write (only if a setting actually needs changing — check current values with a GET first,
# as in this project's case, where the UI toggle had already set both fields correctly):
curl -X PATCH http://localhost:8081/api/projects/1/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"show_collab_predictions": false, "model_version": ""}'
```

The access token is short-lived (a few minutes); re-run step 1 to get a fresh one whenever it expires. The refresh PAT itself is very long-lived (effectively permanent until revoked) — treat it like a password: don't commit it, don't paste it anywhere outside a local terminal you control, and rotate it (Account & Settings → revoke/regenerate) if it's ever been exposed somewhere it shouldn't (e.g. pasted into a chat transcript).

## Importing this package's files (not yet done as of this writing)

1. In the Label Studio UI, create a new project.
2. In the project's labeling-config editor, paste the contents of [`label_config.xml`](label_config.xml).
3. Use the project's **Import** action to upload [`tasks_all10.json`](tasks_all10.json) (all 10 V1 tasks) or [`tasks_selected.json`](tasks_selected.json) (the 6-task subset — see [`selection_report.md`](selection_report.md) for why those six). Each task's embedded `predictions` entry (the Sol LLM-as-judge assessment) attaches automatically on import.
4. See [`validation_report.md`](validation_report.md) for exactly what was checked in these files before this point (counts, duplicate/required-field checks, V1-only and no-human-reference-assessment confirmation, span-offset verification).
