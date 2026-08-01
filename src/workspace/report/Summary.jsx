// summary_markdown은 짧은 헤딩(##)/목록(-)/평문 정도만 쓰므로 라이브러리 없이 줄 단위로 파싱한다.
function renderLine(line, i) {
  if (line.startsWith('## ')) return <h4 key={i}>{line.slice(3)}</h4>;
  if (line.startsWith('- ')) return <li key={i}>{line.slice(2)}</li>;
  if (!line.trim()) return null;
  return <p key={i}>{line}</p>;
}

export default function Summary({ markdown }) {
  if (!markdown) return null;
  const lines = markdown.split('\n');

  const blocks = [];
  let listBuf = [];
  const flushList = (key) => {
    if (listBuf.length) {
      blocks.push(<ul key={`ul-${key}`}>{listBuf}</ul>);
      listBuf = [];
    }
  };
  lines.forEach((line, i) => {
    if (line.startsWith('- ')) {
      listBuf.push(renderLine(line, i));
    } else {
      flushList(i);
      const node = renderLine(line, i);
      if (node) blocks.push(node);
    }
  });
  flushList('end');

  return (
    <div className="wr-card">
      <div className="wr-card-title">📝 종합</div>
      <div className="wr-summary">{blocks}</div>
    </div>
  );
}
