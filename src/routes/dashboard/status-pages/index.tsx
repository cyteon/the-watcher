import { useNavigate } from "@solidjs/router";

export default function StatusPages() {
  const navigate = useNavigate();

  return (
    <main class="flex-1 flex flex-col w-full">
      <div class="flex flex-col md:flex-row">
        <h1 class="text-2xl mt-1.75">Status Pages</h1>
        <a
          href="/dashboard/status-pages/new"
          class="button px-4! w-fit md:ml-auto mt-2 md:mt-0.5"
        >
          + New Status Page
        </a>
      </div>

      <div class="border rounded-md p-2 flex-1 flex flex-col mt-4">todo</div>
    </main>
  );
}
