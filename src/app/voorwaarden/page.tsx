import type { Metadata } from "next";
import Link from "next/link";
import JuridischeLayout, { Sectie } from "@/components/JuridischeLayout";
import { VOORWAARDEN } from "@/lib/juridisch";

/* ──────────────────────────────────────────────────────────────────────────
   ALGEMENE VOORWAARDEN — alle tekst staat in dit bestand.
   Dit is een eerste, leesbare versie. Laat 'm vóór livegang nakijken door een
   jurist.

   ✅ BEDRIJFSGEGEVENS COMPLEET (5-8, aangeleverd door de eigenaar): naam, adres,
   KvK en e-mailadres. Avinka is de handelsnaam van een eenmanszaak. De versie
   is diezelfde dag gebumpt naar 2026-08-05 in lib/juridisch.ts — voorwaarden
   én privacy tegelijk, want ze delen deze gegevens.

   LET OP — een paar punten hieronder zijn niet alleen tekst maar ook proces,
   te bouwen bij Mollie (Fase 2):
   - Bedenktijd/herroeping (art. 5): de uitdrukkelijke instemming met directe
     levering + afstand van bedenktijd moet een aparte checkbox in het
     betaalproces zijn, met bevestiging per e-mail (duurzame drager).
   - De bestelknop moet expliciet een betaalverplichting tonen ("Bestelling met
     betalingsverplichting" / "Nu betalen").
   ────────────────────────────────────────────────────────────────────────── */

/* ⚠️ Deze vier moeten gelijk blijven met src/app/privacy/page.tsx. Ze staan
   bewust twee keer los (elk document is zelfstandig te lezen en aan te passen),
   dus wijzig je er één, wijzig dan allebei — en bump daarna één keer. */
const BEDRIJF = "Avinka";
const ADRES = "Evert van 't Landstraat 24, 7334 DR Apeldoorn";
const KVK = "42015989";
const CONTACT_EMAIL = "info@avinka.nl";
const BIJGEWERKT = VOORWAARDEN.weergave;

export const metadata: Metadata = {
  title: "Algemene voorwaarden — Avinka",
  description: "De afspraken voor het gebruik van Avinka, in gewone taal.",
};

export default function VoorwaardenPage() {
  return (
    <JuridischeLayout
      titel="Algemene voorwaarden"
      bijgewerkt={BIJGEWERKT}
      intro="Dit zijn de afspraken voor het gebruik van Avinka, zo helder mogelijk opgeschreven. Door een account aan te maken ga je hiermee akkoord. Voor hoe we met gegevens omgaan, zie de privacyverklaring."
    >
      <Sectie kop="1. Wie zijn wij?">
        {/* ⚠️ HERSCHREVEN toen de gegevens erin gingen: er stond "aangeboden
           door {'{BEDRIJF}'}", en de bedrijfsnaam ís Avinka. Ingevuld werd dat
           "Avinka ... aangeboden door Avinka". De naam staat er nu één keer. */}
        <p>
          {BEDRIJF} is een online platform met slimme tools voor leerkrachten,
          ingeschreven bij de Kamer van Koophandel onder nummer {KVK} en gevestigd aan{" "}
          {ADRES}. Heb je een vraag? Mail ons via <strong>{CONTACT_EMAIL}</strong>.
        </p>
      </Sectie>

      <Sectie kop="2. Je account">
        <p>
          Een account is <strong>persoonlijk</strong> en bedoeld voor één leerkracht. Je
          deelt je inloggegevens niet met anderen en gebruikt Avinka niet met meerdere
          leerkrachten op één account. Je bent zelf verantwoordelijk voor het geheimhouden
          van je wachtwoord. Je moet 18 jaar of ouder zijn om een account aan te maken en een
          abonnement af te sluiten.
        </p>
        <p>
          Om een account aan te maken geef je bij registratie akkoord op deze voorwaarden en
          de{" "}
          <Link href="/privacy" className="font-semibold text-brand hover:underline">
            privacyverklaring
          </Link>
          .
        </p>
      </Sectie>

      <Sectie kop="3. Abonnementen en proefperiode">
        <p>
          Avinka werkt met een abonnement. Je kunt kiezen uit verschillende pakketten en
          betalen per maand of per schooljaar. Wat elk pakket bevat en wat het kost (inclusief
          btw), lees je op onze startpagina; die prijzen gelden op het moment dat je je
          abonnement afsluit.
        </p>
        <p>
          We bieden een gratis proefperiode aan waarvoor je geen betaalgegevens hoeft op te
          geven. Na de proef loopt er niets automatisch door: je kiest zelf of je een betaald
          abonnement wilt. Tijdens de proef kan het gebruik beperkt zijn.
        </p>
      </Sectie>

      <Sectie kop="4. Betaling en opzeggen">
        <p>
          Betaling verloopt via onze betaaldienst (bijvoorbeeld met iDEAL). Na het afsluiten
          ontvang je een bevestiging per e-mail.
        </p>
        <p>
          Een <strong>maandabonnement</strong> kun je elke maand opzeggen. Bij een{" "}
          <strong>schooljaarabonnement</strong> loopt de eerste periode tot het einde van het
          schooljaar; verlengt het daarna, dan kun je vanaf dat moment op elk moment opzeggen
          met een opzegtermijn van maximaal één maand. Opzeggen kan eenvoudig in je account,
          op dezelfde manier als afsluiten, en zonder extra kosten. Na opzegging kun je de
          tools gebruiken tot het einde van de periode die je hebt betaald; een eventueel te
          veel vooruitbetaald deel betalen we terug.
        </p>
      </Sectie>

      <Sectie kop="5. Bedenktijd">
        <p>
          Sluit je een betaald abonnement af, dan heb je als consument in principe 14 dagen
          bedenktijd, waarin je de overeenkomst kosteloos kunt annuleren.
        </p>
        <p>
          Omdat je de tools meteen wilt kunnen gebruiken, vragen we je bij het afsluiten
          uitdrukkelijk in te stemmen met directe levering en daarmee afstand te doen van je
          bedenktijd. Stem je daarmee in, dan vervalt het herroepingsrecht zodra we de dienst
          leveren. Doe je dat niet, dan houd je de volledige 14 dagen bedenktijd. De gratis
          proefperiode staat hier los van: die is kosteloos en kun je altijd laten aflopen.
        </p>
      </Sectie>

      <Sectie kop="6. Goed gebruik">
        <p>Je gebruikt Avinka zoals het bedoeld is. Je gaat ermee akkoord dat je:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>geen bijzondere persoonsgegevens (zoals diagnoses of medische informatie) in de tools zet;</li>
          <li>de tools niet misbruikt, niet probeert te omzeilen of overmatig te belasten;</li>
          <li>de tools niet gebruikt om er een concurrerende dienst of een eigen AI-model mee te bouwen of te trainen;</li>
          <li>geen onrechtmatige, beledigende of schadelijke inhoud genereert of verspreidt;</li>
          <li>geen account aanmaakt met valse gegevens of meerdere accounts om regels of beloningen te omzeilen;</li>
          <li>je account niet deelt met collega&rsquo;s. Een abonnement is persoonlijk en bedoeld voor jouw eigen groep.</li>
        </ul>
        <p>
          <strong>Eerlijk gebruik van de AI-functies.</strong> Het schrijven van teksten
          door AI kost ons per keer geld. Om te voorkomen dat accounts worden gedeeld of
          dat het gebruik ontspoort, geldt er een redelijkheidsgrens per account per
          kalendermaand. Die grens is ruim gekozen: normaal gebruik door één leerkracht
          loopt er niet tegenaan, ook niet in een drukke rapportperiode. Je actuele stand
          zie je altijd terug in je instellingen, onder &ldquo;Verbruik&rdquo;. Kom je
          toch aan de grens, dan zie je dat in de tool en kun je wachten tot de volgende
          maand, extra ruimte bijkopen of overstappen naar een ruimer abonnement. We
          passen deze grens niet met terugwerkende kracht aan in jouw nadeel binnen een
          lopende maand.
        </p>
        <p>
          Bij ernstig of herhaald misbruik kunnen we een account beperken of beëindigen.
        </p>
      </Sectie>

      <Sectie kop="7. Jij blijft eindverantwoordelijk">
        <p>
          Avinka gebruikt AI om teksten te schrijven. Die teksten zijn een hulpmiddel, geen
          eindproduct: we leveren ze &ldquo;zoals ze zijn&rdquo; en geven geen garantie dat
          ze feitelijk juist, volledig of foutloos zijn. AI kan zich vergissen of dingen
          onhandig formuleren. Lees alles na en gebruik je eigen oordeel voordat je iets
          overneemt of verstuurt; jij blijft eindverantwoordelijk.
        </p>
        <p>
          Gebruik een AI-tekst nooit als doorslaggevende grond voor een ingrijpende
          beslissing over een kind (zoals doublure, verwijzing of een oordeel in een
          dossier). De tekst ondersteunt jouw professionele afweging, maar vervangt die niet.
        </p>
      </Sectie>

      <Sectie kop="8. Wat je met Avinka maakt">
        <p>
          De teksten die je met Avinka maakt, zijn van jou. Je mag ze vrij gebruiken in je
          werk. Houd er wel rekening mee dat AI vergelijkbare teksten kan maken voor anderen,
          waardoor een tekst niet altijd als uniek of auteursrechtelijk beschermd kan worden
          beschouwd.
        </p>
        <p>
          De rechten op Avinka zelf (de software, het ontwerp en de inhoud van het platform)
          blijven van ons. Je krijgt het recht om Avinka tijdens je abonnement te gebruiken; je
          neemt het platform zelf niet over of na.
        </p>
      </Sectie>

      <Sectie kop="9. Gegevens van je leerlingen">
        <p>
          Voor de gegevens van je leerlingen ben jij (samen met je school) de
          verantwoordelijke en is Avinka de verwerker: we verwerken die gegevens alleen om de
          tools te laten werken, in jouw opdracht. Hoe we dat doen en hoe we ze beveiligen,
          staat in de{" "}
          <Link href="/privacy" className="font-semibold text-brand hover:underline">
            privacyverklaring
          </Link>
          , die onderdeel is van deze voorwaarden. Heb je voor je school een aparte
          verwerkersovereenkomst nodig, dan stellen we die op verzoek beschikbaar.
        </p>
      </Sectie>

      <Sectie kop="10. Beschikbaarheid en aansprakelijkheid">
        <p>
          We doen ons best om Avinka goed te laten werken, maar kunnen niet garanderen dat het
          altijd zonder onderbreking of fouten beschikbaar is. Soms is er onderhoud.
        </p>
        <p>
          We zijn niet aansprakelijk voor indirecte schade of voor gevolgen van teksten die je
          zonder controle hebt overgenomen. Voor het overige is onze aansprakelijkheid beperkt
          tot het bedrag dat je in de twaalf maanden vóór de schade aan ons hebt betaald. Deze
          beperkingen gelden niet bij opzet of bewuste roekeloosheid van onze kant, en niet
          voor zover de wet ze niet toestaat.
        </p>
      </Sectie>

      <Sectie kop="11. Klachten en geschillen">
        <p>
          Ben je ergens niet tevreden over? Laat het ons weten via {CONTACT_EMAIL}. We
          reageren zo snel mogelijk, in de regel binnen veertien dagen, en zoeken samen met
          je naar een oplossing.
        </p>
        <p>
          Komen we er samen niet uit, dan kun je je geschil ook voorleggen via het Europese
          platform voor onlinegeschillenbeslechting (ec.europa.eu/consumers/odr).
        </p>
      </Sectie>

      <Sectie kop="12. Wijzigingen">
        <p>
          We kunnen deze voorwaarden en de tools van tijd tot tijd aanpassen, bijvoorbeeld
          als we een nieuwe tool toevoegen. Een prijswijziging of een wijziging in je nadeel
          kondigen we vooraf aan. Ga je niet akkoord, dan kun je je abonnement opzeggen
          voordat de wijziging ingaat. Bij belangrijke wijzigingen laten we het je weten. De
          datum bovenaan toont de laatste versie.
        </p>
      </Sectie>

      <Sectie kop="13. Toepasselijk recht">
        <p>
          Op deze voorwaarden is het Nederlands recht van toepassing. Dit ontneemt je niet de
          bescherming van dwingende regels van consumentenrecht. Komen we er samen niet uit,
          dan leggen we een geschil voor aan de bevoegde rechter.
        </p>
      </Sectie>
    </JuridischeLayout>
  );
}
