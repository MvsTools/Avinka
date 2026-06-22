import BestandenManager from "@/components/dashboard/BestandenManager";

export default function BestandenPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-ink">Bestanden</h1>
        <p className="mt-2 text-lg text-ink/70">
          Je eigen mappen en bestanden — bewaarde teksten en plattegronden, netjes geordend
          en veilig in je account.
        </p>
      </div>
      <BestandenManager />
    </div>
  );
}
