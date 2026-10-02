"use client";

import { useState, type FormEvent } from "react";
import { useSettings } from "@/app/components/SettingsProvider";
import { whatsappHref } from "@/lib/settings-shared";

const INPUT_CLASS =
  "w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-300";
const LABEL_CLASS = "block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider";

/** Sends the enquiry to the store's WhatsApp — no backend or mail setup required. */
export function ContactForm() {
  const { whatsappNumber } = useSettings();
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const get = (k: string) => String(form.get(k) || "").trim();
    const name = `${get("firstName")} ${get("lastName")}`.trim();
    const message = get("message");
    if (!name || !message) {
      setError("Please enter your name and a message.");
      return;
    }
    setError("");
    const details = [
      `Assalam o Alaikum! ${get("subject")}`,
      `Name: ${name}`,
      get("email") && `Email: ${get("email")}`,
      get("phone") && `Phone: ${get("phone")}`,
    ].filter(Boolean);
    const text = `${details.join("\n")}\n\n${message}`;
    window.open(whatsappHref(whatsappNumber, text), "_blank", "noopener,noreferrer");
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLASS}>First Name</label>
          <input name="firstName" type="text" placeholder="Aisha" required className={INPUT_CLASS} />
        </div>
        <div>
          <label className={LABEL_CLASS}>Last Name</label>
          <input name="lastName" type="text" placeholder="Khan" className={INPUT_CLASS} />
        </div>
      </div>
      <div>
        <label className={LABEL_CLASS}>Email</label>
        <input name="email" type="email" placeholder="aisha@example.com" className={INPUT_CLASS} />
      </div>
      <div>
        <label className={LABEL_CLASS}>Phone (Optional)</label>
        <input name="phone" type="tel" placeholder="03xx xxxxxxx" className={INPUT_CLASS} />
      </div>
      <div>
        <label className={LABEL_CLASS}>Subject</label>
        <select name="subject" className={INPUT_CLASS}>
          <option>Order Inquiry</option>
          <option>Shipping Question</option>
          <option>Returns & Exchange</option>
          <option>Product Question</option>
          <option>Wholesale Inquiry</option>
          <option>Other</option>
        </select>
      </div>
      <div>
        <label className={LABEL_CLASS}>Message</label>
        <textarea
          name="message"
          rows={5}
          required
          placeholder="How can we help you?"
          className={`${INPUT_CLASS} resize-none`}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        className="w-full bg-secondary text-white py-3.5 rounded-lg text-sm font-medium hover:bg-secondary/90 transition"
      >
        Send via WhatsApp
      </button>
      <p className="text-[11px] text-gray-400 text-center">
        Your message opens in WhatsApp so our team can reply to you directly.
      </p>
    </form>
  );
}
