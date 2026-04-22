import { useNavigate } from "@solidjs/router";
import { createSignal } from "solid-js";
import { setKey } from "~/components/Sidebar";
import { createStatusPage } from "~/lib/server/statusPages";

export default function NewStatusPage() {
  const navigate = useNavigate();

  const [name, setName] = createSignal("");
  const [slug, setSlug] = createSignal("");
  const [error, setError] = createSignal("");

  async function create() {
    if (!name() || !slug()) {
      setError("All fields are required");
      return;
    }

    try {
      await createStatusPage({ name: name(), slug: slug() });

      setKey((k) => k + 1);
      navigate(`/status/${slug()}`);
    } catch (e) {
      console.error(e);
      setError("Failed to create status page");

      return;
    }
  }

  return (
    <main class="flex-1 flex flex-col w-full">
      <h1 class="text-2xl mt-1.75">Create New Monitor</h1>
      <div class="border rounded-md p-2 flex-1 flex flex-col mt-5">
        <label class="mb-2">Name</label>
        <input
          type="text"
          placeholder="Name"
          class="mb-2"
          value={name()}
          onInput={(e) => setName(e.currentTarget.value)}
        />

        <label class="mb-2">Slug</label>

        <div class="flex mb-2">
          <div class="bg-neutral-800 align-middle text-center flex px-4 rounded-l-md">
            <p class="my-auto text-nowrap">/status/</p>
          </div>

          <input
            type="text"
            placeholder="Slug"
            class="rounded-l-none!"
            value={slug()}
            onInput={(e) => setSlug(e.currentTarget.value)}
          />
        </div>

        <button class="mt-2" onClick={create}>
          Create
        </button>
        {error() && <p class="mt-2 text-red-400">{error()}</p>}
      </div>
    </main>
  );
}
