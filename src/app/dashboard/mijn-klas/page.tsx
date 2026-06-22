import KlasManager from "@/components/dashboard/KlasManager";

export default function MijnKlasPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-ink">Mijn klas</h1>
      </div>
      <KlasManager />
    </div>
  );
}
