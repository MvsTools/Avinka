import type { Metadata } from "next";
import Link from "next/link";
import JuridischeLayout, { Sectie } from "@/components/JuridischeLayout";
import { PRIVACY } from "@/lib/juridisch";

/* ──────────────────────────────────────────────────────────────────────────
   PRIVACYVERKLARING — alle tekst staat in dit bestand.
   Wil je een zin aanpassen? Pas het hier aan.

   NOG IN TE VULLEN vóór livegang (nu nog placeholders tussen [haakjes]):
   - [bedrijfsnaam] · [adres] · [KvK] · [privacy-e-mailadres]
   - Controleer of de genoemde leveranciers (Supabase, Anthropic, Mollie) kloppen
     met wat er live draait, en houd de sub-verwerkerslijst actueel.
   - Laat de definitieve tekst vóór livegang nakijken door een privacyjurist.

   GEBOUWD (2-7): zelf-service account verwijderen + data-export in Instellingen
   (art. 15/17/20). Account verwijderen leunt op de SQL-functie
   `verwijder_mijn_account()` (security definer) — die is in de database gedraaid.
   Bij een nieuwe/lege database moet die functie opnieuw aangemaakt worden.

   NOG TE BOUWEN:
   - Toestemming vastleggen bij registratie (datum + versie), voor art. 7-verantwoording.
   ────────────────────────────────────────────────────────────────────────── */

const BEDRIJF = "[bedrijfsnaam]";
const ADRES = "[adres]";
const KVK = "[KvK-nummer]";
const CONTACT_EMAIL = "[privacy-e-mailadres]";
const BIJGEWERKT = PRIVACY.weergave;

export const metadata: Metadata = {
  title: "Privacyverklaring — Avinka",
  description:
    "Hoe Avinka omgaat met jouw gegevens en die van je leerlingen. Privacy is bij Avinka de ruggengraat, geen bijzaak.",
};

export default function PrivacyPage() {
  return (
    <JuridischeLayout
      titel="Privacyverklaring"
      bijgewerkt={BIJGEWERKT}
      intro="Privacy is bij Avinka niet een vinkje achteraf, maar het uitgangspunt waarop alles is gebouwd. Hieronder lees je in gewone taal welke gegevens we verwerken, waarom, op welke grond, hoe lang, en welke rechten je hebt. Geen juridisch jargon waar het niet hoeft."
    >
      <Sectie kop="1. In het kort">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Namen van leerlingen worden op jouw eigen apparaat onleesbaar gemaakt
            (vervangen door codes) <strong>voordat</strong> er iets naar de AI gaat. De AI
            ziet dus nooit wie wie is.
          </li>
          <li>
            We slaan zo min mogelijk op, en het gevoeligste werk (toetsanalyses met
            cijfers) verlaat je apparaat niet; dat download je zelf.
          </li>
          <li>Je gegevens staan op beveiligde servers binnen de Europese Unie (Frankfurt, Duitsland).</li>
          <li>We verkopen je gegevens nooit en gebruiken ze niet voor advertenties.</li>
          <li>We nemen geen automatische beslissingen over jou of je leerlingen.</li>
          <li>Je kunt je gegevens altijd inzien, corrigeren of laten verwijderen.</li>
        </ul>
      </Sectie>

      <Sectie kop="2. Wie is verantwoordelijk?">
        <p>
          Avinka is een dienst van {BEDRIJF}, {ADRES} (KvK {KVK}). Voor vragen over je privacy
          of dit document bereik je ons via <strong>{CONTACT_EMAIL}</strong>.
        </p>
        <p>
          Het is goed om twee rollen uit elkaar te houden:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Voor jouw <strong>eigen accountgegevens</strong> (naam, e-mail, abonnement) zijn
            wij de <em>verwerkingsverantwoordelijke</em>.
          </li>
          <li>
            Voor de <strong>gegevens van je leerlingen</strong> ben jij als leerkracht (samen
            met je school) de verantwoordelijke, en is Avinka de <em>verwerker</em>: wij
            verwerken die alleen in jouw opdracht, om de tools te laten werken.
          </li>
        </ul>
        <p>
          De afspraken hierover staan in onze{" "}
          <Link href="/voorwaarden" className="font-semibold text-brand hover:underline">
            voorwaarden en verwerkersafspraken
          </Link>
          , die je bij het aanmaken van een account accepteert. Heb je voor je school een
          aparte verwerkersovereenkomst nodig, dan stellen we die op verzoek beschikbaar.
        </p>
      </Sectie>

      <Sectie kop="3. Welke gegevens verwerken we?">
        <p>We onderscheiden bewust drie soorten gegevens.</p>

        <h3 className="pt-2 font-bold text-ink">1. Je accountgegevens</h3>
        <p>
          Om je account te laten werken bewaren we je <strong>voornaam</strong>, je{" "}
          <strong>e-mailadres</strong>, een versleuteld wachtwoord en je voorkeuren
          (zoals je groep en je schrijfinstellingen). Kies je bij je profiel een school,
          dan bewaren we ook de naam van die school en de bijbehorende openbare
          onderwijscodes (BRIN en vestiging) uit het openbare register van DUO; dat helpt
          ons je schoolnaam eenduidig te herkennen. Nodig je een collega uit, dan hoort daar
          een uitnodigingscode bij. Deze gegevens gebruiken we om je te laten inloggen, je
          abonnement te beheren en je belangrijke berichten te sturen. Zonder deze gegevens
          kunnen we de dienst niet leveren.
        </p>

        <h3 className="pt-2 font-bold text-ink">2. Gegevens over je leerlingen</h3>
        <p>
          Deze gegevens vul jij zelf in; ze komen dus via jou bij ons binnen. Hier zijn we zo
          terughoudend mogelijk en bewaren we alleen:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Voornamen van je klas</strong> (en eventueel of een kind een jongen of
            meisje is), zodat de tools je werk kunnen voorvullen en plattegronden kunnen
            maken.
          </li>
          <li>
            <strong>Concept-rapportteksten</strong> die je in Rapporten maakt, zodat je
            er over meerdere dagen aan kunt werken zonder iets kwijt te raken. Deze worden
            automatisch verwijderd na 90 dagen (zie hieronder).
          </li>
          <li>
            <strong>Klasplattegronden</strong> die je opslaat, met de voornamen die je daarin
            hebt gezet.
          </li>
          <li>
            <strong>De overdracht</strong> voor collega&apos;s met wie je een groep deelt:
            één kort bericht per persoon, dat wordt vervangen zodra diegene een nieuw bericht
            stuurt. Er blijft dus geen geschiedenis staan, en na 30 dagen zonder wijziging
            verdwijnt het bericht vanzelf.
          </li>
        </ul>
        <p>
          Wat we <strong>bewust níét</strong> automatisch bewaren: toetsanalyses met cijfers
          en niveaus per kind. Die zijn gevoeliger, dus die blijven op je eigen apparaat:
          je downloadt ze zelf. En <strong>nooit</strong> bijzondere persoonsgegevens zoals
          diagnoses, medische informatie of dossiers. De tools sturen je er actief op aan om
          die er niet in te zetten.
        </p>

        <h3 className="pt-2 font-bold text-ink">3. Je eigen teksten en gebruiksgegevens</h3>
        <p>
          Teksten die niet over een specifiek kind gaan (zoals een weekbericht zonder namen
          of een eigen sjabloon) kun je opslaan in &ldquo;Bestanden&rdquo;. Daarnaast houden
          we wat eenvoudige gebruiksgegevens bij, zoals hoe vaak je een tool gebruikt, je
          activiteitenreeks (&ldquo;streak&rdquo;) en behaalde beloningen, om je voortgang
          te tonen en het platform te verbeteren.
        </p>
        <p>
          Om het platform veilig en betaalbaar te houden, leggen we per AI-verzoek een paar
          technische gegevens vast: welke tool je gebruikte, welk AI-model, en hoeveel tekst
          er verwerkt is (in &ldquo;tokens&rdquo;). We bewaren daarbij <strong>nooit</strong>{" "}
          de inhoud van je verzoek of het antwoord, alleen deze tellingen.
        </p>
        <p>
          Stuur je ons feedback of een idee, dan bewaren we je bericht samen met je account,
          zodat we je kunnen terugmailen. Laat je een review achter, dan tonen we die alleen
          openbaar (met je voornaam) als je daar zelf uitdrukkelijk voor kiest; je kunt dat
          altijd weer intrekken.
        </p>
      </Sectie>

      <Sectie kop="4. Op welke grond verwerken we je gegevens?">
        <p>De privacywet (AVG) vraagt dat we per doel een grondslag hebben. Voor ons zijn dat:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Om onze overeenkomst uit te voeren</strong>: je account, je abonnement en
            het laten werken van de tools.
          </li>
          <li>
            <strong>Vanuit een gerechtvaardigd belang</strong>: een beperkte hoeveelheid
            gebruiksgegevens om het platform veilig te houden, misbruik te voorkomen en het
            te verbeteren.
          </li>
          <li>
            <strong>Met jouw toestemming</strong>: alleen waar we daar uitdrukkelijk om
            vragen. Die toestemming kun je altijd weer intrekken, net zo makkelijk als je
            haar gaf.
          </li>
          <li>
            <strong>Om aan een wettelijke plicht te voldoen</strong>: bijvoorbeeld onze
            belastingadministratie.
          </li>
        </ul>
      </Sectie>

      <Sectie kop="5. Hoe beschermen we de namen van je leerlingen?">
        <p>
          Dit is het hart van Avinka. Voordat er ook maar iets naar de AI wordt gestuurd om
          een tekst te schrijven, vervangt de tool de leerlingnamen automatisch door codes
          (LL-01, LL-02 …). Dat gebeurt lokaal, op jouw apparaat. De AI ziet dus alleen
          codes en getallen, nooit echte namen. Pas in jóuw eigen document worden de namen
          weer teruggezet.
        </p>
        <p>
          De voornamen die je in je klas hebt gezet, worden bovendien in alle
          gevallen gemaskeerd, in welke tool en waar je ze ook invult, en ook als je
          ze per ongeluk met een kleine letter typt.
        </p>
        <p>
          Daarnaast geldt: de code rekent, de AI schrijft. Alle scores, niveaus en
          percentages worden door de tool zelf berekend. De AI verzint nooit cijfers; die
          schrijft alleen de begeleidende tekst bij de getallen die de tool aanlevert.
        </p>
      </Sectie>

      <Sectie kop="6. Hoe beveiligen we je gegevens?">
        <p>
          We nemen passende technische en organisatorische maatregelen om je gegevens te
          beschermen: verbindingen verlopen versleuteld (https), wachtwoorden bewaren we
          alleen versleuteld, de toegang tot gegevens is beperkt tot wat nodig is, en alles
          staat op beveiligde servers binnen de EU.
        </p>
        <p>
          Mocht er ondanks alles toch een datalek met risico voor jou of je leerlingen
          plaatsvinden, dan informeren we je zo snel mogelijk en melden we het waar nodig bij
          de Autoriteit Persoonsgegevens, zodat ook jij je eigen meldplicht kunt nakomen.
        </p>
      </Sectie>

      <Sectie kop="7. Met welke partijen delen we gegevens?">
        <p>
          We verkopen je gegevens nooit. We schakelen wel een beperkt aantal betrouwbare
          partijen in die nodig zijn om Avinka te laten draaien (&ldquo;verwerkers&rdquo;).
          Met elk van hen zijn verwerkersafspraken gemaakt:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Hosting en database</strong> (Supabase): voor het opslaan van je account
            en gegevens, binnen de EU (Frankfurt, Duitsland).
          </li>
          <li>
            <strong>De AI-leverancier</strong> (Anthropic): voor het schrijven van de teksten.
            Deze ontvangt alleen de gemaskeerde gegevens (codes in plaats van namen) en mag
            jouw invoer contractueel niet gebruiken om modellen te trainen of te verbeteren.
            We werken bewust met de zakelijke variant waarin die afspraak vastligt, niet met
            een gewone consumentenversie.
          </li>
          <li>
            <strong>De betaaldienst</strong> (Mollie): voor het afhandelen van je abonnement.
            Deze ontvangt alleen wat nodig is voor de betaling, nooit leerlinggegevens.
          </li>
          <li>
            <strong>Een e-maildienst</strong>: voor systeemberichten zoals een
            bevestigingsmail of een herstellink.
          </li>
        </ul>
        <p>
          Een actueel overzicht van de partijen die wij inschakelen, kun je bij ons opvragen.
        </p>
      </Sectie>

      <Sectie kop="8. Verwerken we gegevens buiten de EU?">
        <p>
          Je account en je opgeslagen gegevens blijven binnen de Europese Unie (Duitsland).
        </p>
        <p>
          Er is één uitzondering: de AI-leverancier verwerkt de gemaskeerde gegevens (codes,
          nooit namen) mede buiten de EU, in de Verenigde Staten. Daarvoor gelden door de
          Europese Commissie goedgekeurde standaardcontractbepalingen (SCC&apos;s) als
          wettelijke waarborg. Omdat het alleen om codes gaat, zijn die gegevens daar niet
          tot een kind te herleiden.
        </p>
      </Sectie>

      <Sectie kop="9. Hoe lang bewaren we je gegevens?">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Concept-rapportteksten:</strong> maximaal 90 dagen na de laatste
            bewerking, daarna worden ze automatisch verwijderd. Geen permanent archief van
            leerlinggegevens.
          </li>
          <li>
            <strong>De overdracht:</strong> maximaal 30 dagen na het laatste bericht, en
            eerder als diezelfde persoon een nieuw bericht stuurt (dat vervangt het oude).
          </li>
          <li>
            <strong>Account-, klas- en eigen gegevens:</strong> zolang je een account hebt.
            Verwijder je je account, dan verwijderen we deze gegevens.
          </li>
          <li>
            <strong>Technische gebruiks- en AI-logs</strong> (tellingen, geen inhoud):
            maximaal 24 maanden, voor beveiliging, foutopsporing en facturatie.
          </li>
          <li>
            <strong>Feedback die je ons stuurt:</strong> zolang die nuttig is om het platform
            te verbeteren, en niet langer dan nodig.
          </li>
          <li>
            <strong>Betaal- en factuurgegevens:</strong> zolang de belastingwet ons
            verplicht ze te bewaren (7 jaar).
          </li>
        </ul>
      </Sectie>

      <Sectie kop="10. Welke rechten heb je?">
        <p>Op grond van de privacywet (AVG) heb je het recht om:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>je gegevens in te zien;</li>
          <li>onjuiste gegevens te laten corrigeren;</li>
          <li>je gegevens te laten verwijderen;</li>
          <li>de verwerking te laten beperken;</li>
          <li>je gegevens mee te nemen (overdraagbaarheid);</li>
          <li>bezwaar te maken tegen bepaalde verwerkingen;</li>
          <li>een gegeven toestemming weer in te trekken.</li>
        </ul>
        <p>
          Veel kun je zelf direct in het platform doen. Bij{" "}
          <strong>Instellingen &rsaquo; Mijn gegevens</strong> zie je in een leesbaar overzicht
          precies wat we van je bewaren, dat je ook kunt downloaden (inzage en
          overdraagbaarheid), en kun je je hele account,
          met alle bijbehorende gegevens, definitief laten verwijderen. Je klas, je
          opgeslagen teksten en je plattegronden verwijder je daar los van ook op elk moment
          zelf. Kom je ergens niet uit, of wil je iets anders regelen, mail dan{" "}
          {CONTACT_EMAIL}; we handelen zo&apos;n verzoek uiterlijk binnen 30 dagen af. Ben je
          het ergens niet mee eens, dan kun je ook een klacht indienen bij de Autoriteit
          Persoonsgegevens (autoriteitpersoonsgegevens.nl).
        </p>
      </Sectie>

      <Sectie kop="11. Geen automatische beslissingen">
        <p>
          Avinka neemt geen geautomatiseerde besluiten met rechtsgevolgen of vergelijkbare
          gevolgen over jou of je leerlingen. De AI schrijft tekst als hulpmiddel;
          beslissingen blijven altijd bij jou.
        </p>
      </Sectie>

      <Sectie kop="12. Cookies">
        <p>
          Avinka gebruikt alleen functionele cookies die nodig zijn om je ingelogd te houden.
          We gebruiken geen advertentie- of trackingcookies en volgen je niet over andere
          websites.
        </p>
      </Sectie>

      <Sectie kop="13. Wijzigingen">
        <p>
          We kunnen deze verklaring soms aanpassen, bijvoorbeeld als we een nieuwe tool
          toevoegen. De datum bovenaan laat zien wanneer we voor het laatst iets hebben
          gewijzigd. Bij belangrijke wijzigingen laten we het je weten.
        </p>
      </Sectie>

      <Sectie kop="14. Eerlijk over de grenzen">
        <p>
          Geen enkele digitale tool kan 100% garanderen. Wij nemen passende maatregelen om
          de risico&apos;s zo klein mogelijk te maken, precies zoals de AVG vraagt. Zo houden
          we het samen veilig.
        </p>
      </Sectie>
    </JuridischeLayout>
  );
}
