import Link from "next/link";
import { ArrowLeft, Clock, ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { CONTACT_FORM_URL } from "@/lib/legal";

type LegalPageProps = {
  backHref?: string;
  backLabel?: string;
  categoryLabel?: string;
  children: ReactNode;
  description: string;
  title: string;
  updatedAt: string;
  updatedAtPrefix?: string;
};

type LegalSectionProps = {
  children: ReactNode;
  title: string;
};

export function LegalPage({
  backHref = "/",
  backLabel = "トップページへ戻る",
  categoryLabel = "公式規約・ポリシー",
  children,
  description,
  title,
  updatedAt,
  updatedAtPrefix = "最終更新日: ",
}: LegalPageProps) {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <div className="mb-6">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 bg-white/80 transition cursor-pointer min-h-[36px] shadow-2xs"
          aria-label={backLabel}
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>{backLabel}</span>
        </Link>
      </div>

      <article className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-10 md:p-12">
        <header className="border-b border-slate-200/80 pb-6 sm:pb-8 mb-8 sm:mb-10">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
            {categoryLabel}
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mt-3 mb-3">
            {title}
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl m-0">
            {description}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-4 font-medium">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              {updatedAtPrefix}
              {updatedAt}
            </span>
          </div>
        </header>

        <div className="space-y-8 divide-y divide-slate-100">{children}</div>
      </article>
    </main>
  );
}

export function LegalSection({ children, title }: LegalSectionProps) {
  return (
    <section className="pt-8 first:pt-0 space-y-3">
      <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 m-0">
        <span
          className="w-1.5 h-5 bg-blue-600 rounded-full inline-block shrink-0"
          aria-hidden="true"
        />
        <span>{title}</span>
      </h2>
      <div className="text-slate-600 text-sm sm:text-base leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-2 [&_li]:leading-relaxed [&_:where(a)]:text-blue-600 [&_:where(a)]:underline hover:[&_:where(a)]:text-blue-800">
        {children}
      </div>
    </section>
  );
}

export function LegalContactBox({
  buttonLabel = "お問い合わせ窓口を開く",
  description = "Google フォームよりお気軽にご連絡ください。通常3営業日以内に返信いたします。",
  note,
  title = "FeedsToBook お問い合わせ窓口",
}: {
  buttonLabel?: string;
  description?: string;
  note?: string;
  title?: string;
}) {
  return (
    <div className="mt-4 p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <strong className="block text-slate-900 font-semibold text-sm sm:text-base">{title}</strong>
        <p className="text-xs sm:text-sm text-slate-500 m-0 leading-normal">{description}</p>
        {note && <p className="text-xs text-amber-700 m-0 font-medium">{note}</p>}
      </div>
      <a
        href={CONTACT_FORM_URL}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold !text-white !no-underline hover:!text-white bg-blue-600 hover:bg-blue-700 transition shadow-2xs whitespace-nowrap self-start sm:self-center"
      >
        <span className="!text-white">{buttonLabel}</span>
        <ExternalLink className="w-3.5 h-3.5 text-white shrink-0" aria-hidden="true" />
      </a>
    </div>
  );
}
