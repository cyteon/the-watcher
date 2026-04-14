import { useNavigate } from "@solidjs/router";

export default async function Home() {
  const navigate = useNavigate();

  return (
    <main class="flex-1 flex flex-col w-full">
      <h1 class="text-2xl mt-1.75">Overview</h1>
      <div class="border rounded-md p-2 flex-1 flex flex-col mt-5">todo</div>
    </main>
  );
}
