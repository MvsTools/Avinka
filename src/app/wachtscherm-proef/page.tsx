// TIJDELIJKE PROEFROUTE — alleen om het wachtscherm te kunnen bekijken zonder
// een echte registratie te doen (dat zou een echte mail versturen naar een
// verzonnen adres, en een bounce schaadt de verzendreputatie).
// ⚠️ Weghalen zodra het scherm is goedgekeurd.
import BevestigWachtscherm from "@/components/BevestigWachtscherm";

export default function WachtschermProef() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream p-6">
      <BevestigWachtscherm email="marieke@pcboapeldoorn.nl" />
    </main>
  );
}
