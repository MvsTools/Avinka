import AbonnementView from "@/components/dashboard/AbonnementView";

export default function AbonnementPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-ink">Abonnement</h1>
        <p className="mt-2 text-lg text-ink/70">
          Je huidige plan en wat erbij hoort.
        </p>
      </div>
      <AbonnementView />
    </div>
  );
}
