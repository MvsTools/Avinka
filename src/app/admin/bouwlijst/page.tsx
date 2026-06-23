import AdminBouwlijst from "@/components/admin/AdminBouwlijst";

export default function AdminBouwlijstPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-ink">Te bouwen</h1>
        <p className="mt-2 text-lg text-ink/70">
          Je eigen backlog: wat wil je nog bouwen voor de website. Privé, alleen voor jou.
        </p>
      </div>
      <AdminBouwlijst />
    </div>
  );
}
