import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import History from "@/components/History";
import Club from "@/components/Club";
import BookingSection from "@/components/BookingSection";
import Footer from "@/components/Footer";

export default function Home() {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onBook = () => scrollTo("agendar");
  const onSubscribe = () => scrollTo("club");

  return (
    <div className="relative">
      <Navbar onBook={onBook} onSubscribe={onSubscribe} />
      <Hero onBook={onBook} onSubscribe={onSubscribe} />
      <Services onBook={onBook} />
      <History />
      <Club />
      <BookingSection />
      <Footer />
    </div>
  );
}
