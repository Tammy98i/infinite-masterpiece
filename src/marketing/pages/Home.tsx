import { SpaceHero } from '../components/SpaceHero';
import { TabbedSlider } from '../components/TabbedSlider';
import './Home.css';

export function Home() {
  return (
    <div className="home-premium-slider w-full">
      <SpaceHero />
      <TabbedSlider />
    </div>
  );
}
