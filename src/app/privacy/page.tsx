export default function PrivacyPage() {
  return (
    <main className="min-h-screen p-6 flex justify-center">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold">Privacy</h1>
        <p className="mt-4 text-sm text-gray-700">
          TxtToKindle is a simple tool that emails your uploaded TXT file to the Kindle email you provide.
        </p>
        <ul className="mt-4 list-disc pl-5 text-sm text-gray-700 space-y-2">
          <li>We process your upload only to send the email you requested.</li>
          <li>We do not intentionally store your file long-term.</li>
          <li>We may log basic request metadata (e.g. timestamp, IP, success/failure) for abuse prevention.</li>
        </ul>
        <p className="mt-6 text-xs text-gray-500">Last updated: 2026-02-07</p>
      </div>
    </main>
  );
}
