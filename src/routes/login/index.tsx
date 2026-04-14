import { useNavigate } from "@solidjs/router";
import { createSignal } from "solid-js";
import { loginUser } from "~/lib/server/auth";

export default function Home() {
  const navigate = useNavigate();

  const [error, setError] = createSignal("");
  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");

  async function login() {
    if (password().length < 8) {
      setError("Wrong password or username");
      return;
    }

    try {
      await loginUser(username(), password());
      navigate("/dashboard");
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <main class="min-h-screen flex items-center justify-center">
      <div class="m-auto w-full md:w-1/2 lg:w-1/4 p-4 border rounded-md flex flex-col">
        <h2 class="text-lg font-bold mb-4">Log In</h2>

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

        <button onClick={login}>Log In</button>
        {error() && <p class="mt-2 text-red-400">{error()}</p>}
      </div>
    </main>
  );
}
