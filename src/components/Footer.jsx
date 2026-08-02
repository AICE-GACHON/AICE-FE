import BrandMark from './BrandMark';

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="brand"><BrandMark size={26} />PAIR</div>
        <div className="fine2">PAPER → REVIEW → REVISION</div>
      </div>
    </footer>
  );
}