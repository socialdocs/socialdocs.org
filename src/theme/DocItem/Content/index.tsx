import React, {type ReactNode} from 'react';
import Content from '@theme-original/DocItem/Content';
import type ContentType from '@theme/DocItem/Content';
import type {WrapperProps} from '@docusaurus/types';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import Provenance, {type ProvenanceFields} from '@site/src/components/Provenance';

type Props = WrapperProps<typeof ContentType>;

// Shows each doc's verification status (front matter: last_verified,
// verified_against, reviewed_by) above its content.
export default function ContentWrapper(props: Props): ReactNode {
  const {frontMatter} = useDoc();
  return (
    <>
      <Provenance fields={frontMatter as ProvenanceFields} />
      <Content {...props} />
    </>
  );
}
