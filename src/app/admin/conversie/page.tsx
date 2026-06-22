import AdminConversie from "@/components/admin/AdminConversie";

export default function AdminConversiePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-ink">Conversie</h1>
        <p className="mt-2 text-lg text-ink/70">
          Hoeveel proefgebruikers worden klant — en waarom (niet).
        </p>
      </div>
      <AdminConversie />
    </div>
  );
}
