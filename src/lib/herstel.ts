// De naam van het koekje waarin we onthouden vóór welk adres er een herstelmail
// is aangevraagd. Wordt gezet door requestPasswordReset, gelezen door
// /nieuw-wachtwoord en opgeruimd zodra het wachtwoord is opgeslagen.
//
// ⚠️ Staat bewust in een eigen bestandje en niet bij de acties: een bestand met
// "use server" bovenaan mag alléén async functies exporteren, dus een constante
// erbij zetten breekt de build.
export const HERSTEL_ADRES_COOKIE = "avinka-herstel-adres";
