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

function CompatibilitySection() {
  return (
    <section className={styles.compatibility}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>Fediverse Compatibility</Heading>
        <p className={styles.sectionSubtitle}>
          Build software that works with the entire Fediverse ecosystem
        </p>
        <div className={styles.platformGrid}>
          {['Mastodon', 'Lemmy', 'Pixelfed', 'PeerTube', 'Misskey', 'Pleroma', 'GoToSocial', 'Friendica'].map((platform) => (
            <div key={platform} className={styles.platformBadge}>
              {platform}
            </div>
          ))}
        </div>
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
