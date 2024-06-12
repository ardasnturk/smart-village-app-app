import PropTypes from 'prop-types';
import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { Map, TextListItem, Wrapper } from '../components';
import { colors, normalize } from '../config';
import { navigationToArtworksDetailScreen } from '../helpers';
import { SettingsContext } from '../SettingsProvider';

export const MapViewScreen = ({ navigation, route }) => {
  const {
    calloutTextEnabled,
    geometryTourData,
    isAugmentedReality,
    isMaximizeButtonVisible,
    isSue,
    locations,
    onMapPress,
    onMarkerPress,
    selectedPosition,
    showsUserLocation
  } = route?.params ?? {};

  const { globalSettings } = useContext(SettingsContext);
  const { navigation: navigationType } = globalSettings;

  const [position, setPosition] = useState(selectedPosition);
  const [locationsWithPin, setLocationsWithPin] = useState(locations);

  /* the improvement in the next comment line has been added for augmented reality feature. */
  const { data } = route?.params?.augmentedRealityData ?? [];

  const [modelId, setModelId] = useState();
  const [modelData, setModelData] = useState();

  useEffect(() => {
    if (isAugmentedReality) {
      navigationToArtworksDetailScreen({ data, isShow: true, modelId, setModelData });
    }
  }, [modelId]);
  /* end of augmented reality feature */

  useEffect(() => {
    if (isSue) {
      setLocationsWithPin((prevData) =>
        prevData.map((item) =>
          item?.iconName === 'location' ? { iconName: 'location', position } : item
        )
      );
    }
  }, [position]);

  return (
    <>
      <Map
        {...{
          calloutTextEnabled,
          geometryTourData,
          isMaximizeButtonVisible,
          locations: [...locationsWithPin, { position }],
          mapStyle: styles.map,
          onMarkerPress: isAugmentedReality ? setModelId : onMarkerPress,
          showsUserLocation
        }}
        onMapPress={async ({ nativeEvent }) => {
          if (
            nativeEvent.action !== 'marker-press' &&
            nativeEvent.action !== 'callout-inside-press' &&
            isSue
          ) {
            setPosition(nativeEvent.coordinate);

            try {
              await onMapPress({ nativeEvent });
            } catch (error) {
              setPosition(undefined);
            }
          }
        }}
      />

      {isAugmentedReality && modelData && (
        <Wrapper
          small
          style={[styles.listItemContainer, stylesWithProps({ navigationType }).position]}
        >
          <TextListItem
            item={{
              ...modelData,
              bottomDivider: false,
              subtitle: modelData.payload.locationInfo,
              onPress: () =>
                navigationToArtworksDetailScreen({
                  data,
                  isNavigation: true,
                  modelId,
                  navigation
                })
            }}
            navigation={navigation}
          />
        </Wrapper>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  augmentedRealityInfoContainer: {
    width: '90%'
  },
  map: {
    width: '100%',
    height: '100%'
  },
  marginTop: {
    marginTop: normalize(14)
  },
  listItemContainer: {
    backgroundColor: colors.surface,
    borderRadius: normalize(12),
    left: '4%',
    position: 'absolute',
    right: '4%',
    width: '92%',
    // shadow:
    elevation: 2,
    shadowColor: colors.shadowRgba,
    shadowOffset: {
      height: 5,
      width: 0
    },
    shadowOpacity: 0.5,
    shadowRadius: 3
  }
});

const stylesWithProps = ({ navigationType }) => {
  return StyleSheet.create({
    position: {
      bottom: navigationType === 'drawer' ? '8%' : '4%'
    }
  });
};

MapViewScreen.propTypes = {
  navigation: PropTypes.object,
  route: PropTypes.object
};
