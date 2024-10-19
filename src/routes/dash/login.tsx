import { createSignal } from "solid-js";
import { Button } from "~/components/ui/button";
import { TextField, TextFieldRoot } from "~/components/ui/textfield";
import { setCookie } from "typescript-cookie";

export default function Login() {
  const [password, setPassword] = createSignal("");
  const [username, setUsername] = createSignal("");
  const [error, setError] = createSignal("");

  const login = async () => {
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: username(), password: password() }),
    }).catch((e) => {
      setError("An error occurred");
    });

    if (response.ok) {
      const data = await response.json();

      setCookie("token", data.token, { expires: 365 });

      window.location.href = "/dash";
    } else {
      const text = await response.text();

      setError(text);
    }
  };

  return (
    <main class="w-full h-screen flex items-center align-middle justify-center">
      <div class="w-full max-w-xs border-[1px] border-border p-5 bg-background rounded-lg">
        <h1 class="text-3xl font-bold text-center">Login</h1>
        <TextFieldRoot class="w-full max-w-xs  mt-2">
          <TextField
            type="username"
            placeholder="Username"
            onInput={(e) => setUsername(e.target.value)}
          />
        </TextFieldRoot>
        <TextFieldRoot class="w-full max-w-xs mt-2">
          <TextField
            type="password"
            placeholder="Password"
            onInput={(e) => setPassword(e.target.value)}
          />
        </TextFieldRoot>
        <p class="my-2 justify-start text-red-400">{error()}</p>
        <Button class="w-full max-w-xs" onClick={() => login()}>
          Login
        </Button>
      </div>
    </main>
  );
}
