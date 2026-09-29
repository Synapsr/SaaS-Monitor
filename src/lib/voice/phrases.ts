import { createRandom } from "@/lib/display/random";
import {
  ANNOUNCEMENT_VARIABLES,
  VARIABLES,
  type Announcement,
  type Phrase,
  type Variable,
} from "./announcements";
import type { VoiceLanguage } from "./voices";

/**
 * What voices say. Without a Gradium API key, screens play recorded clips of `RECORDED_PHRASES`.
 * With one, the server synthesizes each announcement as it happens: a screen's own phrases, or
 * `DEFAULT_PHRASES`, with the customer's name, the amount or the plan in them.
 */

/** Word for word what the recorded clips say (`public/voices/<voice>/<phrase>.mp3`). */
export const RECORDED_PHRASES: Record<VoiceLanguage, Record<Phrase, string>> = {
  en: {
    payment: "Payment received!",
    connectPayment: "New payment for a connected account.",
    subscription: "New subscriber!",
    upgrade: "A customer just upgraded!",
    reactivation: "A subscriber is back!",
    downgrade: "A subscription was downgraded.",
    cancellation: "A subscription was canceled.",
    customer: "New customer!",
    milestone: "New milestone reached!",
    goal: "Goal reached! Congratulations, team!",
  },
  fr: {
    payment: "Paiement reçu !",
    connectPayment: "Nouveau paiement pour un compte connecté.",
    subscription: "Nouvel abonné !",
    upgrade: "Un client passe à l’offre supérieure !",
    reactivation: "Un abonné est de retour !",
    downgrade: "Un abonnement passe à une offre inférieure.",
    cancellation: "Un abonnement a été résilié.",
    customer: "Nouveau client !",
    milestone: "Nouveau palier atteint !",
    goal: "Objectif atteint ! Bravo à toute l’équipe !",
  },
  de: {
    payment: "Zahlung eingegangen!",
    connectPayment: "Neue Zahlung für ein verbundenes Konto.",
    subscription: "Neuer Abonnent!",
    upgrade: "Ein Kunde hat sein Abo erweitert!",
    reactivation: "Ein Abonnent ist zurück!",
    downgrade: "Ein Abo wurde herabgestuft.",
    cancellation: "Ein Abo wurde gekündigt.",
    customer: "Neuer Kunde!",
    milestone: "Neuer Meilenstein erreicht!",
    goal: "Ziel erreicht! Glückwunsch an das ganze Team!",
  },
  es: {
    payment: "¡Pago recibido!",
    connectPayment: "Nuevo pago para una cuenta conectada.",
    subscription: "¡Nuevo suscriptor!",
    upgrade: "¡Un cliente acaba de mejorar su plan!",
    reactivation: "¡Un suscriptor ha vuelto!",
    downgrade: "Una suscripción ha bajado de plan.",
    cancellation: "Se ha cancelado una suscripción.",
    customer: "¡Nuevo cliente!",
    milestone: "¡Nuevo hito alcanzado!",
    goal: "¡Objetivo alcanzado! ¡Enhorabuena a todo el equipo!",
  },
  pt: {
    payment: "Pagamento recebido!",
    connectPayment: "Novo pagamento para uma conta conectada.",
    subscription: "Novo assinante!",
    upgrade: "Um cliente acabou de fazer upgrade!",
    reactivation: "Um assinante voltou!",
    downgrade: "Uma assinatura mudou para um plano inferior.",
    cancellation: "Uma assinatura foi cancelada.",
    customer: "Novo cliente!",
    milestone: "Novo marco alcançado!",
    goal: "Meta alcançada! Parabéns a toda a equipe!",
  },
};

/**
 * What a voice says when the server synthesizes it and the screen has no phrase of its own: the
 * first phrase whose details are all known. The last of each needs nothing Stripe may lack.
 */
export const DEFAULT_PHRASES: Record<VoiceLanguage, Record<Phrase, readonly string[]>> = {
  en: {
    payment: ["{name} just paid {amount}!", "Payment received: {amount}!"],
    connectPayment: [
      "{name} paid {amount} to a connected account.",
      "New payment of {amount} for a connected account.",
    ],
    subscription: [
      "New subscriber! {name} just joined {plan}.",
      "New subscriber on {plan}, for {amount}!",
      "New subscriber, for {amount}!",
    ],
    upgrade: [
      "{name} just upgraded to {plan}!",
      "A customer just upgraded to {plan}!",
      "A customer just upgraded!",
    ],
    reactivation: [
      "Welcome back, {name}!",
      "A subscriber is back on {plan}!",
      "A subscriber is back!",
    ],
    downgrade: [
      "{name} moved down to {plan}.",
      "A subscription moved down to {plan}.",
      "A subscription was downgraded.",
    ],
    cancellation: [
      "{name} canceled their subscription.",
      "A {plan} subscription was canceled.",
      "A subscription was canceled.",
    ],
    customer: ["New customer: welcome, {name}!", "New customer!"],
    milestone: ["New milestone reached: {amount}!"],
    goal: ["Goal reached: {amount}! Congratulations, team!"],
  },
  fr: {
    payment: ["{name} vient de payer {amount} !", "Paiement reçu : {amount} !"],
    connectPayment: [
      "{name} a payé {amount} à un compte connecté.",
      "Nouveau paiement de {amount} pour un compte connecté.",
    ],
    subscription: [
      "Nouvel abonné ! {name} rejoint l’offre {plan}.",
      "Nouvel abonné sur l’offre {plan}, pour {amount} !",
      "Nouvel abonné, pour {amount} !",
    ],
    upgrade: [
      "{name} passe à l’offre {plan} !",
      "Un client passe à l’offre {plan} !",
      "Un client passe à l’offre supérieure !",
    ],
    reactivation: [
      "Bon retour, {name} !",
      "Un abonné revient sur l’offre {plan} !",
      "Un abonné est de retour !",
    ],
    downgrade: [
      "{name} passe à l’offre {plan}.",
      "Un abonnement passe à l’offre {plan}.",
      "Un abonnement passe à une offre inférieure.",
    ],
    cancellation: [
      "{name} a résilié son abonnement.",
      "Un abonnement {plan} a été résilié.",
      "Un abonnement a été résilié.",
    ],
    customer: ["Nouveau client : bienvenue, {name} !", "Nouveau client !"],
    milestone: ["Nouveau palier atteint : {amount} !"],
    goal: ["Objectif atteint : {amount} ! Bravo à toute l’équipe !"],
  },
  de: {
    payment: ["{name} hat gerade {amount} bezahlt!", "Zahlung eingegangen: {amount}!"],
    connectPayment: [
      "{name} hat {amount} an ein verbundenes Konto gezahlt.",
      "Neue Zahlung von {amount} für ein verbundenes Konto.",
    ],
    subscription: [
      "Neuer Abonnent! {name} startet mit {plan}.",
      "Neuer Abonnent für {plan}: {amount}!",
      "Neuer Abonnent: {amount}!",
    ],
    upgrade: [
      "{name} wechselt zu {plan}!",
      "Ein Kunde wechselt zu {plan}!",
      "Ein Kunde hat sein Abo erweitert!",
    ],
    reactivation: [
      "Willkommen zurück, {name}!",
      "Ein Abonnent ist zurück bei {plan}!",
      "Ein Abonnent ist zurück!",
    ],
    downgrade: [
      "{name} wechselt zu {plan}.",
      "Ein Abo wechselt zu {plan}.",
      "Ein Abo wurde herabgestuft.",
    ],
    cancellation: [
      "{name} hat das Abo gekündigt.",
      "Ein {plan}-Abo wurde gekündigt.",
      "Ein Abo wurde gekündigt.",
    ],
    customer: ["Neuer Kunde: Willkommen, {name}!", "Neuer Kunde!"],
    milestone: ["Neuer Meilenstein erreicht: {amount}!"],
    goal: ["Ziel erreicht: {amount}! Glückwunsch an das ganze Team!"],
  },
  es: {
    payment: ["¡{name} acaba de pagar {amount}!", "¡Pago recibido: {amount}!"],
    connectPayment: [
      "{name} ha pagado {amount} a una cuenta conectada.",
      "Nuevo pago de {amount} para una cuenta conectada.",
    ],
    subscription: [
      "¡Nuevo suscriptor! {name} se une al plan {plan}.",
      "¡Nuevo suscriptor en el plan {plan}, por {amount}!",
      "¡Nuevo suscriptor, por {amount}!",
    ],
    upgrade: [
      "¡{name} se pasa al plan {plan}!",
      "¡Un cliente se pasa al plan {plan}!",
      "¡Un cliente acaba de mejorar su plan!",
    ],
    reactivation: [
      "¡Bienvenido de nuevo, {name}!",
      "¡Un suscriptor vuelve al plan {plan}!",
      "¡Un suscriptor ha vuelto!",
    ],
    downgrade: [
      "{name} se pasa al plan {plan}.",
      "Una suscripción se pasa al plan {plan}.",
      "Una suscripción ha bajado de plan.",
    ],
    cancellation: [
      "{name} ha cancelado su suscripción.",
      "Se ha cancelado una suscripción {plan}.",
      "Se ha cancelado una suscripción.",
    ],
    customer: ["Nuevo cliente: ¡bienvenido, {name}!", "¡Nuevo cliente!"],
    milestone: ["¡Nuevo hito alcanzado: {amount}!"],
    goal: ["¡Objetivo alcanzado: {amount}! ¡Enhorabuena a todo el equipo!"],
  },
  pt: {
    payment: ["{name} acabou de pagar {amount}!", "Pagamento recebido: {amount}!"],
    connectPayment: [
      "{name} pagou {amount} para uma conta conectada.",
      "Novo pagamento de {amount} para uma conta conectada.",
    ],
    subscription: [
      "Novo assinante! {name} entrou no plano {plan}.",
      "Novo assinante no plano {plan}, por {amount}!",
      "Novo assinante, por {amount}!",
    ],
    upgrade: [
      "{name} mudou para o plano {plan}!",
      "Um cliente mudou para o plano {plan}!",
      "Um cliente acabou de fazer upgrade!",
    ],
    reactivation: [
      "Bem-vindo de volta, {name}!",
      "Um assinante voltou para o plano {plan}!",
      "Um assinante voltou!",
    ],
    downgrade: [
      "{name} mudou para o plano {plan}.",
      "Uma assinatura mudou para o plano {plan}.",
      "Uma assinatura mudou para um plano inferior.",
    ],
    cancellation: [
      "{name} cancelou a assinatura.",
      "Uma assinatura {plan} foi cancelada.",
      "Uma assinatura foi cancelada.",
    ],
    customer: ["Novo cliente: bem-vindo, {name}!", "Novo cliente!"],
    milestone: ["Novo marco alcançado: {amount}!"],
    goal: ["Meta alcançada: {amount}! Parabéns a toda a equipe!"],
  },
};

/**
 * On a screen with several products, a default phrase starts with the one it is about: "Acme
 * Mail: new subscriber!". A screen's own phrases name it where they like, with `{product}`.
 */
const PRODUCT_PREFIX: Record<VoiceLanguage, string> = {
  en: "{product}: ",
  fr: "{product} : ",
  de: "{product}: ",
  es: "{product}: ",
  pt: "{product}: ",
};

export function defaultPhrases(
  language: VoiceLanguage,
  phrase: Phrase,
  options: { severalProducts: boolean },
): string[] {
  const phrases = DEFAULT_PHRASES[language][phrase];
  if (!options.severalProducts) return [...phrases];
  return phrases.map((text) => `${PRODUCT_PREFIX[language]}${text}`);
}

/** `{name}`, and misspellings such as `{Name}` or `{}`, to report them. */
const VARIABLE_PATTERN = /\{([^{}]*)\}/g;

function isVariable(name: string): name is Variable {
  return VARIABLES.some((variable) => variable === name);
}

/** The details a phrase says, and what it writes between braces that is not one. */
export function phraseVariables(phrase: string): { variables: Variable[]; unknown: string[] } {
  const variables: Variable[] = [];
  const unknown: string[] = [];
  for (const [, name] of phrase.matchAll(VARIABLE_PATTERN)) {
    if (isVariable(name)) {
      if (!variables.includes(name)) variables.push(name);
    } else if (!unknown.includes(name)) {
      unknown.push(name);
    }
  }
  return { variables, unknown };
}

/**
 * Why a phrase can't be said for an announcement, in a sentence for the settings; `null` when it
 * can. Details Stripe may lack (a hidden name) are fine: the phrase is skipped when they are.
 */
export function phraseProblem(phrase: string, announcement: Announcement): string | null {
  const { variables, unknown } = phraseVariables(phrase);
  const known = ANNOUNCEMENT_VARIABLES[announcement];
  const list = known.map((variable) => `{${variable}}`).join(", ");
  if (unknown.length > 0) return `{${unknown[0]}} is not a detail. Use ${list}.`;
  const unavailable = variables.find((variable) => !known.includes(variable));
  if (unavailable) return `{${unavailable}} is not known here. Use ${list}.`;
  return null;
}

/** The details of an announcement, as they are said; `null` or absent when unknown. */
export type PhraseValues = Partial<Record<Variable, string | null>>;

/**
 * `phrase` with its details written in, or `null` when one of them is unknown: better to say
 * another phrase than "welcome, {name}" to a customer whose name is hidden.
 */
export function fillPhrase(phrase: string, values: PhraseValues): string | null {
  let complete = true;
  const text = phrase.replace(VARIABLE_PATTERN, (_, name: string) => {
    const value = isVariable(name) ? values[name] : null;
    if (!value) complete = false;
    return value ?? "";
  });
  const spoken = speakable(text);
  return complete && spoken !== "" ? spoken : null;
}

/**
 * Formatting spaces (narrow no-break spaces of French amounts, "49 €") read as plain ones, and
 * a phrase typed with stray spaces reads clean.
 */
function speakable(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * What a voice says: one of the screen's own phrases whose details are known, picked at random
 * (the same pick on every display of the screen, from `seed`), else the first default phrase
 * that can be said.
 */
export function chooseSpeech({
  own,
  defaults,
  values,
  seed,
}: {
  own: readonly string[];
  defaults: readonly string[];
  values: PhraseValues;
  seed: string;
}): string | null {
  const candidates = own.flatMap((phrase) => fillPhrase(phrase, values) ?? []);
  if (candidates.length > 0) {
    const random = createRandom(hash(seed));
    return candidates[Math.floor(random() * candidates.length)];
  }
  for (const phrase of defaults) {
    const text = fillPhrase(phrase, values);
    if (text !== null) return text;
  }
  return null;
}

/** FNV-1a: a stable number from a string, to seed a pick. */
function hash(value: string): number {
  let result = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 0x01000193);
  }
  return result >>> 0;
}
