"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { whatsappLink } from "@/lib/whatsapp";

/**
 * Contact is deliberately WhatsApp-first — it's how this bakery actually
 * talks to customers. The form composes a well-formed message rather than
 * pretending to be an inbox nobody watches.
 */
export function ContactForm({
  whatsappNumber,
  brandName,
}: {
  whatsappNumber: string;
  brandName: string;
}) {
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");

  const send = (event: React.FormEvent) => {
    event.preventDefault();
    if (message.trim().length < 5) {
      toast.error("Tell us a little more so we can help.");
      return;
    }
    const composed = [
      `Hi ${brandName},`,
      name ? `I'm ${name}.` : null,
      topic ? `Regarding: ${topic}` : null,
      "",
      message.trim(),
    ]
      .filter((line) => line !== null)
      .join("\n");

    window.open(whatsappLink(whatsappNumber, composed), "_blank", "noopener");
  };

  return (
    <form onSubmit={send} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Your name"
          placeholder="Aarav Sharma"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Input
          label="What's it about?"
          placeholder="Order #BB1234, a custom cake, bulk order…"
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
        />
      </div>
      <Textarea
        label="Message"
        required
        rows={5}
        placeholder="Tell us what you need and when you need it."
        value={message}
        onChange={(event) => setMessage(event.target.value)}
      />
      <Button type="submit" variant="coral" size="lg">
        Send on WhatsApp →
      </Button>
      <p className="text-muted text-xs">
        This opens WhatsApp with your message ready to send — nothing is stored
        on our site.
      </p>
    </form>
  );
}
