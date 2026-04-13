import { getCookie, setCookie, deleteCookie } from "vinxi/http";

export async function getUser() {
  const token = await getCookie("token");

  if (!token) {
    return null;
  }
}
