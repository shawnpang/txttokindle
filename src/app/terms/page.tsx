export default function TermsPage() {
  return (
    <main className="min-h-screen p-6 flex justify-center">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold">Terms</h1>
        <ul className="mt-4 list-disc pl-5 text-sm text-gray-700 space-y-2">
          <li>You confirm you have the rights to upload and email the content you submit.</li>
          <li>You will not use the service for spam or abusive behavior.</li>
          <li>The service is provided “as-is” without warranties.</li>
        </ul>
        <p className="mt-6 text-xs text-gray-500">Last updated: 2026-02-07</p>
      </div>
    </main>
  );
}
