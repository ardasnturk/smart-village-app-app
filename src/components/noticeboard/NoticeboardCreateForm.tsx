import { StackNavigationProp } from '@react-navigation/stack';
import moment from 'moment';
import { extendMoment } from 'moment-range';
import React from 'react';
import { useMutation } from 'react-apollo';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Keyboard, StyleSheet } from 'react-native';
import { useQuery } from 'react-query';

import {
  Button,
  Checkbox,
  DateTimeInput,
  HtmlView,
  Input,
  RegularText,
  Touchable,
  Wrapper
} from '../../components';
import { Icon, colors, consts, normalize, texts } from '../../config';
import { momentFormat, storeProfileAuthToken } from '../../helpers';
import { QUERY_TYPES } from '../../queries';
import { CREATE_GENERIC_ITEM } from '../../queries/genericItem';
import { member } from '../../queries/profile';
import { showLoginAgainAlert } from '../../screens/profile/ProfileScreen';
import { NOTICEBOARD_TYPES, ProfileMember, ScreenName } from '../../types';

const { EMAIL_REGEX } = consts;
const extendedMoment = extendMoment(moment);

type TNoticeboardCreateData = {
  body: string;
  dateEnd: string;
  dateStart: string;
  email: string;
  name: string;
  noticeboardType: NOTICEBOARD_TYPES;
  termsOfService: boolean;
  title: string;
};

const NOTICEBOARD_TYPE_OPTIONS = [
  { value: NOTICEBOARD_TYPES.OFFER, title: texts.noticeboard.categoryNames.offer },
  { value: NOTICEBOARD_TYPES.SEARCH, title: texts.noticeboard.categoryNames.search }
];

export const NoticeboardCreateForm = ({
  navigation,
  route
}: {
  navigation: StackNavigationProp<any>;
  route: any;
}) => {
  const consentForDataProcessingText = route?.params?.consentForDataProcessingText ?? '';
  const genericType = route?.params?.genericType ?? '';
  const requestedDateDifference = route?.params?.requestedDateDifference ?? 3;

  const { data: memberData } = useQuery(QUERY_TYPES.PROFILE.MEMBER, member, {
    onSuccess: (responseData: ProfileMember) => {
      if (!responseData?.member) {
        storeProfileAuthToken();

        showLoginAgainAlert({
          onPress: () =>
            navigation.navigate(ScreenName.Profile, { refreshUser: new Date().valueOf() })
        });

        return;
      }
    }
  });

  const {
    control,
    formState: { errors },
    handleSubmit
  } = useForm({
    defaultValues: {
      body: '',
      dateEnd: new Date(),
      dateStart: new Date(),
      email: memberData?.member?.email ?? '',
      name: `${memberData?.member?.first_name ?? ''} ${memberData?.member?.last_name ?? ''}`.trim(),
      noticeboardType: '',
      termsOfService: false,
      title: ''
    }
  });

  const [createGenericItem, { loading }] = useMutation(CREATE_GENERIC_ITEM);

  const onSubmit = async (noticeboardNewData: TNoticeboardCreateData) => {
    Keyboard.dismiss();

    if (!noticeboardNewData.termsOfService) {
      return Alert.alert(texts.noticeboard.alerts.hint, texts.noticeboard.alerts.termsOfService);
    }

    const dateStart = new Date(noticeboardNewData.dateStart);
    const dateEnd = new Date(noticeboardNewData.dateEnd);
    const dateDifference = extendedMoment.range(dateStart, dateEnd).diff('months');

    if (dateDifference > requestedDateDifference || dateDifference < 0) {
      return Alert.alert(texts.noticeboard.alerts.hint, texts.noticeboard.alerts.dateDifference);
    }

    try {
      await createGenericItem({
        variables: {
          categoryName: texts.noticeboard.categoryNames[noticeboardNewData.noticeboardType],
          genericType,
          publishedAt: momentFormat(noticeboardNewData.dateStart),
          title: noticeboardNewData.title,
          contacts: [{ email: noticeboardNewData.email, firstName: noticeboardNewData.name }],
          contentBlocks: [{ body: noticeboardNewData.body, title: noticeboardNewData.title }],
          dates: [
            {
              dateEnd: momentFormat(noticeboardNewData.dateEnd),
              dateStart: momentFormat(noticeboardNewData.dateStart)
            }
          ]
        }
      });

      navigation.goBack();
      Alert.alert(texts.noticeboard.successScreen.header, texts.noticeboard.successScreen.entry);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <Input name="dateStart" hidden control={control} />

      <Wrapper style={styles.noPaddingTop}>
        <Input
          name="name"
          label={`${texts.noticeboard.inputName} *`}
          placeholder={texts.noticeboard.inputName}
          validate
          rules={{
            required: `${texts.noticeboard.inputName} ${texts.noticeboard.inputErrorText}`
          }}
          errorMessage={errors.name && errors.name.message}
          control={control}
        />
      </Wrapper>

      <Wrapper style={styles.noPaddingTop}>
        <Input
          name="email"
          label={`${texts.noticeboard.inputMail} *`}
          placeholder={texts.noticeboard.inputMail}
          keyboardType="email-address"
          validate
          rules={{
            required: `${texts.noticeboard.inputMail} ${texts.noticeboard.inputErrorText}`,
            pattern: {
              value: EMAIL_REGEX,
              message: `${texts.noticeboard.inputMail}${texts.noticeboard.invalidMail}`
            }
          }}
          errorMessage={errors.email && errors.email.message}
          control={control}
        />
      </Wrapper>

      <Wrapper style={styles.noPaddingTop}>
        <Controller
          name="noticeboardType"
          rules={{ required: texts.noticeboard.alerts.noticeboardType }}
          render={({ field: { onChange, value } }) => (
            <>
              {NOTICEBOARD_TYPE_OPTIONS.map((noticeboardItem) => (
                <Checkbox
                  key={noticeboardItem.title}
                  checked={value === noticeboardItem.value}
                  onPress={() => onChange(noticeboardItem.value)}
                  title={noticeboardItem.title}
                  checkedColor={colors.accent}
                  uncheckedColor={colors.darkText}
                  checkedIcon={undefined}
                  uncheckedIcon={undefined}
                />
              ))}
              <Input
                control={control}
                errorMessage={errors.noticeboardType && errors.noticeboardType.message}
                hidden
                name={'noticeboardType'}
                validate
              />
            </>
          )}
          control={control}
        />
      </Wrapper>

      <Wrapper style={styles.noPaddingTop}>
        <Input
          name="title"
          label={`${texts.noticeboard.inputTitle} *`}
          placeholder={texts.noticeboard.inputTitle}
          validate
          rules={{
            required: `${texts.noticeboard.inputTitle} ${texts.noticeboard.inputErrorText}`
          }}
          errorMessage={errors.title && errors.title.message}
          control={control}
        />
      </Wrapper>

      <Wrapper style={styles.noPaddingTop}>
        <Input
          name="body"
          label={`${texts.noticeboard.inputDescription} *`}
          placeholder={texts.noticeboard.inputDescription}
          validate
          multiline
          rules={{
            required: `${texts.noticeboard.inputDescription} ${texts.noticeboard.inputErrorText}`
          }}
          errorMessage={errors.body && errors.body.message}
          control={control}
        />
      </Wrapper>

      <Wrapper style={styles.noPaddingTop}>
        <Controller
          name="dateEnd"
          render={({ field: { name, onChange, value } }) => (
            <DateTimeInput
              {...{
                mode: 'date',
                errors,
                required: true,
                value,
                onChange,
                name,
                label: texts.noticeboard.inputDate(requestedDateDifference),
                placeholder: texts.noticeboard.inputDate(requestedDateDifference),
                control
              }}
            />
          )}
          control={control}
        />
      </Wrapper>

      <Wrapper style={styles.noPaddingTop}>
        {/* @ts-expect-error HtmlView uses memo in js, which is not inferred correctly */}
        <HtmlView html={consentForDataProcessingText} />

        <Controller
          name="termsOfService"
          render={({ field: { onChange, value } }) => (
            <Checkbox
              checked={!!value}
              checkedIcon={<Icon.SquareCheckFilled />}
              containerStyle={styles.paddingTop}
              onPress={() => onChange(!value)}
              title={`${texts.noticeboard.inputCheckbox} *`}
              uncheckedIcon={<Icon.Square color={colors.placeholder} />}
            />
          )}
          control={control}
        />
      </Wrapper>

      <Wrapper style={styles.noPaddingTop}>
        <Button
          onPress={handleSubmit(onSubmit)}
          title={texts.noticeboard.send}
          disabled={loading}
        />

        <Touchable onPress={() => navigation.goBack()}>
          <RegularText primary center>
            {texts.noticeboard.abort}
          </RegularText>
        </Touchable>
      </Wrapper>
    </>
  );
};

const styles = StyleSheet.create({
  noPaddingTop: {
    paddingTop: 0
  },
  paddingTop: {
    paddingTop: normalize(16)
  },
  textArea: {
    height: normalize(100),
    padding: normalize(10)
  }
});
