// Waar mag je iemand na het inloggen of bevestigen heen sturen?
//
// Een bestemming die uit een link of formulierveld komt, mag alleen een pad
// bínnen de site zijn. Anders is zo'n veld te gebruiken om iemand vanaf een
// ogenschijnlijk eigen Avinka-link door te sturen naar een vreemde site — en
// dat is precies het trucje waarmee inlogschermen worden nagemaakt.
//
// Geweigerd worden dus: volledige adressen ("https://…"), protocol-relatieve
// adressen ("//andere-site.nl") en de backslash-variant daarop, die sommige
// browsers alsnog als "//" lezen.
export function veiligIntern(pad: string | null | undefined, terugval = "/dashboard"): string {
  const p = String(pad ?? "");
  const veilig = p.startsWith("/") && !p.startsWith("//") && !p.startsWith("/\\");
  return veilig ? p : terugval;
}
