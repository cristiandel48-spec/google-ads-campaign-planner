import type { ReactNode } from "react";

type LegalPageProps = {
  type: "privacy" | "data-deletion";
};

const UPDATED_AT = "June 30, 2026";

function LegalShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#fff8f9] text-[#35111b]">
      <section className="mx-auto max-w-3xl px-6 py-12">
        <a href="/" className="text-sm font-semibold text-pink-700 hover:text-pink-900">
          Femly Ads Connector
        </a>
        <h1 className="mt-5 text-3xl font-black tracking-tight text-[#5b001d]">{title}</h1>
        <p className="mt-2 text-sm text-stone-500">Last updated: {UPDATED_AT}</p>
        <div className="mt-8 space-y-6 rounded-2xl border border-pink-100 bg-white p-6 shadow-sm">
          {children}
        </div>
      </section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-extrabold text-[#5b001d]">{title}</h2>
      <div className="space-y-3 text-sm leading-6 text-stone-700">{children}</div>
    </section>
  );
}

export default function LegalPage({ type }: LegalPageProps) {
  if (type === "data-deletion") {
    return (
      <LegalShell title="Data Deletion Instructions">
        <Section title="How to request deletion">
          <p>
            If you connected with Femly Ads Connector through Meta, Facebook, Instagram, WhatsApp, or
            our store, you can request deletion of your personal data at any time.
          </p>
          <p>
            Send a request by WhatsApp to <strong>+57 304 490 1787</strong> or write to the business
            contact associated with Femly Probiotics. Include the name, phone number, email, or Meta
            profile used so we can identify the record.
          </p>
        </Section>

        <Section title="What we delete">
          <p>
            We delete customer contact information, message history, order-related support notes,
            campaign audience records, and any profile information stored for automation purposes,
            unless we must keep limited records for legal, tax, fraud prevention, or security reasons.
          </p>
        </Section>

        <Section title="Timing">
          <p>
            We review deletion requests as soon as possible and aim to complete them within 30 days.
            If more time is required, we will explain the reason through the same contact channel.
          </p>
        </Section>
      </LegalShell>
    );
  }

  return (
    <LegalShell title="Privacy Policy">
      <Section title="Who we are">
        <p>
          Femly Ads Connector is operated for Femly Probiotics to support advertising, ecommerce,
          customer communication, and order follow-up workflows.
        </p>
      </Section>

      <Section title="Information we process">
        <p>
          We may process contact details, order details, Meta advertising data, page or ad engagement,
          WhatsApp messages, product inquiries, checkout activity, and support requests.
        </p>
      </Section>

      <Section title="How we use information">
        <p>
          We use this information to respond to customers, process orders, send order updates,
          improve campaigns, measure ad performance, prevent fraud, and provide customer support.
        </p>
      </Section>

      <Section title="Sharing and storage">
        <p>
          We do not sell personal information. Data may be processed through service providers such
          as Meta, Render, WhatsApp Business, payment providers, ecommerce tools, and analytics or
          automation systems needed to operate the store and campaigns.
        </p>
      </Section>

      <Section title="Your choices">
        <p>
          You may request access, correction, or deletion of your data by contacting us through
          WhatsApp at <strong>+57 304 490 1787</strong>. You can also stop promotional messages by
          replying with an unsubscribe request.
        </p>
      </Section>

      <Section title="Data deletion">
        <p>
          Data deletion instructions are available at <a className="font-semibold text-pink-700" href="/data-deletion">/data-deletion</a>.
        </p>
      </Section>
    </LegalShell>
  );
}
