// Keep Meta's token fragment away from the app layout: Supabase's browser
// client treats any access_token fragment as a project sign-in attempt.
export function GET() {
  return new Response(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Meta connection setup | Gol Projects</title>
    <style>
      body { margin: 0; padding: 2rem; background: #09162a; color: #fff; font: 1rem/1.6 system-ui, sans-serif; }
      main { max-width: 32rem; margin: 12vh auto; }
      h1 { line-height: 1.2; }
      a { color: #a7d963; }
    </style>
  </head>
  <body>
    <main>
      <h1>Meta connection setup</h1>
      <p>Your browser has returned from Meta. Continue setup in the chat.</p>
      <p><a href="/dref-wen">Open the Dref Wen scheduler</a></p>
    </main>
  </body>
</html>`, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
