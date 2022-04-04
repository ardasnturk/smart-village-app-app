import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { Alert, TouchableOpacity, StyleSheet, ScrollView, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { useMutation } from 'react-apollo';

import { Input } from '../../../Consul';
import { Wrapper, WrapperHorizontal, WrapperWithOrientation } from '../../../Wrapper';
import { texts, colors } from '../../../../config';
import { Button } from '../../../Button';
import { Checkbox } from '../../../Checkbox';
import { START_PROPOSAL, UPDATE_PROPOSAL } from '../../../../queries/Consul';
import { ConsulClient } from '../../../../ConsulClient';
import { LoadingSpinner } from '../../../LoadingSpinner';
import { ScreenName } from '../../../../types';
import { QUERY_TYPES } from '../../../../queries';
import { RegularText } from '../../../Text';
import { Label } from '../../../Label';
import { SafeAreaViewFlex } from '../../../SafeAreaViewFlex';

const text = texts.consul.startNew;
const queryTypes = QUERY_TYPES.CONSUL;

const kategorien = [
  { name: 'Associations', id: 0, selected: false },
  { name: 'Culture', id: 1, selected: false },
  { name: 'Economy', id: 2, selected: false },
  { name: 'Employment', id: 3, selected: false },
  { name: 'Environment', id: 4, selected: false },
  { name: 'Equity', id: 5, selected: false },
  { name: 'Health', id: 6, selected: false },
  { name: 'Media', id: 7, selected: false },
  { name: 'Mobility', id: 8, selected: false },
  { name: 'Participation', id: 9, selected: false },
  { name: 'Security and Emergencies', id: 10, selected: false },
  { name: 'Social Rights', id: 11, selected: false },
  { name: 'Sports', id: 12, selected: false },
  { name: 'Sustainability', id: 13, selected: false },
  { name: 'Transparency', id: 14, selected: false }
];

// Alerts
const showRegistrationFailAlert = () =>
  Alert.alert(texts.consul.privacyCheckRequireTitle, texts.consul.privacyCheckRequireBody);
const graphqlErr = (err) => Alert.alert('Hinweis', err);

export const NewProposal = ({ navigation, data, query }) => {
  const [termsOfService, settermsOfService] = useState(data?.termsOfService ?? false);
  const [startLoading, setStartLoading] = useState(false);
  const [tags, setTags] = useState([]);

  // React Hook Form
  const { control, handleSubmit, setValue } = useForm({
    defaultValues: {
      title: data?.title,
      description: data?.description,
      tagList: data?.tagList?.toString(),
      summary: data?.summary,
      videoUrl: data?.videoUrl
    }
  });

  // GraphQL
  const [submitProposal] = useMutation(START_PROPOSAL, {
    client: ConsulClient
  });
  const [updateProposal] = useMutation(UPDATE_PROPOSAL, {
    client: ConsulClient
  });

  useEffect(() => {
    if (data?.tagList) {
      kategorien.map((item) => {
        for (let i = 0; i < data?.tagList.length; i++) {
          const element = data?.tagList[i];
          if (item.name === element) {
            item.selected = true;
          }
        }
      });
      setTags(kategorien);
    }
  }, []);

  useEffect(() => {
    setTags(kategorien);
    const selectedTag = tags.map((item) => {
      if (item.selected) return item.name;
    });
    const filterData = selectedTag.filter((data) => data);
    setValue('tagList', filterData.toString());
  }, [tags]);

  const onSubmit = async (val) => {
    let variables = {
      id: data?.id,
      attributes: {
        translationsAttributes: {
          title: val.title,
          summary: val.summary,
          description: val.description
        },
        tagList: val.tagList,
        termsOfService: termsOfService,
        videoUrl: val.videoUrl
      }
    };

    if (!termsOfService) return showRegistrationFailAlert();

    switch (query) {
      case queryTypes.START_PROPOSAL:
        setStartLoading(true);
        await submitProposal({
          variables: variables
        })
          .then((val) => {
            setStartLoading(false);
            navigation.navigate(ScreenName.ConsulDetailScreen, {
              query: QUERY_TYPES.CONSUL.PROPOSAL,
              queryVariables: { id: val.data.submitProposal.id },
              title: val.data.submitProposal.title,
              publishedProposal: false
            });
          })
          .catch((err) => {
            graphqlErr(err.message);
            console.error(err.message);
            setStartLoading(false);
          });
        break;
      case queryTypes.UPDATE_PROPOSAL:
        setStartLoading(true);

        //TODO: Mutation Error!
        await updateProposal({
          variables: variables
        })
          .then((val) => {
            setStartLoading(false);
            navigation.navigate(ScreenName.ConsulDetailScreen, {
              query: QUERY_TYPES.CONSUL.PROPOSAL,
              queryVariables: { id: val.data.updateProposal.id }
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
          <View key={index}>
            {item.type === 'input' && (
              <Wrapper key={index} style={styles.noPaddingTop}>
                <Input key={index} {...item} control={control} rules={item.rules} />
              </Wrapper>
            )}

            {item.type === 'infoText' && (
              <Wrapper style={styles.noPaddingTop}>
                <RegularText key={index} smallest placeholder>
                  {item.title}
                </RegularText>
              </Wrapper>
            )}

            {item.type === 'category' && (
              <Wrapper style={styles.noPaddingTop} key={index}>
                <Label>{item.title}</Label>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {item.category.map((items, indexs) => (
                    <TouchableOpacity
                      key={indexs}
                      style={[
                        styles.tagContainer,
                        {
                          backgroundColor: items.selected ? colors.darkerPrimary : colors.borderRgba
                        }
                      ]}
                      onPress={() => {
                        if (items.selected) {
                          items.selected = false;
                        } else {
                          items.selected = true;
                        }
                        setTags([]);
                      }}
                    >
                      <RegularText
                        small
                        style={styles.tagText}
                        lighter={items.selected ? true : false}
                      >
                        {items.name}
                      </RegularText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </Wrapper>
            )}
          </View>
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
              query === queryTypes.START_PROPOSAL
                ? text.newProposalStartButtonLabel
                : text.updateButtonLabel
            }
          />
        </Wrapper>
      </WrapperWithOrientation>
    </SafeAreaViewFlex>
  );
};

NewProposal.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
    goBack: PropTypes.func
  }).isRequired,
  data: PropTypes.object,
  query: PropTypes.string
};

const styles = StyleSheet.create({
  tagContainer: {
    backgroundColor: colors.borderRgba,
    margin: 5,
    borderRadius: 5
  },
  tagText: {
    padding: 10
  },
  noPaddingTop: {
    paddingTop: 0
  }
});

const Inputs = [
  {
    type: 'input',
    name: 'title',
    label: text.newProposalTitleLabel,
    placeholder: text.newProposalTitleLabel,
    keyboardType: 'default',
    textContentType: 'none',
    autoCompleteType: 'off',
    autoCapitalize: 'none',
    rules: {
      required: text.leerError,
      minLength: { value: 4, message: text.titleShortError }
    }
  },
  {
    type: 'input',
    name: 'summary',
    multiline: true,
    label: text.newProposalSummaryLabel,
    placeholder: text.newProposalSummaryLabel,
    keyboardType: 'default',
    textContentType: 'none',
    autoCompleteType: 'off',
    autoCapitalize: 'none',
    rules: {
      required: text.leerError,
      maxLength: { value: 200, message: text.proposalSummaryInfo }
    }
  },
  {
    type: 'infoText',
    title: text.proposalSummaryInfo
  },
  {
    type: 'input',
    name: 'description',
    multiline: true,
    label: text.newProposalDescriptionLabel,
    placeholder: text.newProposalDescriptionLabel,
    keyboardType: 'default',
    textContentType: 'none',
    autoCompleteType: 'off',
    autoCapitalize: 'none',
    rules: {
      required: text.leerError,
      minLength: { value: 10, message: text.descriptionShortError }
    }
  },
  {
    type: 'input',
    name: 'videoUrl',
    label: text.newProposalExternesVideoUrlLabel,
    placeholder: text.newProposalExternesVideoUrlLabel,
    keyboardType: 'default',
    textContentType: 'none',
    autoCompleteType: 'off',
    autoCapitalize: 'none',
    rules: { required: false }
  },
  {
    type: 'infoText',
    title: text.proposalVideoUrlInfo
  },
  {
    type: 'input',
    name: 'tagList',
    multiline: true,
    label: text.newProposalTagLabel,
    placeholder: text.newProposalTagLabel,
    keyboardType: 'default',
    textContentType: 'none',
    autoCompleteType: 'off',
    autoCapitalize: 'none',
    rules: { required: false }
  },
  {
    type: 'infoText',
    title: text.proposalTagInfo
  },
  {
    type: 'category',
    title: 'Kategorien',
    category: kategorien
  }
];
