"use client";

import Link from "next/link";

const Logo = () => {
    return (
        <Link href="/" className="font-semibold tracking-tight hover:opacity-90 transition-opacity">
            <span className="bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent">NOX</span>
            {" "}CHESS
        </Link>
    );
}

export default Logo;