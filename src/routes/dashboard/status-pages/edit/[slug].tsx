import { useNavigate, useParams } from "@solidjs/router";
import { createSignal, For, onMount } from "solid-js";
import { getStatusPage, updateStatusPage } from "~/lib/server/statusPages";

export default function StatusPages() {
  const navigate = useNavigate();
  const params = useParams();

  const [page, setPage] = createSignal<
    { name: string; slug: string } | undefined
  >(undefined);

  onMount(async () => {
    try {
      setPage(await getStatusPage(params.slug!));
    } catch (e) {
      console.error(e);
      navigate("/dashboard/status-pages");
    }
  });

  async function save() {
    if (!page()?.name || !page()?.slug) {
      alert("All fields are required");
      return;
    }

    try {
      await updateStatusPage(params.slug!, {
        name: page()!.name,
        slug: page()!.slug,
      });

      navigate(`/status/${page()!.slug}`);
    } catch (e) {
      console.error(e);
      alert("Failed to update status page");
      return;
    }
  }

  return (
    <main class="flex-1 flex flex-col w-full">
      <h1 class="text-2xl mt-1.75">Edit: {page()?.name}</h1>

      <div class="border rounded-md p-2 flex-1 flex flex-col mt-5">
        <label class="mb-2">Name</label>
        <input
          type="text"
          placeholder="Name"
          class="mb-2"
          value={page()?.name}
          onInput={(e) =>
            setPage((p) => p && { ...p, name: e.currentTarget.value })
          }
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
            value={page()?.slug}
            onInput={(e) =>
              setPage((p) => p && { ...p, slug: e.currentTarget.value })
            }
          />
        </div>

        <button class="button mt-2" onClick={save}>
          Save
        </button>
      </div>
    </main>
  );
}
