import type { ReactNode } from "react";
import Container from "./components/common/Container";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen w-full">
      <Container className="">{children}</Container>
    </div>
  );
}
