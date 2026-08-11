// summary_markdown은 짧은 헤딩(##)/목록(-)/인용(>)/굵게(**) 정도만 쓰므로
// 라이브러리 없이 줄 단위로 파싱한다.
//
// 인용과 굵게를 처리하지 않으면 서버가 보내는 경고문이 화면에 `> ⚠️ **...**`처럼
// 기호째로 노출된다 — weak 신뢰도 경고가 정확히 그 모양이라 반드시 필요하다.

/** `**굵게**`만 인라인으로 처리한다. 나머지 기호는 원문 그대로 둔다. */
function renderInline(text, keyPrefix) {
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, i) => (
    part.startsWith('**') && part.endsWith('**') && part.length > 4
      ? <b key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</b>
      : <span key={`${keyPrefix}-${i}`}>{part}</span>
  ));
}

/** 카드 껍데기 없이 본문 블록만 만든다 (총 리뷰 요약 카드 안에서 재사용). */
export function SummaryBody({ markdown }) {
  if (!markdown) return null;

  const blocks = [];
  let listBuf = [];
  const flushList = (key) => {
    if (listBuf.length) {
      blocks.push(<ul key={`ul-${key}`}>{listBuf}</ul>);
      listBuf = [];
    }
  };

  markdown.split('\n').forEach((line, i) => {
    if (line.startsWith('- ')) {
      listBuf.push(<li key={i}>{renderInline(line.slice(2), i)}</li>);
      return;
    }
    flushList(i);
    if (line.startsWith('## ')) blocks.push(<h4 key={i}>{renderInline(line.slice(3), i)}</h4>);
    else if (line.startsWith('> ')) blocks.push(
      <blockquote key={i} className="wr-quote">{renderInline(line.slice(2), i)}</blockquote>);
    else if (line.trim()) blocks.push(<p key={i}>{renderInline(line, i)}</p>);
  });
  flushList('end');

  return <>{blocks}</>;
}

export default function Summary({ markdown }) {
  if (!markdown) return null;
  return (
    <div className="wr-card">
      <div className="wr-card-title">📝 종합</div>
      <div className="wr-summary"><SummaryBody markdown={markdown} /></div>
    </div>
  );
}

Summary.Body = SummaryBody;
