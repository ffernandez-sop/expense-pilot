"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/icons";

export function LoginForm() {
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate a successful login and redirect
    router.push("/dashboard");
  };

  return (
    <Card className="w-full max-w-sm mx-4">
      <CardHeader className="space-y-1 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Icons.logo className="h-8 w-8 text-primary" />
          <CardTitle className="text-3xl font-bold font-headline">ExpensePilot</CardTitle>
        </div>
        <CardDescription>
          Ingrese su correo electrónico a continuación para iniciar sesión en su cuenta
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input id="email" type="email" placeholder="m@ejemplo.com" required />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">Contraseña</Label>
              <a href="#" className="ml-auto inline-block text-sm underline">
                ¿Olvidó su contraseña?
              </a>
            </div>
            <Input id="password" type="password" required />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full">Iniciar Sesión</Button>
          <div className="text-center text-sm">
            ¿No tiene una cuenta?{" "}
            <a href="#" className="underline">
              Regístrese
            </a>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
