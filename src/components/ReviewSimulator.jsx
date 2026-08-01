import { useState } from 'react';
import { simulatorPanels } from '../data/simulatorData';

export default function ReviewSimulator() {
  const [activeTab, setActiveTab] = useState('method');
  const [revised, setRevised] = useState(false);
  const panel = simulatorPanels.find((p) => p.id === activeTab);

  return (
    <section id="simulator">
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow">Try it — Review Simulator</div>
          <h2>Feed in your draft, and reviewers<br />leave comments in the margin first</h2>
          <p>Click one of the three sections below to see predicted reviews, then click "Apply the review" to see how the sentence changes.</p>
        </div>

        <div className="sim">
          <div className="sim-tabs">
            {simulatorPanels.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`sim-tab${activeTab === p.id ? ' active-tab' : ''}`}
                onClick={() => { setActiveTab(p.id); setRevised(false); }}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="sim-body">
            <div className="sim-panel">
              <div className="sim-text">
                <div className="kicker">{panel.kicker}</div>
                <p>
                  {panel.before}
                  {revised ? (
                    <span className="inserted-visible">{panel.inserted}</span>
                  ) : (
                    <span className="struck">{panel.struck}</span>
                  )}
                  {panel.after}
                </p>
              </div>
              <div className="sim-notes">
                {panel.notes.map((n, i) => (
                  <div className={`sim-note ${n.tone}`} key={i}>
                    <div className="head"><span className="dot" /><span className="who">{n.who}</span></div>
                    <div className="txt">{n.txt}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="sim-cta">
            <div className="hint">See how your draft changes once you apply the predicted review.</div>
            <button type="button" className="sim-toggle" onClick={() => setRevised((v) => !v)}>
              {revised ? 'Show original text' : 'Apply the review'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}