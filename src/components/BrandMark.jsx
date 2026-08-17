// src/components/BrandMark.jsx
import logo from '@/assets/logo.png';

export default function BrandMark({ size = 30 }) {
  return (
    <img
      src={logo}
      alt="PAIR"
      width={size}
      height={size}
      style={{ display: 'block', borderRadius: '22%' }}
    />
  );
}