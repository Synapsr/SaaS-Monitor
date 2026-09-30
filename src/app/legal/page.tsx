import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/legal-document";
import { EmailLink, FactList, TextLink } from "@/components/legal/legal-prose";
import { host, postalAddress, publisher, supervisoryAuthority } from "@/lib/legal";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Legal notice",
  description:
    "Who publishes and hosts saas-monitor.com, with the French mentions légales the law requires.",
  alternates: { canonical: "/legal" },
};

export default function LegalNoticePage() {
  return (
    <LegalDocument
      page="legal"
      updated="2026-09-30"
      lead={
        <>
          Who publishes and hosts saas-monitor.com, as French law requires (law no. 2004-575 of 21
          June 2004, known as the LCEN). The French version follows.
        </>
      }
      sections={[
        {
          id: "publisher",
          title: "Publisher",
          content: (
            <FactList
              facts={[
                {
                  term: "Company",
                  description: `${publisher.name}, a simplified joint-stock company (société par actions simplifiée) with a share capital of ${publisher.shareCapital.en}.`,
                },
                { term: "Registered office", description: postalAddress(publisher.address) },
                {
                  term: "Registration",
                  description: `RCS ${publisher.registryCity} ${publisher.siren}`,
                  note: `SIRET ${publisher.siret}`,
                },
                { term: "VAT number", description: publisher.vatNumber },
                {
                  term: "Phone",
                  description: (
                    <TextLink href={`tel:${publisher.phone.international.replace(/\s/g, "")}`}>
                      {publisher.phone.international}
                    </TextLink>
                  ),
                },
                { term: "Email", description: <EmailLink email={publisher.email} /> },
              ]}
            />
          ),
        },
        {
          id: "director",
          title: "Director of publication",
          content: (
            <p>
              {publisher.director}, president of {publisher.name}.
            </p>
          ),
        },
        {
          id: "host",
          title: "Host",
          content: (
            <FactList
              facts={[
                {
                  term: "Company",
                  description: `${host.name}, a simplified joint-stock company (société par actions simplifiée).`,
                },
                { term: "Registered office", description: postalAddress(host.address) },
                { term: "Registration", description: `RCS ${host.registryCity} ${host.siren}` },
                { term: "Phone", description: host.phone.international },
                {
                  term: "Website",
                  description: <TextLink href={host.website}>ovhcloud.com</TextLink>,
                },
              ]}
            />
          ),
        },
        {
          id: "open-source",
          title: "Open source and self-hosting",
          content: (
            <p>
              {siteConfig.name}’s code is published under the MIT license{" "}
              <TextLink href={siteConfig.repositoryUrl}>on GitHub</TextLink>. This notice covers
              saas-monitor.com only: an instance hosted elsewhere is published by whoever runs it.
            </p>
          ),
        },
        {
          id: "personal-data",
          title: "Personal data",
          content: (
            <p>
              How we handle personal data is described in{" "}
              <TextLink href="/privacy">the privacy policy</TextLink>. To exercise your rights,
              write to <EmailLink email={publisher.email} />. You may also lodge a complaint with
              the {supervisoryAuthority.name}.
            </p>
          ),
        },
        {
          id: "mentions-legales",
          title: "Mentions légales",
          lang: "fr",
          content: (
            <>
              <p>
                Informations exigées par la loi n°&nbsp;2004-575 du 21&nbsp;juin 2004 pour la
                confiance dans l’économie numérique (LCEN).
              </p>
              <FactList
                facts={[
                  {
                    term: "Éditeur",
                    description: `${publisher.name}, société par actions simplifiée au capital de ${publisher.shareCapital.fr}, immatriculée au RCS de ${publisher.registryCity} sous le numéro ${publisher.siren} (SIRET ${publisher.siret}).`,
                  },
                  {
                    term: "Siège social",
                    description: `${publisher.address.street}, ${publisher.address.postalCode} ${publisher.address.city}`,
                  },
                  {
                    term: "TVA intracommunautaire",
                    description: publisher.vatNumber,
                  },
                  {
                    term: "Contact",
                    description: (
                      <>
                        {publisher.phone.national} · <EmailLink email={publisher.email} />
                      </>
                    ),
                  },
                  {
                    term: "Directeur de la publication",
                    description: `${publisher.director}, président.`,
                  },
                  {
                    term: "Hébergeur",
                    description: `${host.name}, société par actions simplifiée immatriculée au RCS de ${host.registryCity} sous le numéro ${host.siren}, ${host.address.street}, ${host.address.postalCode} ${host.address.city}, France. Téléphone : ${host.phone.national}.`,
                  },
                  {
                    term: "Données personnelles",
                    description: (
                      <>
                        Leur traitement est décrit dans la{" "}
                        <TextLink href="/privacy">politique de confidentialité</TextLink> (en
                        anglais). Pour exercer vos droits, écrivez à{" "}
                        <EmailLink email={publisher.email} />. Vous pouvez aussi introduire une
                        réclamation auprès de la {supervisoryAuthority.name}.
                      </>
                    ),
                  },
                  {
                    term: "Code source",
                    description: `Le code de ${siteConfig.name} est publié sous licence MIT. Une instance hébergée ailleurs que sur saas-monitor.com est éditée par la personne qui l’exploite.`,
                  },
                ]}
              />
            </>
          ),
        },
      ]}
    />
  );
}
