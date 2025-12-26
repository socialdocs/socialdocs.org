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
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="22" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="2"/>
      <text x="24" y="29" textAnchor="middle" fill={color} fontSize="16" fontWeight="bold" fontFamily="system-ui">
        {name.charAt(0)}
      </text>
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
