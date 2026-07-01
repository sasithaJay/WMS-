import { useState } from "react";
import type { Role, Screen } from "../types";

export function useAuth() {
  const [screen, setScreen] = useState<Screen>("login");
  const [role, setRole] = useState<Role>("COMMISSIONER");
  const login = (r: Role) => { setRole(r); setScreen("dashboard"); };
  const logout = () => setScreen("login");
  const goRegister = () => setScreen("register");
  const goLogin = () => setScreen("login");
  return { screen, role, login, logout, goRegister, goLogin };
}
