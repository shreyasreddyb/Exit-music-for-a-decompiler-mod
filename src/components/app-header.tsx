import Link from 'next/link';
import { ClarityLogo } from './clarity-logo'; // Logo component can remain as is or be updated separately

const AppHeader = () => (
  <header className="py-6 px-4 md:px-8 border-b border-border shadow-md">
    <div className="container mx-auto flex items-center gap-4">
      <Link href="/" className="flex items-center gap-3 text-2xl font-bold text-primary hover:opacity-90 transition-opacity">
        <ClarityLogo />
        <h1 className="tracking-tight">Exit Music for a Decompiler</h1>
      </Link>
      <p className="text-sm text-muted-foreground hidden md:block mt-1">Neural Decompiler & Binary Analysis Tool</p>
    </div>
  </header>
);

export default AppHeader;
