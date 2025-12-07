import { Hero } from './Hero';
import { ValueBlock } from './ValueBlock';
import { ScrollPrompt } from './ScrollPrompt';

export function Home({ onNavigate } = {}) {
  const handleNavigate = (page) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  return (
    <>
      <Hero onNavigate={handleNavigate} />
      <ValueBlock />
      <ScrollPrompt />
    </>
  );
}
