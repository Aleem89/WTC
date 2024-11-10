import Image from "next/image";
import dynamic from 'next/dynamic';

const DynamicMap = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <div className="w-full h-full rounded-lg bg-gray-200">Loading map...</div>
});

export default function Home() {
  return (
    <div className="grid grid-rows-[auto_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <header className="w-full flex justify-center pt-4 bg-[#000000] dark:bg-[#000000] rounded-lg">
        <Image
          src="/crimetr.png"
          alt="Crime Map Header"
          width={500}
          height={100}
          priority
        />
      </header>
      
      <main className="w-full h-[400px] bg-black/[.05] dark:bg-white/[.06] rounded-lg">
        <DynamicMap />
      </main>

      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
      </footer>
    </div>
  );
}