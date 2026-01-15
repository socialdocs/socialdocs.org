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
    {
      type: 'category',
      label: 'Core Implementation',
      collapsed: false,
      items: [
        'guides/building-an-actor',
        'guides/handling-incoming-activities',
        'guides/sending-activities',
        'guides/webfinger-implementation',
      ],
    },
    {
      type: 'category',
      label: 'Social Features',
      collapsed: false,
      items: [
        'guides/following-and-followers',
        'guides/posts-and-replies',
        'guides/likes-and-shares',
        'guides/mentions-and-hashtags',
        'guides/direct-messages',
        'guides/media-attachments',
      ],
    },
    {
      type: 'category',
      label: 'Advanced Topics',
      collapsed: true,
      items: [
        'guides/adding-activitypub-to-homepage',
        'guides/content-moderation',
        'guides/account-migration',
        'guides/custom-emoji',
        'guides/polls',
        'guides/scaling-and-performance',
        'guides/testing-your-implementation',
      ],
    },
    {
      type: 'category',
      label: 'Platform Compatibility',
      collapsed: true,
      items: [
        'guides/mastodon-compatibility',
        'guides/lemmy-compatibility',
        'guides/pixelfed-compatibility',
        'guides/peertube-compatibility',
      ],
    },
  ],

  referenceSidebar: [
    'reference/glossary',
    {
      type: 'category',
      label: 'Types Reference',
      collapsed: false,
      items: [
        'reference/object-types',
        'reference/activity-types',
        'reference/actor-types',
        'reference/collection-types',
      ],
    },
    {
      type: 'category',
      label: 'Properties Reference',
      collapsed: false,
      items: [
        'reference/common-properties',
        'reference/object-properties',
        'reference/activity-properties',
        'reference/actor-properties',
      ],
    },
    {
      type: 'category',
      label: 'API Endpoints',
      collapsed: false,
      items: [
        'reference/endpoints-overview',
        'reference/inbox-endpoint',
        'reference/outbox-endpoint',
        'reference/followers-following',
        'reference/webfinger-endpoint',
        'reference/nodeinfo-endpoint',
      ],
    },
    {
      type: 'category',
      label: 'Security',
      collapsed: true,
      items: [
        'reference/http-signatures-reference',
        'reference/json-ld-security',
        'reference/content-security',
      ],
    },
  ],

  ecosystemSidebar: [
    'ecosystem/w3c-groups',
    {
      type: 'category',
      label: 'Server Software',
      collapsed: false,
      items: [
        'ecosystem/server-software',
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
  ],

  toolsSidebar: [
    {
      type: 'category',
      label: 'Developer Tools',
      collapsed: false,
      items: [
        'tools/activity-validator',
        'tools/actor-inspector',
        'tools/webfinger-lookup',
        'tools/signature-tester',
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
        'tools/debugging-tips',
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
        'community/socialcg',
        'community/events',
        'community/resources',
      ],
    },
  ],
};

export default sidebars;
