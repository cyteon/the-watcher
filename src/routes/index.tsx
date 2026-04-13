import { useNavigate } from "@solidjs/router";

export default function Home() {
  // TODO: optional default status page
  const navigate = useNavigate();
  navigate("/dashboard");

  return;
}
