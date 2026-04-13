import { getCookie } from "@solidjs/start/http";

export async function getUser() {
  const token = getCookie("token");

  if (!token) {
    return null;
  }
}
