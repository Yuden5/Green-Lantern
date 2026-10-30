import { ArrowUpRight } from 'lucide-react';
import { useEffect } from 'react';
import FloatingIsland from '../components/FloatingIsland.jsx';
import parkImage from '../../images/1.png';
import landImage from '../../images/2.png';
import walkingImage from '../../images/3.png';
import partnerLogos from '../../images/logo.png';

const stories = [
  {
    image: parkImage,
    alt: 'Two leafy trees shade a park bench',
    title: 'Is Green Space a Privilege?',
    description: 'Not every neighborhood has the same access to greenery. Where green spaces are located can determine who benefits from them.',
  },
  {
    image: landImage,
    alt: 'A dry plot of land with several bare trees',
    title: 'What If Wasted Space Could Grow?',
    description: 'Overlooked urban land may hold untapped potential for greener neighborhoods, if suitable sites can be identified and made feasible.',
  },
  {
    image: walkingImage,
    alt: 'A person walking among trees and plants',
    title: 'Close on the Map. Far on Foot.',
    description: 'A park may look nearby, yet roads, barriers, and disconnected pedestrian routes can make it difficult to reach on foot.',
  },
];

export default function HomePage() {
  useEffect(() => {
    const revealItems = document.querySelectorAll('.home-reveal');
    const showAll = () => revealItems.forEach((item) => item.classList.add('is-visible'));
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      showAll();
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    revealItems.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="home-content">
      <section className="home-hero">
        <div className="home-hero-inner">
          <div className="home-hero-copy">
            <h1 aria-label="GREEN Lantern"><span>GREEN</span><span>Lantern</span></h1>
            <p className="home-hero-context">A Bangkok atlas for exploring neighbourhood green spaces and access.</p>
            <div className="home-hero-actions">
              <a className="home-dashboard-button" href="https://sorrymybadmmiv.github.io/Green-zone-UI-V3/">
                Explore the Green Dashboard <ArrowUpRight size={17} aria-hidden="true" />
              </a>
            </div>
          </div>
          <div className="home-island" aria-label="A floating island with trees and green space">
            <FloatingIsland />
          </div>
        </div>
      </section>

      <section id="home-story" className="home-story" aria-labelledby="story-heading">
        <h2 id="story-heading" className="home-reveal">A Greener City. What’s Standing in the Way?</h2>
        <div className="home-story-slides">
          {stories.map((story) => (
            <article className="home-story-slide" key={story.title}>
              <img className="home-reveal" src={story.image} alt={story.alt} />
              <div className="home-story-copy home-reveal">
                <h3>{story.title}</h3>
                <p>{story.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="home-footer">
        <div className="home-mission home-reveal">
          <h2>Our<br />Mission</h2>
          <p>Illuminate the gaps.<br />Connect the green.</p>
          <nav className="home-footer-links" aria-label="Explore GreenLantern">
            <a href="#/policy">Policy <ArrowUpRight size={20} aria-hidden="true" /></a>
            <a href="#/district-analysis">District Analysis <ArrowUpRight size={20} aria-hidden="true" /></a>
          </nav>
        </div>
        <div className="home-footer-partners home-reveal">
          <p>Presented at</p>
          <h2>GeoHackathon 2026</h2>
          <p className="home-footer-theme">Pixel to Policy — Unlocking insights, accelerating impact.</p>
          <a href="https://geohackathon.gistda.or.th/" target="_blank" rel="noreferrer">About GeoHackathon 2026</a>
          <img src={partnerLogos} alt="Partner logos: Ministry of Higher Education, Science, Research and Innovation, GISTDA, European Union, and ESA" />
        </div>
      </footer>
    </div>
  );
}
