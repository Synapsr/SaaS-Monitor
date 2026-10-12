import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/legal-document";
import {
  BulletList,
  EmailLink,
  Emphasis,
  HostedDomain,
  LegalSummary,
  TextLink,
} from "@/components/legal/legal-prose";
import { LEGAL_EMAIL, postalAddress, publisher } from "@/lib/legal";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of service",
  description: `The terms of the hosted ${siteConfig.name} service at saas-monitor.com, free during its public beta.`,
  alternates: { canonical: "/terms" },
};

const licenseUrl = `${siteConfig.repositoryUrl}/blob/main/LICENSE`;
const securityPolicyUrl = `${siteConfig.repositoryUrl}/blob/main/SECURITY.md`;

export default function TermsPage() {
  return (
    <LegalDocument
      page="terms"
      updated="2026-10-07"
      lead={
        <>
          The rules for using {siteConfig.name} as we host it at <HostedDomain />. The code is open
          source under the MIT license; these terms cover the service we run for you.
        </>
      }
      summary={
        <LegalSummary
          title="In short"
          points={[
            "The hosted service is free during its public beta, and provided as is.",
            "You are responsible for the Stripe keys you connect, and for what your screens show: a screen’s link works for anyone who has it.",
            "For your customers’ data, you are the controller and we are your processor.",
            "Figures come from Stripe and may be wrong or late: check in Stripe before relying on them.",
            "French law applies, and the courts of Brest settle disputes.",
          ]}
        />
      }
      sections={[
        {
          id: "about",
          title: "About these terms",
          content: (
            <>
              <p>
                These terms govern your use of {siteConfig.name} as hosted at <HostedDomain /> (the
                service), provided by {publisher.name} (we, us). By creating an account, you accept
                them. If you create it for a company, you accept them on its behalf and confirm you
                may.
              </p>
              <p>
                The service is meant for professionals: founders and teams following their own
                business.
              </p>
              <p>
                {siteConfig.name}’s source code is open source under the{" "}
                <TextLink href={licenseUrl}>MIT license</TextLink>. The license covers the code,
                these terms cover the service we run: they don’t restrict your rights under the
                license, and don’t apply to instances you or others host.
              </p>
            </>
          ),
        },
        {
          id: "beta",
          title: "A free public beta",
          content: (
            <>
              <p>
                The service is in public beta and free of charge. Features may change or be removed,
                and the service may be interrupted, for maintenance or otherwise, without notice.
              </p>
              <p>
                If we introduce paid plans, we will announce them at least 30 days in advance, and
                nothing will be charged without your explicit agreement. The open-source version
                stays free to run on your own server.
              </p>
            </>
          ),
        },
        {
          id: "account",
          title: "Your account",
          content: (
            <BulletList>
              <li>Give accurate information, and keep your password to yourself.</li>
              <li>
                You are responsible for what happens under your account and, in the workspaces you
                own or administer, for the people you invite. An invitation link only works for the
                email address it names, which the service doesn’t verify: share it with that person
                only, and revoke the links you no longer need.
              </li>
              <li>
                Tell us at <EmailLink email={LEGAL_EMAIL} /> if you think someone else is using your
                account.
              </li>
            </BulletList>
          ),
        },
        {
          id: "stripe",
          title: "Your Stripe accounts",
          content: (
            <>
              <p>
                Only connect Stripe accounts you are authorized to access. We recommend a restricted
                key with the read permissions the service lists, plus, for instant updates, the
                permission to manage webhook endpoints. With your key, the service reads the data it
                needs and manages the one webhook endpoint it creates. It changes nothing else in
                your Stripe account.
              </p>
              <p>
                You are responsible for the key you give us. You can revoke it in Stripe at any
                time, and disconnecting the account in the dashboard deletes it from the service.
              </p>
              <p>
                {siteConfig.name} is not affiliated with Stripe. Stripe’s terms keep applying to
                your Stripe account.
              </p>
            </>
          ),
        },
        {
          id: "screens",
          title: "Screens are public by link",
          content: (
            <>
              <p>
                <Emphasis>
                  Anyone with a screen’s link can see the screen, without signing in, and follow it
                  in the {siteConfig.name} app, with its notifications.
                </Emphasis>{" "}
                You decide what each screen shows, where it is displayed and who gets its link.
                Customer names and email addresses are hidden unless you turn them on, a screen can
                ask for a password, and regenerating its link revokes the old one.
              </p>
              <p>
                You are responsible for what your screens show and say, including the phrases you
                write for their voice, and for having the right to show your customers’ names or
                email addresses where you put them: an office, a shop window, a video.
              </p>
            </>
          ),
        },
        {
          id: "acceptable-use",
          title: "Acceptable use",
          content: (
            <>
              <p>You agree not to:</p>
              <BulletList>
                <li>use the service against the law or the rights of others;</li>
                <li>connect a Stripe account without the authorization of its owner;</li>
                <li>
                  try to reach workspaces, screens or data that aren’t yours, or to get around the
                  service’s security. Report vulnerabilities privately instead, as{" "}
                  <TextLink href={securityPolicyUrl}>our security policy</TextLink> explains;
                </li>
                <li>
                  overload the service, for example with automated requests beyond what screens and
                  the dashboard make;
                </li>
                <li>resell the hosted service, or offer it to others as your own;</li>
                <li>make screens show or say anything unlawful, hateful or misleading.</li>
              </BulletList>
            </>
          ),
        },
        {
          id: "processing",
          title: "Processing on your behalf",
          content: (
            <>
              <p>
                Your Stripe accounts hold personal data about your customers: their names, email
                addresses, countries and Stripe identifiers, and the details of their subscriptions
                and payments. For this data, you are the controller and we are your processor,
                within the meaning of article 28 of the GDPR. This section is our agreement on it.
              </p>
              <BulletList>
                <li>
                  <Emphasis>Instructions.</Emphasis> We process it only to provide the service as
                  your settings direct: importing it, computing your metrics, showing it on your
                  dashboard and screens, and in the notifications of the devices that follow them.
                  Your settings are your documented instructions.
                </li>
                <li>
                  <Emphasis>Duration.</Emphasis> As long as the Stripe account stays connected.
                </li>
                <li>
                  <Emphasis>Confidentiality.</Emphasis> Only people bound to confidentiality, who
                  need it to run the service, can access it.
                </li>
                <li>
                  <Emphasis>Security.</Emphasis> We apply the measures described in{" "}
                  <TextLink href="/privacy#security">the privacy policy</TextLink>.
                </li>
                <li>
                  <Emphasis>Subprocessors.</Emphasis> You authorize those listed in{" "}
                  <TextLink href="/privacy#recipients">the privacy policy</TextLink>. We announce
                  any change there, and by email before a new one receives your customers’ data, so
                  that you can object. Each is bound by data protection obligations equivalent to
                  these.
                </li>
                <li>
                  <Emphasis>Assistance.</Emphasis> We help you answer your customers’ requests and
                  meet your own obligations (security, impact assessments, breach notifications), as
                  far as the information we hold allows.
                </li>
                <li>
                  <Emphasis>Breaches.</Emphasis> We notify you without undue delay after becoming
                  aware of a breach affecting this data.
                </li>
                <li>
                  <Emphasis>End.</Emphasis> Disconnecting a Stripe account or deleting its workspace
                  deletes this data right away. It stays in your Stripe account, so nothing needs to
                  be returned.
                </li>
                <li>
                  <Emphasis>Audits.</Emphasis> We give you the information needed to show that these
                  obligations are met. The code that handles the data is public.
                </li>
              </BulletList>
            </>
          ),
        },
        {
          id: "accuracy",
          title: "Accuracy of the figures",
          content: (
            <p>
              Figures are computed from what Stripe returns, following Stripe’s definition of MRR,
              and converted between currencies with the European Central Bank’s reference rates.
              They may be late, incomplete or differ from Stripe’s own reports, and imports can
              fail. The service is not accounting, financial or tax advice: check important numbers
              in Stripe before relying on them.
            </p>
          ),
        },
        {
          id: "your-data",
          title: "Your data",
          content: (
            <p>
              Your data stays yours. You grant us only the right to host and process it to provide
              the service, and we use it for nothing else. How we handle it is described in{" "}
              <TextLink href="/privacy">the privacy policy</TextLink>.
            </p>
          ),
        },
        {
          id: "termination",
          title: "Ending or suspending",
          content: (
            <>
              <p>
                You can stop using the service at any time: disconnect your Stripe accounts, delete
                your workspaces, and write to <EmailLink email={LEGAL_EMAIL} /> to have your account
                deleted.
              </p>
              <p>
                We may suspend or close an account, or disable a screen, that breaches these terms
                or puts the service, its users or others at risk. We tell you why, beforehand when
                we can.
              </p>
              <p>
                We may also end the beta or the service. We will give you at least 30 days’ notice
                by email, unless the law or security requires faster action.
              </p>
            </>
          ),
        },
        {
          id: "warranty",
          title: "No warranty",
          content: (
            <p>
              The service is free, and provided as is and as available. As far as the law allows, we
              make no warranty that it will be available without interruption, free of errors,
              secure against every threat, or fit for a particular purpose.
            </p>
          ),
        },
        {
          id: "liability",
          title: "Liability",
          content: (
            <>
              <p>As far as the law allows:</p>
              <BulletList>
                <li>
                  we are not liable for indirect damage, such as lost profits, lost business, lost
                  data or harm to reputation;
                </li>
                <li>
                  we are not liable for decisions made on the figures the service shows, nor for
                  what your screens show or say to others;
                </li>
                <li>
                  our total liability for the service, which is free, is limited to 100 euros.
                </li>
              </BulletList>
              <p>
                These limits don’t apply to gross negligence, wilful misconduct, or wherever the law
                forbids them.
              </p>
            </>
          ),
        },
        {
          id: "changes",
          title: "Changes to these terms",
          content: (
            <p>
              We may update these terms as the service evolves. We tell you about significant
              changes by email or in the dashboard at least 30 days before they apply. If you don’t
              agree, you can stop using the service and delete your data before then; using it after
              that date means you accept the new terms.
            </p>
          ),
        },
        {
          id: "law",
          title: "Governing law and disputes",
          content: (
            <p>
              These terms are governed by French law. Before going to court, write to us at{" "}
              <EmailLink email={LEGAL_EMAIL} />: we will try to settle any disagreement amicably.
              Failing that, the courts of Brest, France, have exclusive jurisdiction, unless
              mandatory rules say otherwise.
            </p>
          ),
        },
        {
          id: "contact",
          title: "Contact",
          content: (
            <p>
              {publisher.name}, {postalAddress(publisher.address)}.{" "}
              <EmailLink email={LEGAL_EMAIL} />. More in the{" "}
              <TextLink href="/legal">legal notice</TextLink>.
            </p>
          ),
        },
      ]}
    />
  );
}
