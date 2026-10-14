# Demo contract

A fictional client and statement of work for demoing ScopeGuard. Copy each field into **New contract**, then paste the requests below one at a time.

## Contract fields

| Field       | Value                       |
| ----------- | --------------------------- |
| Client name | Bramblewood Coffee Roasters |
| Title       | Website redesign            |
| Hourly rate | 85.00                       |
| Currency    | USD                         |

### Statement of work

Paste everything inside the block into the SOW field.

```text
STATEMENT OF WORK: Website Redesign
Client: Bramblewood Coffee Roasters
Start date: 1 September 2026
Fixed fee: USD 6,800

1. Project overview
Developer will redesign and rebuild the client's marketing website so customers can learn about the roastery, find the café, and book wholesale tastings.

2. Pages and features
2.1 The website will have six pages: Home, Our Coffee, Café & Hours, Wholesale, About, and Contact.
2.2 The Contact page includes one contact form that emails submissions to the client.
2.3 The Wholesale page includes a booking form for tasting sessions, connected to the client's existing Calendly account.
2.4 The Café & Hours page includes an embedded Google Map and opening hours the client can edit.
2.5 The website will be built on WordPress using a custom theme, and will be responsive on mobile, tablet, and desktop.

3. Content
3.1 The client will supply all written copy and product photography before development starts.
3.2 Developer will load the supplied content into the six pages listed in section 2.1.
3.3 Copywriting, photography, and image retouching are not included.

4. Design and revisions
4.1 Developer will provide one homepage design concept based on the client's existing logo and brand colours.
4.2 The fee includes two rounds of design revisions on the homepage and one round on each interior page.
4.3 Additional revision rounds are billed at the hourly rate.

5. Exclusions
The following are outside the scope of this agreement:
5.1 Online store, e-commerce, or subscription functionality of any kind.
5.2 Logo design, rebranding, or changes to the brand guidelines.
5.3 Integrations with third-party systems other than Calendly and Google Maps.
5.4 Search engine optimisation beyond basic page titles and meta descriptions.
5.5 Ongoing maintenance, hosting, or content updates after launch.

6. Launch and support
6.1 Developer will launch the website on the client's existing hosting account.
6.2 Developer will fix bugs reported within 30 days of launch at no charge. A bug is anything that does not work as described in this statement of work.

7. Change requests
Any work not described in this statement of work requires a written change order, priced at USD 85 per hour, approved by the client before work begins.
```

## Client requests to check

Each request is written to land on a different verdict. Run them in this order for the demo: the out-of-scope ones fill the "scope creep caught" total on the dashboard.

### 1. Out of scope: the merch shop (Email)

> Hey! Loving how the site is coming along. Quick one: could you also add a shop page so we can sell bags of our beans and some merch online? Shouldn't take long, just a few products with a checkout. Thanks so much!

Expected: **out of scope**, citing 5.1. Hours and a change-order price filled in by ScopeGuard.

### 2. In scope: a form that's already in the contract (Slack)

> hey, for the wholesale page can we make sure cafés can book a tasting slot straight from the site? we already use calendly for that

Expected: **in scope**, citing 2.3.

### 3. Out of scope: "just a small tweak" to the logo (Call notes)

> Call with Maya (owner), 14 Oct. She'd like the logo "freshened up a bit", maybe a cleaner font and a slightly different brown, so it matches the new site better. Said it's just a small tweak.

Expected: **out of scope**, citing 5.2.

### 4. Ambiguous: another revision round (Email)

> Hi! We showed the Our Coffee page to the team and they have a few more thoughts on the layout. Can we do another pass on it?

Expected: **ambiguous**. Interior pages include one revision round (4.2) and extra rounds are billed (4.3), so whether this is covered depends on whether that round was already used. A good answer asks.

### 5. In scope: a post-launch bug (Ticket)

> Since launch last week the contact form sends us an email but it arrives with an empty message body. Customers are saying they've written to us and we can't see what they wrote.

Expected: **in scope**, citing 6.2 (bug within 30 days of launch).

### 6. Out of scope: an integration not on the list (Slack)

> one more thing, can the site pull our café menu from Square so we don't have to update it twice? 🙏

Expected: **out of scope**, citing 5.3.
