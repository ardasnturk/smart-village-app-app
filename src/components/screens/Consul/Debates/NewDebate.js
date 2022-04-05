import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { useForm } from 'react-hook-form';
import { useMutation } from 'react-apollo';

import { Input } from '../../../Consul';
import { Wrapper, WrapperHorizontal, WrapperWithOrientation } from '../../../Wrapper';
import { texts } from '../../../../config';
import { Button } from '../../../Button';
import { Checkbox } from '../../../Checkbox';
import { START_DEBATE } from '../../../../queries/Consul';
import { ConsulClient } from '../../../../ConsulClient';
import { LoadingSpinner } from '../../../LoadingSpinner';
import { ScreenName } from '../../../../types';
import { QUERY_TYPES } from '../../../../queries';
import { UPDATE_DEBATE } from '../../../../queries/Consul/Debates/updateDebate';
import { SafeAreaViewFlex } from '../../../SafeAreaViewFlex';

const text = texts.consul.startNew;
const queryTypes = QUERY_TYPES.CONSUL;

// Alerts
const showRegistrationFailAlert = () =>
  Alert.alert(texts.consul.privacyCheckRequireTitle, texts.consul.privacyCheckRequireBody);
const graphqlErr = (err) => Alert.alert('Hinweis', err);

export const NewDebate = ({ navigation, data, query }) => {
  const [termsOfService, settermsOfService] = useState(data?.termsOfService ?? false);
  const [startLoading, setStartLoading] = useState(false);

  // React Hook Form
  const { control, handleSubmit } = useForm({
    defaultValues: {
      title: data?.title,
      description: data?.description,
      tagList: data?.tagList?.toString()
    }
  });

  // GraphQL
  const [startDebate] = useMutation(START_DEBATE, {
    client: ConsulClient
  });
  const [updateDebate] = useMutation(UPDATE_DEBATE, {
    client: ConsulClient
  });

  const onSubmit = async (val) => {
    let variables = {
      id: data?.id,
      attributes: {
        translationsAttributes: {
          title: val.title,
          description: val.description
        },
        tagList: val.tagList,
        termsOfService: termsOfService
      }
    };

    if (!termsOfService) return showRegistrationFailAlert();
    switch (query) {
      case queryTypes.START_DEBATE:
        setStartLoading(true);
        await startDebate({
          variables: variables
        })
          .then((val) => {
            setStartLoading(false);
            navigation.navigate(ScreenName.ConsulDetailScreen, {
              query: QUERY_TYPES.CONSUL.DEBATE,
              queryVariables: { id: val.data.startDebate.id },
              title: val.data.startDebate.title
            });
          })
          .catch((err) => {
            graphqlErr(err.message);
            console.error(err.message);
            setStartLoading(false);
          });
        break;
      case queryTypes.UPDATE_DEBATE:
        setStartLoading(true);
        await updateDebate({
          variables: variables
        })
          .then((val) => {
            setStartLoading(false);
            navigation.navigate(ScreenName.ConsulDetailScreen, {
              query: QUERY_TYPES.CONSUL.DEBATE,
              queryVariables: { id: val.data.updateDebate.id }
            });
          })
          .catch((err) => {
            graphqlErr(err.message);
            console.error(err.message);
            setStartLoading(false);
          });
        break;
      default:
        break;
    }
  };

  if (startLoading) return <LoadingSpinner loading />;

  return (
    <SafeAreaViewFlex>
      <WrapperWithOrientation>
        {Inputs.map((item, index) => (
          <Wrapper key={index} style={styles.noPaddingTop}>
            <Input {...item} control={control} rules={item.rules} />
          </Wrapper>
        ))}

        <WrapperHorizontal>
          <Checkbox
            title={text.termsOfServiceLabel}
            link={'https://beteiligung.bad-belzig.de/conditions'}
            linkDescription={text.termsOfServiceLinkLabel}
            checkedIcon="check-square-o"
            uncheckedIcon="square-o"
            checked={termsOfService}
            onPress={() => settermsOfService(!termsOfService)}
          />
        </WrapperHorizontal>

        <Wrapper>
          <Button
            onPress={handleSubmit(onSubmit)}
            title={
              query === queryTypes.START_DEBATE
                ? text.newDebateStartButtonLabel
                : text.updateButtonLabel
            }
          />
        </Wrapper>
      </WrapperWithOrientation>
    </SafeAreaViewFlex>
  );
};

NewDebate.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
    goBack: PropTypes.func
  }).isRequired,
  data: PropTypes.object,
  query: PropTypes.string
};

const styles = StyleSheet.create({
  noPaddingTop: {
    paddingTop: 0
  }
});

const Inputs = [
  {
    name: 'title',
    label: text.newDebateTitleLabel,
    placeholder: text.newDebateTitleLabel,
    keyboardType: 'default',
    textContentType: 'none',
    autoCompleteType: 'off',
    autoCapitalize: 'none',
    rules: {
      required: text.emailError,
      minLength: { value: 4, message: 'ist zu kurz (minimum 4 Zeichen)' }
    }
  },
  {
    name: 'description',
    multiline: true,
    minHeight: 150,
    label: text.newDebateDescriptionLabel,
    placeholder: text.newDebateDescriptionLabel,
    keyboardType: 'default',
    textContentType: 'none',
    autoCompleteType: 'off',
    autoCapitalize: 'none',
    rules: {
      required: text.emailError,
      minLength: { value: 10, message: 'ist zu kurz (minimum 10 Zeichen)' }
    }
  },
  {
    name: 'tagList',
    multiline: true,
    label: text.tags,
    placeholder: text.newDebateTagLabel,
    keyboardType: 'default',
    textContentType: 'none',
    autoCompleteType: 'off',
    autoCapitalize: 'none',
    rules: { required: false }
  }
];
