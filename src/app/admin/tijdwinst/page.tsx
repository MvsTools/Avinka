import AdminTijdwinst from "@/components/admin/AdminTijdwinst";

export default function AdminTijdwinstPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-ink">Tijdwinst</h1>
        <p className="mt-2 text-lg text-ink/70">
          Hoeveel tijd Avinka leerkrachten samen bespaart, uitgesplitst per tool.
        </p>
      </div>
      <AdminTijdwinst />
    </div>
  );
}
