import AdminOverzicht from "@/components/admin/AdminOverzicht";

export default function AdminOverzichtPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-ink">Overzicht</h1>
        <p className="mt-2 text-lg text-ink/70">
          De belangrijkste cijfers in één oogopslag.
        </p>
      </div>
      <AdminOverzicht />
    </div>
  );
}
