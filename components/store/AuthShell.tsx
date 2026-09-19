import Link from "next/link";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="wrap max-w-[460px] pt-14 pb-24 sm:pt-20">
      <header className="mb-8 text-center">
        <p className="eyebrow eyebrow-plain justify-center">{eyebrow}</p>
        <h1 className="display-2 mt-3">{title}</h1>
        {description ? <p className="lede mt-3">{description}</p> : null}
      </header>

      <div className="border-line rounded-[26px] border bg-white p-6 shadow-[0_24px_60px_rgba(76,43,34,.08)] sm:p-8">
        {children}
      </div>

      <p className="text-muted mt-6 text-center text-xs">
        By continuing you agree to our{" "}
        <Link href="/policies/terms" className="underline underline-offset-2">
          terms
        </Link>{" "}
        and{" "}
        <Link href="/policies/privacy" className="underline underline-offset-2">
          privacy policy
        </Link>
        .
      </p>
    </div>
  );
}
