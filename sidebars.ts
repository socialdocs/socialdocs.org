import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  gettingStartedSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/what-is-the-fediverse',
        'getting-started/core-concepts',
        'getting-started/your-first-activitypub-server',
        'getting-started/understanding-federation',
        'getting-started/authentication-and-security',
        'getting-started/choosing-your-stack',
      ],
    },
    {
      type: 'category',
      label: 'Linked Data',
      collapsed: false,
      items: [
        'concepts/uris-iris-linked-data',
      ],
    },
  ],

  securitySidebar: [
    {
      type: 'category',
      label: 'Security',
      collapsed: false,
      items: [
        'security/verifying-requests',
        'security/origin-model',
        'security/keys-and-identity',
        'security/authorized-fetch',
        'security/object-integrity-proofs',
        'security/known-vulnerability-classes',
        'reference/json-ld-security',
        'reference/content-security',
      ],
    },
  ],

  specsSidebar: [
    {
      type: 'category',
      label: 'ActivityPub',
      collapsed: false,
      items: [
        'specs/activitypub/overview',
        'specs/activitypub/actors',
        'specs/activitypub/objects',
        'specs/activitypub/activities',
        'specs/activitypub/collections',
        'specs/activitypub/client-to-server',
        'specs/activitypub/server-to-server',
        'specs/activitypub/delivery',
      ],
    },
    {
      type: 'category',
      label: 'ActivityStreams 2.0',
      collapsed: true,
      items: [
        'specs/activitystreams/overview',
        'specs/activitystreams/core-types',
        'specs/activitystreams/activity-types',
        'specs/activitystreams/object-types',
        'specs/activitystreams/actor-types',
        'specs/activitystreams/link-types',
        'specs/activitystreams/properties',
      ],
    },
    {
      type: 'category',
      label: 'Supporting Protocols',
      collapsed: true,
      items: [
        'specs/webfinger/overview',
        'specs/http-signatures/overview',
        'specs/nodeinfo/overview',
      ],
    },
  ],

  guidesSidebar: [
    'guides/index',
    'guides/troubleshooting',
    {
      type: 'category',
      label: 'Get Federating',
      collapsed: false,
      items: [
        'guides/building-an-actor',
        'guides/webfinger-implementation',
        'guides/handling-incoming-activities',
        'guides/sending-activities',
        'guides/adding-activitypub-to-homepage',
        'guides/testing-your-implementation',
      ],
    },
    {
      type: 'category',
      label: 'Build Social Features',
      collapsed: false,
      items: [
        'guides/following-and-followers',
        'guides/posts-and-replies',
        'guides/threads-replies-and-backfill',
        'guides/quote-posts-and-interaction-policies',
        'guides/mentions-and-hashtags',
        'guides/direct-messages',
        'guides/media-attachments',
        'guides/likes-and-shares',
        'guides/polls',
        'guides/custom-emoji',
      ],
    },
    {
      type: 'category',
      label: 'Run It in Production',
      collapsed: true,
      items: [
        'guides/deletion',
        'guides/account-migration',
        'guides/delivery-at-scale',
        'guides/scaling-and-performance',
        'guides/content-moderation',
      ],
    },
    {
      type: 'category',
      label: 'Interoperate with a Platform',
      collapsed: true,
      items: [
        'guides/mastodon-compatibility',
        'guides/lemmy-compatibility',
        'guides/pixelfed-compatibility',
        'guides/peertube-compatibility',
        {type: 'link', label: 'Threads, Ghost, WordPress & more', href: '/docs/ecosystem/big-platforms'},
      ],
    },
  ],

  referenceSidebar: [
    'reference/glossary',
    {
      type: 'category',
      label: 'Types & Properties',
      collapsed: false,
      items: [
        {type: 'link', label: 'Object types', href: '/docs/specs/activitystreams/object-types'},
        {type: 'link', label: 'Activity types', href: '/docs/specs/activitystreams/activity-types'},
        {type: 'link', label: 'Actor types', href: '/docs/specs/activitystreams/actor-types'},
        {type: 'link', label: 'Collections', href: '/docs/specs/activitypub/collections'},
        {type: 'link', label: 'Properties', href: '/docs/specs/activitystreams/properties'},
      ],
    },
    {type: 'link', label: 'Endpoints at a glance', href: '/docs/specs/activitypub/overview#endpoints-at-a-glance'},
    {type: 'link', label: 'Security', href: '/docs/security/verifying-requests'},
  ],

  ecosystemSidebar: [
    {
      type: 'category',
      label: 'Server Software',
      collapsed: false,
      items: [
        'ecosystem/server-software',
        'ecosystem/big-platforms',
        'ecosystem/mastodon',
        'ecosystem/lemmy',
        'ecosystem/piefed',
        'ecosystem/pixelfed',
        'ecosystem/peertube',
        'ecosystem/misskey',
        'ecosystem/pleroma',
        'ecosystem/gotosocial',
        'ecosystem/fedbox',
        'ecosystem/other-servers',
      ],
    },
    {
      type: 'category',
      label: 'Libraries & SDKs',
      collapsed: false,
      items: [
        'ecosystem/libraries-overview',
        'ecosystem/fedify',
        'ecosystem/javascript-libraries',
        'ecosystem/python-libraries',
        'ecosystem/go-libraries',
        'ecosystem/rust-libraries',
        'ecosystem/ruby-libraries',
        'ecosystem/php-libraries',
        'ecosystem/other-libraries',
      ],
    },
    {
      type: 'category',
      label: 'Tools & Services',
      collapsed: true,
      items: [
        'ecosystem/client-apps',
        'ecosystem/bridges',
        'ecosystem/hosting-providers',
        'ecosystem/testing-tools',
        'ecosystem/monitoring-tools',
      ],
    },
    'ecosystem/w3c-groups',
  ],

  toolsSidebar: [
    {
      type: 'category',
      label: 'Testing & Debugging',
      collapsed: false,
      items: [
        'tools/overview',
        'tools/activity-validator',
        'tools/actor-inspector',
        'tools/signature-inspector',
        'tools/json-ld-playground',
      ],
    },
    {
      type: 'category',
      label: 'Testing Resources',
      collapsed: false,
      items: [
        'tools/test-suites',
        'tools/compliance-checklist',
      ],
    },
  ],

  communitySidebar: [
    {
      type: 'category',
      label: 'Community',
      collapsed: false,
      items: [
        'community/contributing',
        'community/feps',
        'community/spec-status',
        'community/socialcg',
        'community/events',
        'community/resources',
      ],
    },
  ],
};

export default sidebars;
