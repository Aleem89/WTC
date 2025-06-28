import Image from "next/image";
import dynamic from "next/dynamic";

const DynamicMap = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
        <p className="text-gray-300 text-lg font-medium">
          Loading crime data...
        </p>
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header Section */}
      <header className="relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/20 to-orange-900/20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,0,0,0.1),transparent_50%)]"></div>

        <div className="relative z-10 container mx-auto px-6 py-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-shrink-0">
              <Image
                src="/crimetr.png"
                alt="Crime Map Header"
                width={400}
                height={80}
                priority
                className="filter drop-shadow-2xl md:w-auto w-full max-w-sm"
              />
            </div>
            <div className="flex-1 text-center">
              <p className="text-gray-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                Real-time crime data visualization for Texas communities. Track
                incidents, analyze patterns, and stay informed about safety in
                your area.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Map Section */}
      <main className="w-full px-4 pb-12">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-1 rounded-2xl shadow-2xl border border-gray-700">
          <div className="bg-gradient-to-br from-black to-gray-900 rounded-xl overflow-hidden">
            {/* Map Header */}
            <div className="px-6 py-4 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    Interactive Crime Map
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Click on markers for detailed incident information
                  </p>
                  <p className="text-blue-400 text-sm md:hidden mt-1">
                    Click the blue filter button in the bottom right to filter
                    by Time Range and Crime Type
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-sm font-medium">
                    {/* Live Data */}
                  </span>
                </div>
              </div>
            </div>

            {/* Map Container */}
            <div className="w-full relative">
              <DynamicMap />
            </div>
          </div>
        </div>

        {/* Legend Section */}
        <div className="mt-8 mx-auto max-w-7xl bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-700 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4">
            Crime Type Legend
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="flex items-center space-x-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: "#DC143C" }}
              ></div>
              <span className="text-gray-300 text-sm">Murder</span>
            </div>
            <div className="flex items-center space-x-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: "#e74c3c" }}
              ></div>
              <span className="text-gray-300 text-sm">Burglary</span>
            </div>
            <div className="flex items-center space-x-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: "#e67e22" }}
              ></div>
              <span className="text-gray-300 text-sm">Assault</span>
            </div>
            <div className="flex items-center space-x-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: "#9b59b6" }}
              ></div>
              <span className="text-gray-300 text-sm">Robbery</span>
            </div>
            <div className="flex items-center space-x-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: "#2ecc71" }}
              ></div>
              <span className="text-gray-300 text-sm">Theft</span>
            </div>
            <div className="flex items-center space-x-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: "#3498db" }}
              ></div>
              <span className="text-gray-300 text-sm">Other</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 via-black to-gray-900 border-t border-gray-800">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-2">
              Data sourced from public records and law enforcement agencies
            </p>
            <p className="text-gray-500 text-xs">
              Data Last updated: 6/22/2025 • For informational purposes only
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
