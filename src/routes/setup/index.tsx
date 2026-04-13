import { useNavigate } from "@solidjs/router";
import { createSignal } from "solid-js";
import { createUser } from "~/lib/server/auth";

export default function Home() {
  const navigate = useNavigate();

  const [error, setError] = createSignal("");
  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [confirmPassword, setConfirmPassword] = createSignal("");

  async function createAccount() {
    if (password() !== confirmPassword()) {
      setError("Passwords do not match");
      return;
    }

    if (password().length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    try {
      await createUser(username(), password());
      navigate("/login");
    } catch (e) {
      setError("Failed to create user: " + e.message);
    }
  }

  return (
    <main class="min-h-screen flex items-center justify-center">
      <div class="m-auto w-full md:w-1/2 lg:w-1/4 p-4 border rounded-md flex flex-col">
        <h2 class="text-lg font-bold mb-4">Create Admin Account</h2>

        <input
          type="text"
          placeholder="Username"
          class="mb-4"
          value={username()}
          onInput={(e) => setUsername(e.currentTarget.value)}
        />

        <input
          type="password"
          placeholder="Password"
          class="mb-4"
          value={password()}
          onInput={(e) => setPassword(e.currentTarget.value)}
        />

        <input
          type="password"
          placeholder="Confirm Password"
          class="mb-4"
          value={confirmPassword()}
          onInput={(e) => setConfirmPassword(e.currentTarget.value)}
        />

        <button onClick={createAccount}>Create Account</button>

        <p class="text-red-400 mt-2">{error()}</p>
      </div>
    </main>
  );
}
