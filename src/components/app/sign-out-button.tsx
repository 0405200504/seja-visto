"use client";

import { LogOut } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button variant="ghost" size="sm" className="w-full justify-start gap-3" type="submit">
        <LogOut className="size-4" />
        Sair da conta
      </Button>
    </form>
  );
}
