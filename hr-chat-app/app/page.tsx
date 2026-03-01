import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <h1 className="text-4xl font-bold mb-8 tracking-tighter">HR Chat Application</h1>
      <p className="mb-8 text-muted-foreground text-lg max-w-md text-center">
        Streamlined candidate workflows and real-time communication for modern HR teams.
      </p>
      <div className="flex gap-4">
        <Link href="/login">
          <Button variant="default" size="lg">Login</Button>
        </Link>
        <Link href="/register">
          <Button variant="outline" size="lg">Register</Button>
        </Link>
      </div>
    </div>
  );
}
