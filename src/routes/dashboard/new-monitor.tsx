import { useNavigate } from "@solidjs/router";

export default function NewMonitor() {
  const navigate = useNavigate();

  return (
    <main class="flex-1 flex flex-col w-full">
      <h1 class="text-2xl mt-1.75">Create New Monitor</h1>
      <div class="border rounded-md p-2 flex-1 flex flex-col mt-5"></div>
    </main>
  );
}
