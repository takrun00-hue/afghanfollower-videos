// Is the Facebook token set, valid, and the right kind?
//
// Three different tokens look identical and behave differently, and the Graph
// API's error for the wrong one is not obvious. This says which you have and
// what it can actually see, before it is trusted in a scheduled scan.
//
//   node check-facebook.mjs
import { amalFacebookDiagnose, amalFacebook } from "./lib/amal.mjs";
import { loadEnv } from "./lib/telegram.mjs";

const env = loadEnv();
const token = process.env.FACEBOOK_PAGE_TOKEN || env.FACEBOOK_PAGE_TOKEN || "";

const d = await amalFacebookDiagnose(token);

if (!token) {
  console.log("FACEBOOK_PAGE_TOKEN is not set.");
  console.log("");
  console.log("Add it to .env beside the other keys:");
  console.log("  FACEBOOK_PAGE_TOKEN=EAAG...");
  console.log("");
  console.log("and to the repository's Actions secrets under the same name, or");
  console.log("the scheduled scan will run without it and use the website only.");
  process.exit(1);
}

console.log(`valid   ${d.ok ? "yes" : `no — ${d.why}`}`);
console.log(`type    ${d.type || "?"}`);
console.log(`expires ${d.expires || "?"}`);
if (d.scopes?.length) console.log(`scopes  ${d.scopes.join(", ")}`);
console.log("");

if (!d.ok) {
  console.log("The token is not usable. The scan will fall back to the website.");
  process.exit(1);
}
if (d.type !== "PAGE") {
  // A user token can only read pages the user administers; an app token cannot
  // read a page it does not own. Only a page token reads a page's own posts.
  console.log(`This is a ${d.type} token, not a PAGE token.`);
  console.log("Page posts need a Page access token — a user or app token will");
  console.log("authenticate and then return nothing, which is the failure that");
  console.log("looks like a quiet news day.");
}

try {
  const posts = await amalFacebook({ token, limit: 5 });
  console.log(`${posts.length} Persian post(s) readable from the page:`);
  for (const p of posts) console.log(`  ${p.publishedDate}  ${p.title.slice(0, 58)}`);
  if (!posts.length) {
    console.log("  (none — the token authenticated but the page returned no");
    console.log("   Persian posts in the window; check the token's page)");
  }
  process.exit(posts.length ? 0 : 1);
} catch (e) {
  console.log(String(e.message));
  process.exit(1);
}
