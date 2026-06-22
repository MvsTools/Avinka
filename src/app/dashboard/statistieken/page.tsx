import StatistiekenView from "@/components/dashboard/StatistiekenView";

export default function StatistiekenPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-ink">Statistieken</h1>
      </div>
      <StatistiekenView />
    </div>
  );
}
