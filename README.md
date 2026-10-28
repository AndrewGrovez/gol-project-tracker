This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Instagram Scheduler Automation

Instagram scheduled posts are queued in Supabase and published by the app through
`/api/instagram/process-scheduled`.

Because this Vercel project is on the Hobby plan, the queue is processed by a
GitHub Actions workflow every 5 minutes instead of Vercel Cron. The route
accepts GitHub Actions OIDC tokens, so no scheduler secret needs to be committed
to the repository.

### Dref Wen

The same scheduler also supports Dref Wen at `/dref-wen`. Its account switch is
shown only to the existing user identified by `DREF_WEN_SCHEDULER_USER_ID`.
The existing `/facebook` page and requests without an account selector use Gôl.
An invalid or unauthorised account is rejected before any publishing action.

Configure these server-side environment variables in development and Vercel:

- `DREF_WEN_SCHEDULER_USER_ID`: the existing Supabase user ID allowed to use Dref Wen.
- `DREF_WEN_FACEBOOK_ACCESS_TOKEN`: a Page token authorised for Dref Wen.
- `DREF_WEN_INSTAGRAM_ACCESS_TOKEN`: optional separate Facebook-login Instagram
  token; otherwise the Dref Wen Page token is used for its linked Instagram account.

Dref Wen's verified Facebook Page ID is `681151585558387`, and its linked
`@drefwen` Instagram ID is `17841425739521098`. Credentials never fall back to
Gôl's credentials. Only non-secret labels and configuration booleans are passed
to the browser.

Apply `supabase/migrations/20261027175000_dref_wen_social_scheduler.sql` before
enabling the connection. Dref Wen uses its own queue and Facebook image metadata
tables, with owner-only read policies and service-only writes. The existing
GitHub Actions worker processes both configured accounts; manual processing is
limited to the account open in the scheduler.

Validate the Meta token's Page identity, linked Instagram identity and publishing
permissions before saving it. Keep the existing Gôl asset authorisations when
adding Dref Wen to the same Meta app. No live post is required for connection
verification. Use `npm run test:social` for the isolated route regression checks.

Meta's manual authorisation flow must return to
`https://projects.golcentres.co.uk/auth/meta/callback`. This standalone HTML route
does not load the project sign-in client. Returning a Meta token to a normal app
page can make Supabase interpret it as a failed project login and clear the
existing session. Verify the returned origin and OAuth state before reading any
token, and use the clean scheduler link after setup.
