const GUIDE_STEPS = [
  {
    step: "1",
    title: "投稿をしぼり込む",
    description: "ハッシュタグや期間で対象の投稿を選択",
  },
  {
    step: "2",
    title: "表紙つきで整える",
    description: "タイトルや著者情報を入れ、読みやすい一冊に自動組版",
  },
  {
    step: "3",
    title: "端末ですぐに読書",
    description: "生成したEPUBをダウンロードして電子書籍リーダーで閲覧",
  },
] as const;

/**
 * ログインカード下部に表示する「かんたん 3 ステップ」の利用手順ガイド。
 */
export function LoginStepsGuide() {
  return (
    <div className="pt-5 border-t border-slate-100">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-5">
        かんたん 3 ステップ
      </p>
      <div className="flex flex-col gap-3.5 sm:gap-4 w-full">
        {GUIDE_STEPS.map(({ description, step, title }) => (
          <div key={title} className="flex items-start gap-2.5 sm:gap-3">
            <span className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center border border-slate-200">
              {step}
            </span>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-800 m-0">{title}</h2>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-normal m-0">
                {description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
