import AdminFeedback from "@/components/admin/AdminFeedback";

export default function AdminFeedbackPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-ink">Feedback</h1>
        <p className="mt-2 text-lg text-ink/70">
          Wat leerkrachten zelf insturen — ideeën, problemen en complimenten.
        </p>
      </div>
      <AdminFeedback />
    </div>
  );
}
