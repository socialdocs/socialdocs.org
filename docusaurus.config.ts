import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'SocialDocs',
  tagline: 'The comprehensive developer resource for ActivityPub, Mastodon, and the Fediverse',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://socialdocs.org',
  baseUrl: '/',

  organizationName: 'socialdocs',
  projectName: 'socialdocs.org',

  onBrokenLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/socialdocs/socialdocs.org/tree/gh-pages/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          editUrl: 'https://github.com/socialdocs/socialdocs.org/tree/gh-pages/',
          blogTitle: 'SocialDocs Blog',
          blogDescription: 'News, tutorials, and updates from the Fediverse developer community',
          postsPerPage: 10,
          blogSidebarTitle: 'Recent posts',
          blogSidebarCount: 10,
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/socialdocs-social-card.png',
    metadata: [
      {name: 'keywords', content: 'ActivityPub, Mastodon, Fediverse, federation, decentralized, social web, API, developer documentation'},
      {name: 'twitter:card', content: 'summary_large_image'},
    ],
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: false,
    },
    announcementBar: {
      id: 'contribute',
      content: 'Help build the definitive Fediverse developer resource! <a href="https://github.com/socialdocs/socialdocs.org">Contribute on GitHub</a>',
      backgroundColor: '#6364FF',
      textColor: '#fff',
      isCloseable: true,
    },
    navbar: {
      title: 'SocialDocs',
      logo: {
        alt: 'SocialDocs Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'gettingStartedSidebar',
          position: 'left',
          label: 'Getting Started',
        },
        {
          type: 'docSidebar',
          sidebarId: 'specsSidebar',
          position: 'left',
          label: 'Specifications',
        },
        {
          type: 'docSidebar',
          sidebarId: 'guidesSidebar',
          position: 'left',
          label: 'Guides',
        },
        {
          type: 'docSidebar',
          sidebarId: 'referenceSidebar',
          position: 'left',
          label: 'Reference',
        },
        {
          type: 'docSidebar',
          sidebarId: 'ecosystemSidebar',
          position: 'left',
          label: 'Ecosystem',
        },
        {
          to: '/blog',
          label: 'Blog',
          position: 'left',
        },
        {
          type: 'docSidebar',
          sidebarId: 'toolsSidebar',
          position: 'right',
          label: 'Tools',
        },
        {
          href: 'https://github.com/socialdocs/socialdocs.org',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Learn',
          items: [
            {label: 'Getting Started', to: '/docs/getting-started/what-is-the-fediverse'},
            {label: 'ActivityPub Spec', to: '/docs/specs/activitypub/overview'},
            {label: 'Implementation Guides', to: '/docs/guides/building-an-actor'},
          ],
        },
        {
          title: 'Reference',
          items: [
            {label: 'Object Types', to: '/docs/reference/object-types'},
            {label: 'Activity Types', to: '/docs/reference/activity-types'},
            {label: 'Ecosystem', to: '/docs/ecosystem/server-software'},
          ],
        },
        {
          title: 'Community',
          items: [
            {label: 'SocialHub Forum', href: 'https://socialhub.activitypub.rocks/'},
            {label: 'Fediverse Developers', href: 'https://fedidevs.org/'},
            {label: 'W3C Social CG', href: 'https://www.w3.org/community/socialcg/'},
          ],
        },
        {
          title: 'More',
          items: [
            {label: 'Blog', to: '/blog'},
            {label: 'GitHub', href: 'https://github.com/socialdocs/socialdocs.org'},
            {label: 'Contributing', to: '/docs/community/contributing'},
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} SocialDocs Contributors. Licensed under MIT. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'http', 'ruby', 'python', 'go', 'rust', 'typescript'],
    },
    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 4,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
