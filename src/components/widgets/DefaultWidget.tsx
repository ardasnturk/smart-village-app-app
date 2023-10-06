import React from 'react';
import { StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { IconProps, normalize } from '../../config';
import { Image } from '../Image';
import { BoldText, RegularText } from '../Text';
import { WrapperRow, WrapperVertical } from '../Wrapper';

type Props = {
  count?: number | string;
  Icon: (props: IconProps) => JSX.Element;
  image?: {
    height?: number;
    url: string;
    width?: number;
  };
  onPress: () => void;
  text: string;
};

export const DefaultWidget = ({ Icon, count, onPress, text, image }: Props) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <WrapperVertical style={styles.container}>
        <WrapperRow center>
          {image?.url ? (
            <Image
              source={{ url: image.url }}
              style={{
                height: normalize(image?.height ?? 26),
                width: normalize(image?.width ?? 33)
              }}
            />
          ) : (
            <Icon style={[styles.iconWithoutCount, !!count?.toString() && styles.iconWithCount]} />
          )}
          <BoldText primary big>
            {count ?? ''}
          </BoldText>
        </WrapperRow>
        <RegularText primary small>
          {text}
        </RegularText>
      </WrapperVertical>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center'
  },
  iconWithCount: {
    paddingRight: normalize(8)
  },
  iconWithoutCount: {
    paddingBottom: normalize(3)
  }
});
