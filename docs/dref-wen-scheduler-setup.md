# Dref Wen social scheduler

Dref Wen uses the existing project login and scheduler at `/dref-wen`, with a
Gôl/Dref Wen account switch. Access to Dref Wen is restricted to the existing user
configured in `DREF_WEN_SCHEDULER_USER_ID`.

## Verified account connection

- Facebook: https://www.facebook.com/drefwen — Page ID `681151585558387`.
- Instagram: https://www.instagram.com/drefwen/ — ID `17841425739521098`.
- Meta app: **Projects Integration**, ID `925334549762090`.
- The user explicitly authorised this app to publish to Dref Wen, manage its
  scheduled posts and save the connection securely in this project.
- Meta's consent flow includes Dref Wen and the existing Gôl Cardiff Page and
  Instagram account, using selected current assets only.
- The requested permissions are `pages_show_list`, `pages_read_engagement`,
  `pages_manage_posts`, `instagram_basic` and `instagram_content_publish`.
- Read-only API checks confirmed the Page token's identity, the linked @drefwen
  account, the required scopes, scheduled-post reads and Instagram-media reads.
  Meta returned `is_valid: true` and `expires_at: 0` for the saved Page token.
- Gôl's existing saved Page token was checked afterwards and remains valid with
  its publishing permissions. Its credential value was not replaced.

## Meta login configuration

The app's Website platform and Site URL use `https://projects.golcentres.co.uk/`.
Its App Domain is `projects.golcentres.co.uk`. Facebook Login for Business is
configured with the exact allowed callback
`https://projects.golcentres.co.uk/facebook`; Meta's redirect validator passed.
The callback's origin and state were verified before reading the returned token.

## Credential storage

The production Vercel project is `gol-project-tracker`
(`prj_7q0Mk0YLXtecaIzjqjv0aLiT9KoC`).

- `DREF_WEN_SCHEDULER_USER_ID`: production Config, using the existing scheduler
  owner's Supabase ID.
- `DREF_WEN_FACEBOOK_ACCESS_TOKEN`: production Secret. The same Dref Wen Page
  token is used for its linked Instagram account.
- An optional separate token can be configured as
  `DREF_WEN_INSTAGRAM_ACCESS_TOKEN`.

The local values are in the ignored `.env.local`. No credentials are passed to
client components or committed to Git. The UI receives account labels and
configuration booleans only.

## Queue and account isolation

Dref Wen owns `dref_wen_instagram_scheduled_posts` and
`dref_wen_facebook_scheduled_post_images`. Both tables have row-level security,
owner-only reads and service-only writes. The claim function is executable only
by the publishing service and filters jobs by the configured owner.

Creation, listing, editing, cancellation and manual queue processing authorise
the selected account on the server. Missing credentials and invalid account
selectors fail without using another brand's credentials. The existing automated
worker processes both configured brands. Manual processing is limited to the
account open in the scheduler.

The reviewed schema from
`supabase/migrations/20261027175000_dref_wen_social_scheduler.sql` was applied with
Supabase's supported SQL tool. Its history version was then recorded with the
official `supabase migration repair 20261027175000 --status applied` command,
using the explicit Gol Project Tracker project reference. No migration-history
records were edited manually.

## Validation

- `npm run test:social`: 19 passing isolated route regression tests.
- `npm run build`: production build, lint and TypeScript checks passed.
- `git diff --check`: passed.
- Database checks covered job claims, ownership, read policies and service-only
  claim/write permissions. The schema was first tested in a rolled-back
  transaction, then its applied permissions were read back.
- Supabase's security advisor reported no findings for the Dref Wen objects.
- Dref Wen's queue and image-metadata table were empty at setup.
- No Facebook or Instagram posts were created or published during setup.
