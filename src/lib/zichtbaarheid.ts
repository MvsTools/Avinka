// Mag een zoekmachine deze omgeving in?
//
// Zolang we aan het testen zijn: NEE. Op de voorpagina staan nu nog dingen die
// niet in Google horen te belanden — voorbeeld-ervaringen met verzonnen namen,
// prijzen die nog herzien worden, "nog niet live". Wat Google eenmaal heeft
// opgepikt blijft daar nog weken staan, ook nadat je het hebt weggehaald.
//
// 🔑 DE RICHTING VAN DE STANDAARD IS HET PUNT: vergeten = dicht. Je moet het
// expliciet openzetten met een instelling bij Vercel, en dat doe je pas op de
// dag dat de site echt de deur uit mag. Zou het andersom zijn, dan is één keer
// vergeten genoeg om er maanden last van te hebben.
//
// Openzetten bij de livegang: zet AVINKA_INDEXEREN=ja in de Vercel-instellingen
// (Production only), en zet hem NIET bij Preview of Development.

export const MAG_GEVONDEN_WORDEN = process.env.AVINKA_INDEXEREN === "ja";
