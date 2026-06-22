import TakenView from "@/components/dashboard/TakenView";

export default function TakenPage() {
  return (
    <div>
      <div className="mx-auto mb-6 max-w-2xl">
        <h1 className="font-serif text-3xl font-semibold text-ink">Takenlijst</h1>
        <p className="mt-2 text-lg text-ink/70">
          Van to-do naar gedaan. Zet je taken hier neer en vink af wat klaar is.
        </p>
      </div>
      <TakenView />
    </div>
  );
}
