import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const produse = [
  { id: 1, title: "NOVRA 100W USB-A to USB-C", price: "8.07 RON" },
  { id: 2, title: "NOVRA 100W USB-C to USB-C", price: "9.31 RON" },
  { id: 3, title: "NOVRA 3 in 1 Multi Cable", price: "11.24 RON" },
];

export default function ProdusePage() {
  return (
    <main className="min-h-screen bg-novra-bg text-white">
      <Navbar />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-12 sm:py-20">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-8 sm:mb-12">Produse Premium</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          {produse.map((produs) => (
            <div
              key={produs.id}
              className="bg-novra-surface/70 border border-novra-border rounded-2xl p-5 sm:p-6 hover:border-purple-500/50 transition"
            >
              <div className="h-40 sm:h-48 bg-novra-elevated rounded-xl mb-6 flex items-center justify-center text-novra-muted text-sm">
                [Imagine Produs]
              </div>
              <h3 className="font-semibold text-base sm:text-lg mb-2">{produs.title}</h3>
              <p className="text-purple-400 font-bold mb-4">{produs.price}</p>
              <button className="w-full bg-novra-elevated py-2.5 rounded-lg hover:bg-purple-600 transition text-sm">
                Adaugă în coș
              </button>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
