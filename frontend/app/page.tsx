import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "lucide-react";
export default function Home() {
  return (
    <main className="fc-home">
      <header className="fc-public-header">
        <Link href="/" className="fc-brand">
          <span className="fc-monogram">f.</span>
          <span>
            fincredit<span className="fc-brand-ai">AI</span>
          </span>
        </Link>
        <nav>
          <a href="#workflow">The workspace</a>
          <a href="https://github.com/sreemaanshivkirth05/fincredit-ai/tree/feat/editorial-ui-redesign">
            Source code <ArrowUpRight size={14} />
          </a>
          <Link href="/login" className="fc-solid-button">
            Open workspace <ArrowRight size={16} />
          </Link>
        </nav>
      </header>
      <section className="fc-hero">
        <div>
          <p className="fc-kicker">
            A LITTLE MORE EVIDENCE. A BETTER PERSPECTIVE.
          </p>
          <h1>
            See the investment.
            <br />
            <em>Question the thesis.</em>
          </h1>
          <p className="fc-hero-copy">
            Your companies, your portfolio, and the arguments on both sides. A
            considered space to research investments before putting a thesis
            into practice.
          </p>
          <div className="fc-hero-actions">
            <Link href="/login" className="fc-solid-button">
              Start your research <ArrowUpRight size={17} />
            </Link>
            <a href="#workflow" className="fc-text-link">
              Explore the workspace
            </a>
          </div>
          <div className="fc-hero-footnote">
            <span>Paper trading only</span>
            <span>Ollama & Hugging Face</span>
            <span>Evidence you can inspect</span>
          </div>
        </div>
        <div
          className="fc-editorial-art"
          aria-label="Illustration of the research process"
        >
          <div className="fc-art-caption">
            THE RESEARCH NOTE <span>01 / FINCREDIT</span>
          </div>
          <div className="fc-art-headline">
            Every thesis
            <br />
            has another side.
          </div>
          <div className="fc-art-orbit">
            <div className="fc-art-circle one">
              The case
              <br />
              <strong>for.</strong>
            </div>
            <div className="fc-art-circle two">
              The case
              <br />
              <strong>against.</strong>
            </div>
          </div>
          <div className="fc-art-bottom">
            <span>COMPANY → CONTEXT → CONVICTION</span>
            <ArrowUpRight size={25} />
          </div>
        </div>
      </section>
      <section id="workflow" className="fc-workflow-section">
        <div className="fc-section-intro">
          <p className="fc-kicker">FROM INFORMATION TO UNDERSTANDING</p>
          <h2>
            A workspace for the
            <br />
            whole research process.
          </h2>
          <p>
            Follow the numbers. Read the counterargument. Keep the evidence
            close.
          </p>
        </div>
        <div className="fc-workflow-list">
          {[
            {
              n: "01",
              title: "Know the company",
              body: "Market snapshots, historical charts, available fundamentals and news, gathered around the ticker you're researching.",
              href: "/stock/AAPL",
            },
            {
              n: "02",
              title: "Understand your exposure",
              body: "Simulated holdings, transaction history and currency-separated scenarios reveal how a company fits into your portfolio.",
              href: "/portfolio",
            },
            {
              n: "03",
              title: "Put the thesis to work",
              body: "A bounded committee review brings opposing interpretations together with saved evidence and a visible execution timeline.",
              href: "/committee",
            },
          ].map((x) => (
            <Link href={x.href} className="fc-workflow-row" key={x.n}>
              <span>{x.n}</span>
              <div>
                <h3>{x.title}</h3>
                <p>{x.body}</p>
              </div>
              <ArrowUpRight size={22} />
            </Link>
          ))}
        </div>
      </section>
      <section className="fc-home-cta">
        <p className="fc-kicker">CURIOUS MINDS. CONSIDERED DECISIONS.</p>
        <h2>Make room for a second opinion.</h2>
        <Link href="/register" className="fc-solid-button">
          Create your workspace <ArrowUpRight size={17} />
        </Link>
        <p>Research and education, without real order execution.</p>
      </section>
      <footer className="fc-public-footer">
        <span>FinCredit AI / Research edition</span>
        <span>Model interpretations can be wrong. Review the evidence.</span>
        <Link href="/login">Sign in ↗</Link>
      </footer>
    </main>
  );
}
