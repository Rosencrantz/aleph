import React from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import c from 'classnames';

import { ErrorSection } from 'components/common';
import CollectionMetadataPanel from 'components/Collection/CollectionMetadataPanel';
import CollectionStatisticsGroup from 'components/Collection/CollectionStatisticsGroup';
import InvestigationOverview from 'components/Investigation/InvestigationOverview';

import './CollectionOverviewMode.scss';

const messages = defineMessages({
  empty: {
    id: 'collection.overview.empty',
    defaultMessage: 'This dataset is empty.',
  },
});

const CollectionOverviewMode = ({ children, collection, intl, isCasefile }) => {
  const emptyComponent = (
    <ErrorSection
      icon="database"
      title={intl.formatMessage(messages.empty)}
    />
  );

  return (
    <div className={c('CollectionOverviewMode', { casefile: isCasefile })}>
      <div className="CollectionOverviewMode__main">
        {isCasefile && <InvestigationOverview collection={collection} />}
        {!isCasefile && <CollectionStatisticsGroup collection={collection} emptyComponent={emptyComponent} />}
      </div>
      <div className="CollectionOverviewMode__secondary">
        <CollectionMetadataPanel collection={collection} />
      </div>
    </div>
  );
}

export default injectIntl(CollectionOverviewMode);
