"use client";

import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();
  return (
    <nav className="mb-4">
      <a
        className={`mr-4 ${pathname === "/" ? "text-white border-b" : ""}`}
        href="/"
      >
        {" "}
        UIUX
      </a>
      <a
        className={`mr-4 ${
          pathname === "/fullstack" ? "text-white border-b" : ""
        }`}
        href="/fullstack"
      >
        Fullstack
      </a>
      <a
        className={`mr-4 ${pathname === "/qa" ? "text-white border-b" : ""}`}
        href="/qa"
      >
        QA
      </a>
      <a
        className={`mr-4 ${pathname === "/jas" ? "text-white border-b" : ""}`}
        href="/jas"
      >
        Junior Analis Sistem
      </a>
      {/* <a className={`mr-4 ${pathname === "/retrieval_agents" ? "text-white border-b" : ""}`} href="/retrieval_agents"> Retrieval Agents</a> */}
    </nav>
  );
}
