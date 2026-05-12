import { createSignal, onMount } from "solid-js";
import { getUser, updateUser } from "~/lib/server/auth";

export default function AccountSettings() {
  const [username, setUsername] = createSignal("");
  const [newPassword, setNewPassword] = createSignal("");
  const [oldPassword, setOldPassword] = createSignal("");

  const [error, setError] = createSignal("");

  onMount(async () => {
    const user = await getUser();

    if (user) {
      setUsername(user.username);
    } else {
      setError("Unauthorized");
    }
  });

  async function saveUser() {
    setError("");

    if (!oldPassword()) {
      setError("Current password is required");
      return;
    }

    if (newPassword() && newPassword().length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }

    try {
      await updateUser(oldPassword(), {
        username: username(),
        password: newPassword() || undefined,
      });
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <main class="flex-1 flex flex-col w-full">
      <div class="border rounded-md p-4">
        <label class="block mb-1">Username</label>
        <input
          type="text"
          value={username()}
          onInput={(e) => setUsername(e.currentTarget.value)}
          placeholder="Username"
          class="w-full border rounded-md p-2 mb-4"
        />

        <label class="block mb-1">New Password</label>
        <input
          type="password"
          value={newPassword()}
          onInput={(e) => setNewPassword(e.currentTarget.value)}
          placeholder="New Password"
          class="w-full border rounded-md p-2 mb-4"
        />

        <hr class="my-4" />

        <label class="block mb-1">Current Password</label>
        <input
          type="password"
          value={oldPassword()}
          onInput={(e) => setOldPassword(e.currentTarget.value)}
          placeholder="Current Password"
          class="w-full border rounded-md p-2 mb-4"
        />

        {error() && <p class="text-red-400 mb-4">{error()}</p>}

        <button onClick={saveUser} class="px-4 py-2 rounded-md w-full">
          Save Changes
        </button>
      </div>
    </main>
  );
}
