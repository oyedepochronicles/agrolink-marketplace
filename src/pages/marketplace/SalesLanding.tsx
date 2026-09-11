import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  MessageCircle,
  ShieldCheck,
  Sprout,
  Truck,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";

const BENEFITS = [
  {
    icon: Sprout,
    title: "Reach verified buyers",
    desc: "List your harvest and get discovered by buyers searching for fresh produce across all 36 states.",
  },
  {
    icon: Wallet,
    title: "Wallet & fast payouts",
    desc: "Payments land in your PhyhanAgro wallet. Request a payout to your bank once your account is verified.",
  },
  {
    icon: Truck,
    title: "Logistics handled",
    desc: "Trusted riders pick up and deliver your orders — you focus on farming, we move the produce.",
  },
  {
    icon: ShieldCheck,
    title: "Trust & verification",
    desc: "A verified badge builds buyer confidence. Your identity documents are kept private and seen only by our review team.",
  },
  {
    icon: MessageCircle,
    title: "Chat with buyers",
    desc: "Answer questions and close sales in real time with built-in messaging on every listing.",
  },
  {
    icon: BarChart3,
    title: "Insights dashboard",
    desc: "Track orders, revenue and product performance from a dashboard built for growing farm businesses.",
  },
];

const STEPS = [
  {
    title: "Apply & get verified",
    desc: "Tell us about your farm and upload an ID document. Verification keeps the marketplace trusted for everyone.",
  },
  {
    title: "List your produce",
    desc: "Add products with photos, prices and quantities in minutes.",
  },
  {
    title: "Sell & chat",
    desc: "Buyers order and message you directly. Confirm and prepare for pickup.",
  },
  {
    title: "Get paid to your wallet",
    desc: "Funds settle to your wallet — withdraw to your bank whenever you're ready.",
  },
];

const SalesLanding = () => {
  usePageMeta({
    title: "Sell on PhyhanAgro | Grow your farm business",
    description:
      "Join PhyhanAgro as a farmer: reach verified buyers across Nigeria, get paid to your wallet, and let trusted riders handle delivery.",
    path: "/sales",
    image: "/og-image.svg",
  });

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="container relative grid gap-10 py-16 md:grid-cols-2 md:py-24">
          <div className="animate-fade-in-up space-y-6 text-white">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest backdrop-blur">
              <Sprout className="h-3.5 w-3.5" /> For farmers
            </span>
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
              Sell your harvest to
              <br />
              <span className="bg-gradient-to-r from-primary-glow to-accent bg-clip-text text-transparent">
                buyers across Nigeria.
              </span>
            </h1>
            <p className="max-w-lg text-base text-white/80 md:text-lg">
              PhyhanAgro connects your farm directly to buyers. We handle
              payments, chat and delivery logistics — you focus on growing.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-white text-primary-deep shadow-glow hover:bg-white/90"
              >
                <Link to="/affiliate?role=farmer">
                  Start selling <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-white/30 bg-white/10 text-white backdrop-blur hover:bg-white/20 hover:text-white"
              >
                <Link to="/login">I already have an account</Link>
              </Button>
            </div>
            <ul className="grid gap-2 pt-2 text-sm text-white/85 sm:grid-cols-3">
              {["No upfront listing fees", "Secure wallet payouts", "Delivery handled for you"].map(
                (item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-glow" /> {item}
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
            Everything you need to sell more
          </h2>
          <p className="mt-3 text-muted-foreground">
            Built for Nigerian farmers — from your first listing to your first
            payout.
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-card transition-base hover:border-primary/40"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-extrabold">
                  {b.title}
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{b.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-secondary/40">
        <div className="container py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
              How it works
            </h2>
            <p className="mt-3 text-muted-foreground">
              Four simple steps from application to your first payout.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div
                key={s.title}
                className="relative rounded-2xl border border-border bg-background p-6 shadow-card"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary text-sm font-extrabold text-white shadow-glow">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust / verification */}
      <section className="container py-16">
        <div className="grid items-center gap-8 rounded-3xl border border-border bg-card p-8 shadow-card md:grid-cols-[auto,1fr] md:p-10">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="h-8 w-8" />
          </span>
          <div>
            <h3 className="font-display text-2xl font-extrabold">
              Your data stays private
            </h3>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Verification protects buyers and sellers alike. The identity
              documents you upload (NIN, driver's licence, CAC) are stored
              securely and are only ever viewed by our verification team through
              an authenticated, access-controlled channel — never exposed
              publicly.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container pb-20">
        <div className="overflow-hidden rounded-3xl bg-gradient-primary p-10 text-white shadow-elegant md:p-14">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <h3 className="font-display text-3xl font-extrabold leading-tight md:text-4xl">
                Ready to grow your farm business?
              </h3>
              <p className="mt-3 max-w-md text-white/85">
                Apply in minutes. Once verified, you can list produce and start
                selling to buyers across Nigeria.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-self-end">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-white text-primary-deep hover:bg-white/90"
              >
                <Link to="/affiliate?role=farmer">
                  Start selling <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                <Link to="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default SalesLanding;
