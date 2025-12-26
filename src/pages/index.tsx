import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

type FeatureItem = {
  title: string;
  icon: string;
  description: ReactNode;
  link: string;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Getting Started',
    icon: '🚀',
    description: (
      <>
        New to ActivityPub? Start here with our beginner-friendly guides
        covering core concepts, your first server, and understanding federation.
      </>
    ),
    link: '/docs/getting-started/what-is-the-fediverse',
  },
  {
    title: 'Protocol Specifications',
    icon: '📋',
    description: (
      <>
        Deep-dive into ActivityPub, ActivityStreams 2.0, WebFinger,
        HTTP Signatures, and other protocols powering the Fediverse.
      </>
    ),
    link: '/docs/specs/activitypub/overview',
  },
  {
    title: 'Implementation Guides',
    icon: '🔧',
    description: (
      <>
        Step-by-step tutorials for building actors, handling activities,
        implementing follows, posts, likes, and more.
      </>
    ),
    link: '/docs/guides/building-an-actor',
  },
  {
    title: 'API Reference',
    icon: '📖',
    description: (
      <>
        Complete reference for object types, activity types, properties,
        endpoints, and security implementations.
      </>
    ),
    link: '/docs/reference/object-types',
  },
  {
    title: 'Ecosystem Directory',
    icon: '🌐',
    description: (
      <>
        Explore server software, libraries, SDKs, client apps, bridges,
        and tools across the Fediverse ecosystem.
      </>
    ),
    link: '/docs/ecosystem/server-software',
  },
  {
    title: 'Developer Tools',
    icon: '🛠️',
    description: (
      <>
        Interactive validators, inspectors, and testing tools to help
        you build and debug your ActivityPub implementation.
      </>
    ),
    link: '/docs/tools/activity-validator',
  },
];

function Feature({title, icon, description, link}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <Link to={link} className={styles.featureLink}>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>{icon}</div>
          <Heading as="h3" className={styles.featureTitle}>{title}</Heading>
          <p className={styles.featureDescription}>{description}</p>
        </div>
      </Link>
    </div>
  );
}

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/getting-started/what-is-the-fediverse">
            Get Started
          </Link>
          <Link
            className="button button--outline button--lg"
            to="/docs/specs/activitypub/overview">
            Read the Specs
          </Link>
        </div>
      </div>
    </header>
  );
}

function QuickLinks() {
  return (
    <section className={styles.quickLinks}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>Quick Links</Heading>
        <div className={styles.quickLinksGrid}>
          <Link to="https://www.w3.org/TR/activitypub/" className={styles.quickLink}>
            <span className={styles.quickLinkIcon}>📄</span>
            <span>ActivityPub Spec (W3C)</span>
          </Link>
          <Link to="https://www.w3.org/TR/activitystreams-core/" className={styles.quickLink}>
            <span className={styles.quickLinkIcon}>📄</span>
            <span>ActivityStreams Core</span>
          </Link>
          <Link to="https://socialhub.activitypub.rocks/" className={styles.quickLink}>
            <span className={styles.quickLinkIcon}>💬</span>
            <span>SocialHub Forum</span>
          </Link>
          <Link to="https://codeberg.org/fediverse/fep" className={styles.quickLink}>
            <span className={styles.quickLinkIcon}>📝</span>
            <span>FEP Repository</span>
          </Link>
          <Link to="https://fedidevs.org/" className={styles.quickLink}>
            <span className={styles.quickLinkIcon}>👥</span>
            <span>Fediverse Developers</span>
          </Link>
          <Link to="/docs/tools/activity-validator" className={styles.quickLink}>
            <span className={styles.quickLinkIcon}>✅</span>
            <span>Validate Activities</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>Documentation</Heading>
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

type PlatformItem = {
  name: string;
  color: string;
  users: string;
  link: string;
};

// Simple icon paths for each platform (scaled for 48x48 viewBox, centered around 24,24)
const platformIcons: Record<string, string> = {
  // Mastodon: simplified elephant/trunk shape
  Mastodon: 'M24 14c-5.5 0-10 4-10 9v8h4v-7c0-2 1.5-3.5 3.5-3.5s3.5 1.5 3.5 3.5v7h4v-7c0-2 1.5-3.5 3.5-3.5s3.5 1.5 3.5 3.5v7h4v-8c0-5-4.5-9-10-9h-6z',
  // Lemmy: speech bubble
  Lemmy: 'M24 13c-6.1 0-11 4-11 9 0 2.4 1.1 4.6 3 6.3V34l4.5-2.7c1.1.3 2.3.4 3.5.4 6.1 0 11-4 11-9s-4.9-9.7-11-9.7z',
  // Pixelfed: camera aperture
  Pixelfed: 'M24 15a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 3a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  // PeerTube: play button
  PeerTube: 'M19 15v18l14-9-14-9z',
  // Misskey: star/note
  Misskey: 'M24 14l2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8z',
  // Pleroma: sun/burst
  Pleroma: 'M24 16v-3m0 22v-3m8-8h3m-22 0h3m12.5-5.5l2-2m-15 15l2-2m11 0l2 2m-15-15l2 2M24 19a5 5 0 1 0 0 10 5 5 0 0 0 0-10z',
  // GoToSocial: sloth face simplified
  GoToSocial: 'M17 22a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zm14 0a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zm-7 4c-2 0-3.5 1-3.5 2s1.5 2 3.5 2 3.5-1 3.5-2-1.5-2-3.5-2z',
  // Friendica: flower/community
  Friendica: 'M24 14a3 3 0 0 0 0 6 3 3 0 0 0 0-6zm-7 7a3 3 0 0 0 0 6 3 3 0 0 0 0-6zm14 0a3 3 0 0 0 0 6 3 3 0 0 0 0-6zm-7 7a3 3 0 0 0 0 6 3 3 0 0 0 0-6z',
};

const platforms: PlatformItem[] = [
  { name: 'Mastodon', color: '#6364FF', users: '10M+', link: '/docs/ecosystem/mastodon' },
  { name: 'Lemmy', color: '#00bc8c', users: '500K+', link: '/docs/ecosystem/lemmy' },
  { name: 'Pixelfed', color: '#e44a8d', users: '300K+', link: '/docs/ecosystem/pixelfed' },
  { name: 'PeerTube', color: '#f2690d', users: '400K+', link: '/docs/ecosystem/peertube' },
  { name: 'Misskey', color: '#96d04a', users: '1M+', link: '/docs/ecosystem/misskey' },
  { name: 'Pleroma', color: '#fba457', users: '100K+', link: '/docs/ecosystem/pleroma' },
  { name: 'GoToSocial', color: '#df8958', users: '50K+', link: '/docs/ecosystem/gotosocial' },
  { name: 'Friendica', color: '#3f8dba', users: '30K+', link: '/docs/ecosystem/mastodon' },
];

function PlatformLogo({ name, color }: { name: string; color: string }) {
  const iconPath = platformIcons[name];
  const isStroke = name === 'Pleroma'; // Pleroma uses stroke-based sun icon

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="22" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="2"/>
      {iconPath ? (
        <path
          d={iconPath}
          fill={isStroke ? 'none' : color}
          stroke={isStroke ? color : 'none'}
          strokeWidth={isStroke ? 2 : 0}
          strokeLinecap="round"
        />
      ) : (
        <text x="24" y="29" textAnchor="middle" fill={color} fontSize="16" fontWeight="bold" fontFamily="system-ui">
          {name.charAt(0)}
        </text>
      )}
    </svg>
  );
}

function CompatibilitySection() {
  return (
    <section className={styles.compatibility}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>Trusted Across the Fediverse</Heading>
        <p className={styles.sectionSubtitle}>
          Build software compatible with 13+ million users across these platforms
        </p>
        <div className={styles.platformGrid}>
          {platforms.map((platform) => (
            <Link key={platform.name} to={platform.link} className={styles.platformCard}>
              <PlatformLogo name={platform.name} color={platform.color} />
              <div className={styles.platformInfo}>
                <span className={styles.platformName}>{platform.name}</span>
                <span className={styles.platformUsers}>{platform.users} users</span>
              </div>
            </Link>
          ))}
        </div>
        <p className={styles.trustNote}>
          ActivityPub is a <a href="https://www.w3.org/TR/activitypub/">W3C Recommendation</a> — the open standard powering the decentralized social web.
        </p>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="Developer Documentation for ActivityPub & Fediverse"
      description="The comprehensive developer resource for building with ActivityPub, Mastodon, and the Fediverse. Guides, specs, API reference, and tools.">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <QuickLinks />
        <CompatibilitySection />
      </main>
    </Layout>
  );
}
