import PropTypes from 'prop-types';
import React, { memo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Card } from 'react-native-elements';
import { Divider } from 'react-native-elements/dist/divider/Divider';

import { colors, consts, normalize } from '../config';
import { imageHeight, imageWidth } from '../helpers';

import { Image } from './Image';
import { SueCategory, SueImageFallback, SueStatus } from './SUE';
import { BoldText, RegularText } from './Text';
import { Touchable } from './Touchable';
import { Wrapper, WrapperHorizontal } from './Wrapper';

/* eslint-disable complexity */
const renderCardContent = (item, horizontal, sue) => {
  const {
    address,
    appDesignSystem = {},
    aspectRatio,
    iconName,
    picture,
    requestedDatetime,
    serviceName,
    status,
    subtitle,
    title,
    topTitle
  } = item;
  const { contentSequence, imageBorderRadius = 5, imageStyle, textsStyle = {} } = appDesignSystem;
  const { generalStyle, subtitleStyle, titleStyle, topTitleStyle } = textsStyle;

  const cardContent = [];

  const sequenceMap = {
    picture: () =>
      !!picture?.url && (
        <Image
          borderRadius={sue ? 0 : imageBorderRadius}
          containerStyle={[styles.imageContainer, styles.sueImageContainer, imageStyle]}
          source={{ uri: picture.url }}
          style={stylesWithProps({ aspectRatio, horizontal }).image}
        />
      ),
    subtitle: () =>
      !!subtitle && (
        <RegularText small style={[generalStyle, subtitleStyle]}>
          {subtitle}
        </RegularText>
      ),
    title: () =>
      !!title && (
        <BoldText style={[generalStyle, titleStyle]}>
          {horizontal ? (title.length > 60 ? title.substring(0, 60) + '...' : title) : title}
        </BoldText>
      ),
    topTitle: () => (
      <RegularText small style={[!!topTitleStyle && topTitleStyle]}>
        {topTitle}
      </RegularText>
    ),

    // SUE
    sue: {
      address: () => (
        <Wrapper>
          <RegularText small>{address}</RegularText>
        </Wrapper>
      ),
      category: () => (
        <SueCategory serviceName={serviceName} requestedDatetime={requestedDatetime} />
      ),
      divider: () => (
        <Wrapper style={styles.noPaddingTop}>
          <Divider />
        </Wrapper>
      ),
      pictureFallback: () => (
        <SueImageFallback
          style={[stylesWithProps({ aspectRatio, horizontal }).image, styles.sueImageContainer]}
        />
      ),
      status: () => <SueStatus iconName={iconName} status={status} />
    }
  };

  if (contentSequence?.length) {
    contentSequence.forEach((item) => {
      sequenceMap[item] && cardContent.push(sequenceMap[item]());
    });
  } else {
    picture?.url && cardContent.push(sequenceMap.picture());
    topTitle && cardContent.push(sequenceMap.topTitle());
    subtitle && cardContent.push(sequenceMap.subtitle());
    !sue && title && cardContent.push(sequenceMap.title());

    if (sue) {
      !picture?.url && cardContent.push(sequenceMap.sue.pictureFallback());
      serviceName && requestedDatetime && cardContent.push(sequenceMap.sue.category());
      serviceName && requestedDatetime && cardContent.push(sequenceMap.sue.divider());
      title && cardContent.push(<WrapperHorizontal>{sequenceMap.title()}</WrapperHorizontal>);
      address && cardContent.push(sequenceMap.sue.address());
      status && cardContent.push(sequenceMap.sue.status());
    }
  }

  return cardContent;
};
/* eslint-enable complexity */

export const CardListItem = memo(({ navigation, horizontal, item, sue }) => {
  const { appDesignSystem = {}, params, routeName: name, subtitle, title } = item;
  const { containerStyle, contentContainerStyle } = appDesignSystem;

  return (
    <Touchable
      accessibilityLabel={`${subtitle} (${title}) ${consts.a11yLabel.button}`}
      onPress={() => navigation && navigation.push(name, params)}
      disabled={!navigation}
    >
      <Card containerStyle={[styles.container, !!containerStyle && containerStyle]}>
        <View
          style={[
            stylesWithProps({ horizontal }).contentContainer,
            !!contentContainerStyle && contentContainerStyle,
            sue && styles.sueContentContainer
          ]}
        >
          {renderCardContent(item, horizontal, sue)}
        </View>
      </Card>
    </Touchable>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.transparent,
    borderWidth: 0,
    margin: 0,
    padding: normalize(14),
    ...Platform.select({
      android: {
        elevation: 0
      },
      ios: {
        shadowColor: colors.transparent
      }
    })
  },
  imageContainer: {
    alignSelf: 'center'
  },
  noPaddingTop: {
    paddingTop: 0
  },
  sueContentContainer: {
    borderWidth: 1,
    borderColor: colors.gray20,
    borderRadius: normalize(8)
  },
  sueImageContainer: {
    alignSelf: 'auto',
    borderTopLeftRadius: normalize(8),
    borderTopRightRadius: normalize(8)
  }
});

/* eslint-disable react-native/no-unused-styles */
/* this works properly, we do not want that warning */
const stylesWithProps = ({ aspectRatio, horizontal }) => {
  let width = imageWidth();

  if (horizontal) {
    // image width should be only 70% when rendering horizontal cards
    width = width * 0.7;
  }

  const maxWidth = width - 2 * normalize(14); // width of an image minus paddings

  return StyleSheet.create({
    contentContainer: {
      width: maxWidth
    },
    image: {
      marginBottom: normalize(7),
      height: imageHeight(maxWidth, aspectRatio),
      width: maxWidth
    }
  });
};
/* eslint-enable react-native/no-unused-styles */

CardListItem.displayName = 'CardListItem';

CardListItem.propTypes = {
  navigation: PropTypes.object,
  item: PropTypes.object.isRequired,
  horizontal: PropTypes.bool,
  sue: PropTypes.bool
};

CardListItem.defaultProps = {
  horizontal: false,
  sue: false
};
