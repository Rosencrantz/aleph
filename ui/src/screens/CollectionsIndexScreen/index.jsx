import React, { Component } from 'react';
import { connect } from 'react-redux';
import { defineMessages, injectIntl, FormattedMessage, FormattedNumber } from 'react-intl';
import { debounce } from 'lodash';
import Waypoint from 'react-waypoint';

import Screen from 'src/components/common/Screen';
import ScreenLoading from 'src/components/common/ScreenLoading';
import Breadcrumbs from 'src/components/common/Breadcrumbs';
import Query from 'src/components/search/Query';
import DualPane from 'src/components/common/DualPane';
import SectionLoading from 'src/components/common/SectionLoading';
import CheckboxList from 'src/components/common/CheckboxList';
import { fetchCollections } from 'src/actions';
import CollectionListItem from 'src/components/CollectionScreen/CollectionListItem';

import './CollectionsIndexScreen.css';

const messages = defineMessages({
  filter: {
    id: 'collectionbrowser.filter',
    defaultMessage: 'Filter collections',
  },
});


class CollectionsIndexScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      result: {results: []},
      queryPrefix: props.query.getString('prefix'),
      isFetching: true,
    };

    this.updateQuery = debounce(this.updateQuery.bind(this), 200);
    this.onChangeQueryPrefix = this.onChangeQueryPrefix.bind(this);
    this.onFacetToggle = this.onFacetToggle.bind(this);
    this.bottomReachedHandler = this.bottomReachedHandler.bind(this);
  }

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(prevProps) {
    if (!this.props.query.sameAs(prevProps.query)) {
      this.fetchData();
    }
  }

  fetchData() {
    this.setState({isFetching: true})
    let { query } = this.props;
    query = query.sortBy('count', true);
    query = query.addFacet('category');
    query = query.addFacet('countries');
    query = query.limit(30);
    this.props.fetchCollections({
      filters: query.toParams(),
    }).then(({result}) => {
      this.setState({result, isFetching: false})
    });
  }

  onChangeQueryPrefix({target}) {
    this.setState({queryPrefix: target.value});
    const query = this.props.query.set('prefix', target.value);
    this.updateQuery(query);
  }

  onFacetToggle(facet) {
    const updateQuery = this.updateQuery;
    return (value) => {
      // console.log(facet, value);
      let query = this.props.query;
      query = query.toggleFilter(facet, value);
      updateQuery(query);
    }
  }

  updateQuery(newQuery) {
    const { history, location } = this.props;
    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation()
    });
  }

  bottomReachedHandler() {
    const { result, isFetching } = this.state;
    if (!result || !result.next || isFetching) {
        return
    }
    this.setState({isFetching: true})
    const offset = result.offset || 0;
    let query = this.props.query;
    query = query.offset(offset + result.limit);
    query = query.limit(result.limit);
    this.props.fetchCollections({
      filters: query.toParams(),
    }).then(({result: fresh}) => {
      result.next = fresh.next;
      result.offset = fresh.offset;
      result.results.push(...fresh.results);
      this.setState({
            result: result,
            isFetching: false
        });
    });
  }

  render() {
    const { intl } = this.props;
    const { result, queryPrefix, isFetching } = this.state;

    if (!result || !result.pages) {
      return <SectionLoading />
    }

    const breadcrumbs = (<Breadcrumbs>
      <li>
        <a className="pt-breadcrumb">
          <FormattedMessage id="collection.browser.breadcrumb"
                            defaultMessage="Collections overview" />
        </a>
      </li>
    </Breadcrumbs>)

    return (
      <Screen className="CollectionsIndexScreen" breadcrumbs={breadcrumbs}>
        
        <DualPane>
          <DualPane.InfoPane>
            <div className="pt-input-group pt-fill">
              <i className="pt-icon pt-icon-search" />
              <input className="pt-input" type="search"
                placeholder={intl.formatMessage(messages.filter)}
                onChange={this.onChangeQueryPrefix} value={queryPrefix} />
            </div>
            <p className="note">
              <FormattedMessage id="collection.browser.total"
                              defaultMessage="Browsing {total} collections."
                              values={{
                                total: result.total
                              }}/>
            </p>

            <h4>
              <FormattedMessage id="collections.browser.categories"
                                defaultMessage="Categories" />
            </h4>
            <CheckboxList items={result.facets.category.values}
                          selectedItems={result.facets.category.filters}
                          onItemClick={this.onFacetToggle('category')} />

            <h4>
              <FormattedMessage id="collections.browser.countries"
                                defaultMessage="Countries" />
            </h4>
            <CheckboxList items={result.facets.countries.values}
                          selectedItems={result.facets.countries.filters}
                          onItemClick={this.onFacetToggle('countries')} />
          </DualPane.InfoPane>
          <DualPane.ContentPane>
            <ul className="results">
              {result.results.map(res =>
                <CollectionListItem key={res.id} collection={res} />
              )}
              { !isFetching && result.next && (
                <Waypoint
                  onEnter={this.bottomReachedHandler}
                  scrollableAncestor={window}
                />
              )}
              { isFetching && (
                <SectionLoading />
              )}
            </ul>
          </DualPane.ContentPane>
        </DualPane>
      </Screen>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  return {
    query: Query.fromLocation(ownProps.location, {}, 'collection')
  };
}

CollectionsIndexScreen = injectIntl(CollectionsIndexScreen);
CollectionsIndexScreen = connect(mapStateToProps, { fetchCollections })(CollectionsIndexScreen);
export default CollectionsIndexScreen;