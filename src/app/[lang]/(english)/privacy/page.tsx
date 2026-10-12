import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/legal-document";
import {
  BulletList,
  Code,
  EmailLink,
  FactList,
  HostedDomain,
  LegalSummary,
  Subheading,
  TextLink,
} from "@/components/legal/legal-prose";
import { host, LEGAL_EMAIL, postalAddress, publisher, supervisoryAuthority } from "@/lib/legal";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: `What ${siteConfig.name} collects when you use saas-monitor.com or its app, why, who handles it and how long it is kept.`,
  alternates: { canonical: "/privacy" },
};

/*
 * Every statement here describes what the code does: update this page with the code. The facts
 * behind it: src/db/schema (what is stored), src/server/auth.ts (sessions, sign-in providers),
 * src/server/screen-access.ts (the screen password cookie), src/server/voice (what Gradium
 * receives), src/server/stripe/accounts.ts and workspace-admin.ts (what deleting removes),
 * src/server/push (what devices register, what notifications say, who delivers them). The app's
 * own repository, saas-monitor-mobile, says what it keeps on devices and whom it talks to.
 */

/** Better Auth's cookies, their prefix kept whole: a narrow column breaks them after it. */
function authCookie(name: string) {
  return (
    <Code>
      <span className="whitespace-nowrap">better-auth.</span>
      <wbr />
      {name}
    </Code>
  );
}

export default function PrivacyPage() {
  return (
    <LegalDocument
      page="privacy"
      updated="2026-10-07"
      lead={
        <>
          What <HostedDomain /> and the {siteConfig.name} app collect, why, who handles it and how
          long it is kept. {siteConfig.name} is also open source: an instance you run yourself sends
          us nothing, and this policy doesn’t cover it.
        </>
      }
      summary={
        <LegalSummary
          title="In short"
          points={[
            "We collect what the service needs to run: your account, your workspaces, and the Stripe data your screens show.",
            "Your Stripe key is stored encrypted. The restricted key we recommend only reads your data, apart from managing the webhook endpoint the service adds.",
            "Customer names and email addresses stay off your screens, and their notifications, unless you turn them on.",
            "The app has no account and no tracking. Your screens stay on your device, and it only talks to their instance and, for notifications, to Apple’s, Google’s or Expo’s push services.",
            "No ads, no tracking, no analytics, and we never sell your data.",
            "Disconnect a Stripe account, and everything imported from it is deleted right away.",
          ]}
        />
      }
      sections={[
        {
          id: "who-we-are",
          title: "Who we are",
          content: (
            <>
              <p>
                <HostedDomain /> and the {siteConfig.name} app are published by {publisher.name},{" "}
                {postalAddress(publisher.address)}, registered in {publisher.registryCity} under
                number {publisher.siren} (see the <TextLink href="/legal">legal notice</TextLink>
                ). We decide how the personal data of the people who use the service is handled: we
                are its controller.
              </p>
              <p>
                For any question about your data, write to <EmailLink email={LEGAL_EMAIL} />.
              </p>
            </>
          ),
        },
        {
          id: "your-customers",
          title: "Your customers’ data",
          content: (
            <>
              <p>
                When you connect a Stripe account, the service imports data about your own
                customers. For that data, you (or your company) are the controller, and we are your
                processor: we handle it only to run the service as you set it up, as agreed in{" "}
                <TextLink href="/terms#processing">the terms of service</TextLink>.
              </p>
              <p>
                Tell your customers about it in your own privacy notice, and choose carefully what
                your screens show: a screen’s link works for anyone who has it, in a browser or in
                the app, with its notifications. If one of your customers asks us about their data,
                we will point them to you and help you answer.
              </p>
            </>
          ),
        },
        {
          id: "what-we-collect",
          title: "What we collect",
          content: (
            <>
              <Subheading>Your account</Subheading>
              <p>
                Your name, email address and password when you sign up. The password is stored only
                as a hash (scrypt), never as you typed it. If you sign in with GitHub or Google
                instead, where the site offers it, they send us your name, email address and the
                address of your profile picture, with the tokens they issue for the sign-in.
              </p>

              <Subheading>Your workspaces and screens</Subheading>
              <p>
                The names of your workspaces, their members and roles, and the invitations you
                create: the invited email address, who invited them and when. For each screen: its
                name, its settings, the phrases you write for its voice, and its optional password,
                hashed like yours.
              </p>

              <Subheading>Your Stripe accounts</Subheading>
              <p>
                The API key you paste, encrypted before it is stored: the dashboard only ever shows
                a masked hint of it. The account’s name, identifier and default currency, the
                signing secret of the webhook endpoint the service creates (encrypted too), and the
                progress of its imports.
              </p>

              <Subheading>What we import from Stripe</Subheading>
              <BulletList>
                <li>
                  Subscriptions: their status, plan, amounts, currency, billing interval, dates, and
                  the terms of the coupons that apply to them.
                </li>
                <li>
                  Payments from the 365 days before you connect, then every new one: amount,
                  refunds, currency, description and date, and for Stripe Connect destination
                  charges, the connected account and your fee.
                </li>
                <li>Customers created in the 7 days before you connect, then every new one.</li>
                <li>
                  For each customer, subscription or payment, when Stripe has them: the customer’s
                  Stripe identifier, name, email address and country.
                </li>
              </BulletList>
              <p>
                We keep no payment method details. A payment’s country comes from its billing
                address or, failing that, from its card.
              </p>

              <Subheading>When you use the service</Subheading>
              <p>
                For each session you sign in to: its IP address, your browser’s user agent and the
                workspace you have open. To slow down password guessing and abuse, the server counts
                recent sign-in attempts, screen password attempts and registrations of the app by IP
                address, in memory only. Like any web server, ours receives your IP address with
                every request, and may keep it briefly in technical logs, for troubleshooting and
                security.
              </p>

              <Subheading>When you write to us</Subheading>
              <p>Your email address and what your message says.</p>

              <Subheading>Visits to this site</Subheading>
              <p>
                We don’t measure them: the site runs no analytics, and loads no third-party script.
              </p>
            </>
          ),
        },
        {
          id: "app",
          title: "The SaaS Monitor app",
          content: (
            <>
              <p>
                The {siteConfig.name} app, for iPhone, iPad, Apple Watch, Android and Wear OS, shows
                your screens and notifies you of what happens on them. It has no account, and
                contains no analytics, advertising or tracking: it collects nothing about how you
                use it.
              </p>

              <Subheading>On your device</Subheading>
              <p>
                You add a screen with its link, scanned from its QR code or pasted. The link works
                as a key, so the app keeps each screen in the device’s secure storage (the keychain
                on Apple devices, the Keystore on Android): its link, its name and the one you give
                it, the proof of its password if it asks for one, your notification choices for it
                and how it looks. The app also keeps your settings, and a random identifier of its
                installation, created on the device.
              </p>
              <p>
                Its widgets, watch apps and, on iPhone, its notification extension get the screens
                from the app, through storage that only they can read (an App Group on Apple
                devices, encrypted storage on Android). Your paired watch receives them over the
                system’s connection with your phone. Widgets and watches keep the last figures they
                fetched, to show something when the network is down. Removing a screen in the app
                removes it, and what was kept of it, from them too.
              </p>

              <Subheading>Who the app talks to</Subheading>
              <p>
                Only the instance of each screen you add (<HostedDomain /> for the screens of this
                service), and the push services that deliver notifications. The app, its widgets and
                its watch apps fetch each screen’s figures from its instance, with its link and the
                proof of its password, and download the sounds and voices the screen plays. Like any
                web server, the instance receives your IP address with each request.
              </p>
              <p>
                To receive notifications, the app gets a push token, the address notifications are
                delivered to: from Apple on Apple devices, from Google’s Firebase Cloud Messaging on
                Android, and from Expo, for its push service, in exchange for the token Apple or
                Google issued.
              </p>
              <p>
                The camera serves only to read a screen’s QR code, on the device: no image is kept
                or sent. The app reads the clipboard only when you tap to paste a link.
              </p>

              <Subheading>Notifications</Subheading>
              <p>
                When notifications are allowed, the app registers the device with the instance of
                each of its screens. For each screen, the instance stores:
              </p>
              <BulletList>
                <li>the installation identifier the app created;</li>
                <li>
                  the platform (iOS or Android) and the device’s push tokens, Expo’s and Apple’s or
                  Google’s, with the Apple environment they belong to;
                </li>
                <li>the device’s language;</li>
                <li>whether notifications are on for this screen, and the events you muted.</li>
              </BulletList>
              <p>
                It uses them only to notify the device of the screen’s moments, as you chose. No
                name, email address or account is attached to them. To limit abuse, the instance
                counts registrations by IP address, in memory only.
              </p>
              <p>
                A notification says what the screen’s card says, in the screen’s language: an amount
                in the screen’s currency (a payment, a change of MRR, a milestone reached), the
                plan, the customer’s country, when a canceled subscription ends, the name of the
                Stripe account on screens that show several and, only on screens set to show
                customer names, the customer’s name, or their email address as the screen shows it
                when they have none. Its data says which screen it comes from, by a short key that
                doesn’t reveal the link, and what the moment plays.
              </p>
              <p>
                <HostedDomain /> sends notifications to Apple (Apple Push Notification service) for
                Apple devices and to Google (Firebase Cloud Messaging) for Android, which deliver
                them; a paired watch shows those of its phone. A device that can’t be reached that
                way gets them through Expo’s push service, which forwards them to Apple or Google.
                These services receive each notification’s text and data with the device’s push
                token, to deliver it.
              </p>
              <p>
                A device stops being notified, and its registration is deleted, when the app removes
                the screen, when the screen gets a new link or password, or when the screen or its
                workspace is deleted. When Apple, Google or Expo report that a token no longer
                reaches a device, once the app was deleted for instance, every screen forgets it,
                and a device left without a token is deleted. A screen notifies 50 devices at most:
                past that, the device whose app was opened the longest ago is forgotten. Turning a
                screen’s notifications off in the app, or pausing them all, keeps the registration
                and stops the notifications.
              </p>

              <Subheading>Sounds and voices</Subheading>
              <p>
                With “Play sounds and voices” on, the app plays the moments of the screen on display
                as its wall displays do and, on iPhone with “Also when the phone is locked”, as the
                sound of its notifications. Sounds and recorded phrases are files downloaded from
                the screen’s instance and kept in the app’s cache. On a screen set to say its own
                words, the app only names the moment to say: the instance writes the phrase from the
                screen’s own data and has Gradium synthesize it, as for a wall display (see{" "}
                <TextLink href="#recipients">who else handles data</TextLink>).
              </p>

              <Subheading>Screens of other instances</Subheading>
              <p>
                The app works with any {siteConfig.name} instance, including self-hosted ones. For a
                screen of another instance, the figures, the registration of your device and the
                notifications are handled by whoever runs that instance, and this policy doesn’t
                cover them: ask them how they handle your data. Such instances reach devices through
                Expo’s push service.
              </p>

              <p>
                Everything the app keeps or sends is needed for what you ask it to do, so it needs
                no consent beyond the permissions your device asks you for: the camera,
                notifications and, for an instance on your local network, access to that network.
              </p>
            </>
          ),
        },
        {
          id: "purposes",
          title: "Why, and on what legal basis",
          content: (
            <>
              <FactList
                facts={[
                  {
                    term: "Run the service",
                    description:
                      "Your account, workspaces and screens, your Stripe connections and what they import.",
                    note: "Performance of our contract with you (GDPR, article 6(1)(b)).",
                  },
                  {
                    term: "Keep it secure",
                    description:
                      "Sessions with their IP address and user agent, password hashes, counts of recent attempts.",
                    note: "Our legitimate interest in protecting the service and your data (article 6(1)(f)).",
                  },
                  {
                    term: "Notify your devices",
                    description:
                      "The registrations of the devices that follow a screen with the app, and what their notifications say.",
                    note: "Performance of the service you asked for, by allowing notifications (article 6(1)(b)).",
                  },
                  {
                    term: "Say a screen’s own phrases",
                    description:
                      "The text of each phrase, sent to Gradium when a screen is set to say its own words.",
                    note: "Performance of the contract: you turned the feature on.",
                  },
                  {
                    term: "Answer you",
                    description: "Your emails, and the account they are about.",
                    note: "Our legitimate interest in replying, or the contract when you are a user.",
                  },
                  {
                    term: "Comply with the law",
                    description: "What a lawful request from an authority requires.",
                    note: "Legal obligation (article 6(1)(c)).",
                  },
                ]}
              />
              <p>
                We don’t use your data for advertising, we don’t sell it, and we make no automated
                decisions about you.
              </p>
            </>
          ),
        },
        {
          id: "cookies",
          title: "Cookies and local storage",
          content: (
            <>
              <FactList
                facts={[
                  {
                    term: authCookie("session_token"),
                    description: "Keeps you signed in.",
                    note: "7 days, extended while you use the service.",
                  },
                  {
                    term: authCookie("session_data"),
                    description:
                      "A signed copy of your session, so pages don’t have to look it up every time.",
                    note: "5 minutes.",
                  },
                  {
                    term: authCookie("state"),
                    description:
                      "Protects a sign-in with GitHub or Google against forgery, while it happens.",
                    note: "5 minutes.",
                  },
                  {
                    term: <Code>screen-access-…</Code>,
                    description:
                      "Set on a device where someone typed a screen’s password, so the screen opens there without asking again.",
                    note: "400 days. Changing the password makes it useless.",
                  },
                  {
                    term: <Code>theme</Code>,
                    description:
                      "Local storage: the light or dark dashboard you chose, if you chose one. The dashboard may keep other choices of yours there the same way, such as a tip you dismissed.",
                    note: "Until you clear it.",
                  },
                ]}
              />
              <p>
                Over HTTPS, the names of the first three start with <Code>__Secure-</Code>. Wall
                displays also note in their session storage the version of the app they reloaded
                for, so that an update reloads them only once.
              </p>
              <p>
                All of these either make the service work or remember a choice you made, so they
                need no consent. We use no advertising, tracking or analytics cookies.
              </p>
              <p>
                The {siteConfig.name} app uses no cookies: it sends the proof of a screen’s password
                in a header instead, and keeps what it needs on your device, as{" "}
                <TextLink href="#app">described above</TextLink>.
              </p>
            </>
          ),
        },
        {
          id: "recipients",
          title: "Who else handles data",
          content: (
            <>
              <p>Our providers, each only for what it does for us:</p>
              <FactList
                facts={[
                  {
                    term: host.name,
                    description: "Hosts our server and database, in France.",
                    note: postalAddress(host.address),
                  },
                  {
                    term: "Gradium SAS",
                    description:
                      "Synthesizes the phrases of screens set to say their own words, on their displays, in the app and in its notifications, and those you preview in the screen editor. It receives the text of each phrase, which can include a customer’s name (on screens that show names), an amount, a plan, a country and a product name.",
                    note: "151 bis rue Saint-Honoré, 75001 Paris, France",
                  },
                  {
                    term: "Google",
                    description: `Hosts the mailbox of ${LEGAL_EMAIL}, which receives the emails you send us, and delivers notifications to Android devices. For these, it receives each notification and the device’s push token.`,
                    note: "Google Workspace, Firebase Cloud Messaging",
                  },
                  {
                    term: "Apple",
                    description:
                      "Delivers notifications to Apple devices. It receives each notification and the device’s push token.",
                    note: "Apple Push Notification service",
                  },
                  {
                    term: "Expo (650 Industries, Inc.)",
                    description:
                      "Issues the app’s Expo push token, and forwards to Apple or Google the notifications of devices this service can’t reach directly. It receives the device’s push tokens and each notification it forwards.",
                    note: "Expo push service, United States",
                  },
                ]}
              />
              <p>
                Stripe, and GitHub or Google when you sign in with them, are your providers, not
                ours: we read your Stripe account with the key you gave us, and a sign-in provider
                shares what you allow it to. Their own privacy policies apply. If you sign in with
                one of them, your profile picture loads from their servers.
              </p>
              <p>
                Apple and Google also distribute the app, through the App Store and Google Play,
                under their own privacy policies. They give us statistics about installs and, from
                people who agreed to share them, crash reports, which don’t tell us who you are.
              </p>
              <p>
                To convert currencies, the server fetches the European Central Bank’s reference
                rates from Frankfurter. The request carries a currency code, nothing about you.
              </p>
              <p>
                We share personal data with no one else, unless the law requires it, and never sell
                or rent it.
              </p>
            </>
          ),
        },
        {
          id: "location",
          title: "Where it is processed",
          content: (
            <p>
              Our server and database are in France. Gradium sends each request to its nearest
              servers, which may be outside the European Union, and Google may process emails
              outside it, under the European Commission’s standard contractual clauses.
              Notifications go through the servers of Apple, Google and, for some devices, Expo,
              which may be in the United States, under the EU–U.S. Data Privacy Framework.
            </p>
          ),
        },
        {
          id: "retention",
          title: "How long we keep it",
          content: (
            <FactList
              facts={[
                {
                  term: "Your account",
                  description: `Until you ask us to delete it, at ${LEGAL_EMAIL}. We then delete it within one month, with its sessions, its sign-in methods and the workspaces no one else belongs to.`,
                },
                {
                  term: "Workspaces, screens and invitations",
                  description:
                    "Until an owner deletes the workspace, in its settings. Invitation links stop working after 7 days.",
                },
                {
                  term: "Stripe keys and imported data",
                  description:
                    "Until you disconnect the Stripe account or delete its workspace. Either deletes the key and everything imported from the account right away, and removes the webhook endpoint the service created in Stripe while the key still allows it. Re-importing an account deletes its data before importing it again.",
                },
                {
                  term: "Sessions",
                  description:
                    "A session expires 7 days after its last use, and signing out ends it at once. Its record, with its IP address and user agent, is deleted when you sign out, when the browser comes back after it expired, or with your account.",
                },
                {
                  term: "Devices following a screen",
                  description:
                    "Until the app removes the screen, the screen gets a new link or password, or is deleted with its workspace. Push tokens that no longer reach a device are forgotten as soon as Apple, Google or Expo report it, and a screen keeps its 50 most recently opened devices at most.",
                },
                {
                  term: "Screens in the app",
                  description:
                    "On your device, until you remove them in the app. The figures their widgets and watches kept go with them.",
                },
                {
                  term: "Attempt counts",
                  description:
                    "In the server’s memory only, never on disk, for windows of an hour at most.",
                },
                {
                  term: "Synthesized phrases",
                  description:
                    "The server keeps its last 200 phrases in memory to replay them, and forgets them when it restarts.",
                },
                {
                  term: "Your emails",
                  description:
                    "As long as needed to follow up, and at most three years after our last exchange.",
                },
              ]}
            />
          ),
        },
        {
          id: "security",
          title: "How we protect it",
          content: (
            <BulletList>
              <li>
                Stripe keys and webhook secrets are encrypted with AES-256-GCM, with a key only the
                server holds, and never sent to a browser.
              </li>
              <li>Passwords, yours and those of screens, are stored as scrypt hashes.</li>
              <li>
                A workspace’s data is only reachable by its members, and by its screens as they are
                set up.
              </li>
              <li>
                A screen’s link carries a long random token. Customer names and email addresses stay
                hidden unless you turn them on, a screen can ask for a password, and regenerating
                its link cuts off the old one.
              </li>
              <li>
                The app keeps screens in the device’s keychain or Keystore. Notifications name their
                screen by a short key that doesn’t reveal its link, and carry no Stripe identifier.
              </li>
              <li>All traffic is encrypted with HTTPS.</li>
              <li>
                The code is open source: anyone can check how data is handled, and{" "}
                <TextLink href={`${siteConfig.repositoryUrl}/blob/main/SECURITY.md`}>
                  report a vulnerability
                </TextLink>{" "}
                privately.
              </li>
            </BulletList>
          ),
        },
        {
          id: "your-rights",
          title: "Your rights",
          content: (
            <>
              <p>
                You may ask to access your data, correct it, delete it, receive it in a portable
                format, restrict its processing or object to it. You may also set guidelines for
                what happens to it after your death.
              </p>
              <p>
                Some of this you can do yourself: rename yourself in the settings, disconnect a
                Stripe account, delete a workspace. For the rest, write to{" "}
                <EmailLink email={LEGAL_EMAIL} />. We answer within one month, and may ask you to
                prove who you are if we can’t tell.
              </p>
              <p>
                The app has no account, so we can’t tell which device is yours. To delete what a
                screen’s instance knows about your device, remove the screen in the app; to stop its
                notifications, turn them off there. Everything else the app keeps stays on your
                device.
              </p>
              <p>
                If you think we don’t respect your rights, you may lodge a complaint with the{" "}
                {supervisoryAuthority.name} ({supervisoryAuthority.fullName}),{" "}
                {supervisoryAuthority.address},{" "}
                <TextLink href={supervisoryAuthority.website}>cnil.fr</TextLink>.
              </p>
            </>
          ),
        },
        {
          id: "changes",
          title: "Changes to this policy",
          content: (
            <p>
              We update this page when the service changes what it collects or who handles it, and
              change its date at the top. We tell you about significant changes by email or in the
              dashboard before they apply.
            </p>
          ),
        },
      ]}
    />
  );
}
