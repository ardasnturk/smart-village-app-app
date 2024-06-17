import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackScreenProps } from '@react-navigation/stack';
import * as Location from 'expo-location';
import * as ScreenOrientation from 'expo-screen-orientation';
import parsePhoneNumber from 'libphonenumber-js';
import React, { useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { UseFormGetValues, UseFormSetValue, useForm } from 'react-hook-form';
import { ActivityIndicator, Alert, Keyboard, ScrollView, StyleSheet, View } from 'react-native';
import { Divider } from 'react-native-elements';
import { useMutation, useQuery } from 'react-query';

import { ConfigurationsContext } from '../../ConfigurationsProvider';
import {
  BoldText,
  Button,
  DefaultKeyboardAvoidingView,
  HeaderRight,
  LoadingContainer,
  RegularText,
  SafeAreaViewFlex,
  SueReportDescription,
  SueReportLocation,
  SueReportProgress,
  SueReportSend,
  SueReportServices,
  SueReportUser,
  Wrapper
} from '../../components';
import { colors, device, normalize, texts } from '../../config';
import { addToStore, formatSize, readFromStore } from '../../helpers';
import { useKeyboardHeight } from '../../hooks';
import { QUERY_TYPES, getQuery } from '../../queries';
import { postRequests } from '../../queries/SUE';

export const SUE_REPORT_VALUES = 'sueReportValues';

type TRequiredFields = {
  [key: string]: {
    [key: string]: boolean;
  };
};

const sueProgressWithRequiredInputs = (
  progress: TProgress[],
  fields: TRequiredFields
): TProgress[] => {
  const requiredInputs: { [key: string]: boolean } = {};

  for (const section in fields) {
    for (const field in fields[section]) {
      requiredInputs[field] = fields[section][field];
    }
  }

  return progress.map((item) => {
    item.requiredInputs = (item.requiredInputs || [])?.filter((key) => requiredInputs?.[key]);

    for (const key of item.inputs || []) {
      if (requiredInputs[key] && !item.requiredInputs.includes(key)) {
        item.requiredInputs.push(key);
      }
    }

    return item;
  });
};

export type TValues = {
  city: string;
  description: string;
  email: string;
  firstName: string;
  houseNumber: string;
  images: string;
  lastName: string;
  phone: string;
  street: string;
  termsOfService: boolean;
  title: string;
  zipCode: string;
};

export type TService = {
  description: string;
  metadata: boolean;
  serviceCode: string;
  serviceName: string;
};

type TContent = {
  areaServiceData: { postalCodes: string[] } | undefined;
  configuration: {
    geoMap: {
      areas: any[];
      center: number[];
      clisterTreshold: number;
      clusterDistance: number;
      locationIsRequired: boolean;
      locationStreetIsRequired: boolean;
      minZoom: number;
    };
    limitation: any;
    requiredFields: any;
  };
  content: 'category' | 'description' | 'location' | 'user';
  requiredInputs: keyof TValues[];
  service: TService | undefined;
  setService: any;
  control: any;
  errorMessage: string;
  errors: any;
  selectedPosition: Location.LocationObjectCoords | undefined;
  setSelectedPosition: (position: Location.LocationObjectCoords | undefined) => void;
  setUpdateRegionFromImage: (value: boolean) => void;
  updateRegionFromImage: boolean;
  setValue: UseFormSetValue<TValues>;
  getValues: UseFormGetValues<TValues>;
};

const Content = ({
  areaServiceData,
  configuration,
  content,
  control,
  errorMessage,
  errors,
  getValues,
  requiredInputs,
  selectedPosition,
  service,
  setSelectedPosition,
  setService,
  setUpdateRegionFromImage,
  setValue,
  updateRegionFromImage
}: TContent) => {
  switch (content) {
    case 'description':
      return (
        <SueReportDescription
          areaServiceData={areaServiceData}
          configuration={configuration}
          control={control}
          errorMessage={errorMessage}
          requiredInputs={requiredInputs}
          setSelectedPosition={setSelectedPosition}
          setUpdateRegionFromImage={setUpdateRegionFromImage}
          setValue={setValue}
        />
      );
    case 'location':
      return (
        <SueReportLocation
          areaServiceData={areaServiceData}
          control={control}
          errorMessage={errorMessage}
          getValues={getValues}
          requiredInputs={requiredInputs}
          selectedPosition={selectedPosition}
          setSelectedPosition={setSelectedPosition}
          setUpdateRegionFromImage={setUpdateRegionFromImage}
          setValue={setValue}
          updateRegionFromImage={updateRegionFromImage}
        />
      );
    case 'user':
      return (
        <SueReportUser
          configuration={configuration}
          control={control}
          errors={errors}
          requiredInputs={requiredInputs}
        />
      );
    default:
      return <SueReportServices setService={setService} service={service} />;
  }
};

type TReports = {
  category: string;
  city: string;
  description: string;
  email: string;
  firstName: string;
  houseNumber: string;
  images: { uri: string; mimeType: string }[];
  lastName: string;
  phone: string;
  street: string;
  termsOfService: string;
  title: string;
  zipCode: string;
};

type TProgress = {
  content: 'category' | 'description' | 'location' | 'user';
  inputs: string[];
  requiredInputs?: keyof TReports[];
  serviceCode: string;
  title: string;
};

/* eslint-disable complexity */
export const SueReportScreen = ({
  navigation,
  route
}: { navigation: any } & StackScreenProps<any>) => {
  const { sueConfig = {} } = useContext(ConfigurationsContext);
  const {
    geoMap = {},
    limitation = {},
    limitOfArea = {},
    requiredFields = {},
    sueProgress = []
  } = sueConfig;

  const {
    city: limitOfCity = '',
    zipCodes: limitOfZipCodes = [],
    errorMessage = texts.sue.report.alerts.limitOfArea(limitOfArea.city || '')
  } = limitOfArea;

  const [sueProgressWithConfig, setSueProgressWithConfig] = useState<TProgress[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [service, setService] = useState<TService>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingStoredData, setIsLoadingStoredData] = useState<boolean>(true);
  const [selectedPosition, setSelectedPosition] = useState<Location.LocationObjectCoords>();
  const [isDone, setIsDone] = useState(false);
  const [storedValues, setStoredValues] = useState<TReports>();
  const [updateRegionFromImage, setUpdateRegionFromImage] = useState(false);
  const [contentHeights, setContentHeights] = useState([]);

  const scrollViewRef = useRef(null);
  const scrollViewContentRef = useRef([]);

  const keyboardHeight = useKeyboardHeight();

  useEffect(() => {
    // this screen is set to portrait mode because half of the screen is visible in landscape
    // mode when viewing pictures in large screen mode
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT);
    });

    return unsubscribe;
  }, [navigation]);

  const handleContentSizeChange = (index: number, contentHeight: number) => {
    setContentHeights((prevHeights) => {
      const newHeights = [...prevHeights];
      newHeights[index] = contentHeight;
      return newHeights;
    });
  };

  const {
    control,
    formState: { errors },
    handleSubmit,
    getValues,
    setValue,
    reset
  } = useForm({
    mode: 'onBlur',
    defaultValues: {
      city: '',
      description: '',
      email: '',
      firstName: '',
      houseNumber: '',
      images: '[]',
      lastName: '',
      phone: '',
      street: '',
      termsOfService: false,
      title: '',
      zipCode: ''
    }
  });

  const { data: areaServiceData, isLoading: areaServiceLoading } = useQuery(
    [QUERY_TYPES.SUE.AREA_SERVICE],
    () => getQuery(QUERY_TYPES.SUE.AREA_SERVICE)(),
    { enabled: !!limitOfCity }
  );

  const { mutateAsync } = useMutation(postRequests);

  const onSubmit = async (sueReportData: TReports) => {
    Keyboard.dismiss();

    storeReportValues();

    if (alertTextGeneratorForMissingData()) {
      return Alert.alert(texts.sue.report.alerts.hint, alertTextGeneratorForMissingData());
    }

    let addressString;
    if (
      !!sueReportData.street ||
      !!sueReportData.houseNumber ||
      !!sueReportData.zipCode ||
      !!sueReportData.city
    ) {
      addressString = `${sueReportData.street}; ${sueReportData.houseNumber}; ${sueReportData.zipCode}; ${sueReportData.city}`;
    }

    const formData = {
      addressString,
      lat: selectedPosition?.latitude,
      long: selectedPosition?.longitude,
      serviceCode: service?.serviceCode,
      ...sueReportData,
      phone: parsePhoneNumber(sueReportData.phone, 'DE')?.formatInternational(),
      description: sueReportData.description || '-'
    };

    setIsLoading(true);
    await mutateAsync(formData, {
      onError: () => {
        setIsLoading(false);
        setCurrentProgress(0);

        return Alert.alert(texts.defectReport.alerts.hint, texts.defectReport.alerts.error);
      },
      onSuccess: (data) => {
        if (data?.status && data.status !== 200) {
          setIsLoading(false);
          setCurrentProgress(0);

          return Alert.alert(texts.defectReport.alerts.hint, texts.defectReport.alerts.error);
        }

        setTimeout(
          () => {
            setIsDone(true);
            resetStoredValues();
            setIsLoading(false);
          },
          JSON.parse(sueReportData?.images).length ? 0 : 3000
        );
      }
    });
  };

  /* eslint-disable complexity */
  const alertTextGeneratorForMissingData = () => {
    const requiredInputs = sueProgressWithConfig?.[currentProgress]?.requiredInputs;

    const isAnyInputMissing = requiredInputs?.some(
      (inputKey: keyof TValues) => !getValues()[inputKey]
    );

    switch (currentProgress) {
      case 0:
        if (!service?.serviceCode) {
          return texts.sue.report.alerts.serviceCode;
        }
        break;
      case 1:
        if (!getValues().title) {
          return texts.sue.report.alerts.title;
        } else if (getValues().images) {
          const images = JSON.parse(getValues().images);

          let totalSize = 0;
          const totalSizeLimit = parseInt(limitation?.maxAttachmentSize?.value);

          const isImageGreater10MB = images.some(({ size }: { size: number }) => {
            totalSize += size;
            return size >= 10485760;
          });

          /* the server does not support files more than 10MB in size. */
          if (isImageGreater10MB) {
            return texts.sue.report.alerts.imageGreater10MBError;
          }

          /* the server does not support files larger than 30 MB in total of all files. */
          if (totalSize >= totalSizeLimit) {
            return texts.sue.report.alerts.imagesTotalSizeError(formatSize(totalSizeLimit, 0));
          }
        }

        if (isAnyInputMissing) {
          return texts.sue.report.alerts.missingAnyInput;
        }

        if (selectedPosition) {
          Alert.alert(texts.sue.report.alerts.hint, texts.sue.report.alerts.imageLocation);
        }
        break;
      case 2:
        if (getValues().houseNumber && !getValues().street) {
          return texts.sue.report.alerts.street;
        }

        if (getValues().city) {
          if (!getValues().zipCode) {
            return texts.sue.report.alerts.zipCode;
          }

          if (!areaServiceData?.postalCodes?.includes(getValues('zipCode'))) {
            return errorMessage;
          }
        }

        if (getValues().zipCode) {
          if (getValues().zipCode.length !== 5) {
            return texts.sue.report.alerts.zipCodeLength;
          }

          if (!getValues().city) {
            return texts.sue.report.alerts.city;
          }

          if (!!limitOfZipCodes.length && !limitOfZipCodes.includes(getValues().zipCode)) {
            return errorMessage;
          }
        }

        if (isAnyInputMissing) {
          return texts.sue.report.alerts.missingAnyInput;
        }
        break;
      case 3:
        if (isAnyInputMissing) {
          return texts.sue.report.alerts.missingAnyInput;
        }

        if (!getValues().firstName && !getValues().lastName && !getValues().email) {
          return texts.sue.report.alerts.contact;
        }

        if (!getValues().termsOfService) {
          scrollViewContentRef.current[currentProgress]?.scrollTo({
            x: 0,
            y: contentHeights[currentProgress],
            animated: true
          });

          return texts.sue.report.alerts.termsOfService;
        }
        break;
      default:
        break;
    }
  };
  /* eslint-enable complexity */

  useEffect(() => {
    readReportValuesFromStore();
  }, []);

  useEffect(() => {
    setSueProgressWithConfig(sueProgressWithRequiredInputs(sueProgress, requiredFields));
  }, [sueProgress, requiredFields]);

  const storeReportValues = async () => {
    await addToStore(SUE_REPORT_VALUES, {
      selectedPosition,
      service,
      ...getValues()
    });
  };

  const readReportValuesFromStore = async () => {
    const storedValues = await readFromStore(SUE_REPORT_VALUES);

    if (storedValues) {
      setStoredValues(storedValues);
      setService(storedValues.service);
      setSelectedPosition(storedValues.selectedPosition);
      Object.entries(storedValues).map(([key, value]) => setValue(key, value));
    }

    setIsLoadingStoredData(false);
  };

  const resetStoredValues = async () => {
    setIsLoadingStoredData(true);
    await AsyncStorage.removeItem(SUE_REPORT_VALUES);
    setStoredValues(undefined);
    setService(undefined);
    setSelectedPosition(undefined);
    reset();
    scrollViewRef?.current?.scrollTo({
      x: 0,
      y: 0,
      animated: true
    });
    setCurrentProgress(0);
    setIsLoadingStoredData(false);
  };

  const handleNextPage = async () => {
    Keyboard.dismiss();
    if (alertTextGeneratorForMissingData()) {
      return Alert.alert(texts.sue.report.alerts.hint, alertTextGeneratorForMissingData());
    }

    storeReportValues();

    if (currentProgress < sueProgressWithConfig.length - 1) {
      setCurrentProgress(currentProgress + 1);
      scrollViewRef?.current?.scrollTo({
        x: device.width * (currentProgress + 1),
        y: 0,
        animated: true
      });
    }
  };

  const handlePrevPage = () => {
    Keyboard.dismiss();
    if (currentProgress > 0) {
      setCurrentProgress(currentProgress - 1);
      scrollViewRef?.current?.scrollTo({
        x: device.width * (currentProgress - 1),
        y: 0,
        animated: true
      });
    }
  };

  useLayoutEffect(() => {
    if (storedValues) {
      navigation.setOptions({
        headerRight: () => (
          <HeaderRight
            {...{
              onPress: () =>
                Alert.alert(
                  texts.sue.report.alerts.dataDeleteAlert.title,
                  texts.sue.report.alerts.dataDeleteAlert.message,
                  [
                    { text: texts.sue.report.alerts.dataDeleteAlert.cancel },
                    {
                      text: texts.sue.report.alerts.dataDeleteAlert.ok,
                      onPress: resetStoredValues,
                      style: 'destructive'
                    }
                  ]
                ),
              navigation,
              route,
              withDelete: true
            }}
          />
        )
      });
    } else {
      navigation.setOptions({
        headerRight: () => null
      });
    }
  }, [storedValues, service, selectedPosition]);

  if (areaServiceLoading) {
    return (
      <LoadingContainer>
        <ActivityIndicator color={colors.refreshControl} />
      </LoadingContainer>
    );
  }

  if (isDone || isLoading) {
    return <SueReportSend navigation={navigation} isDone={isDone} isLoading={isLoading} />;
  }

  return (
    <SafeAreaViewFlex>
      <SueReportProgress progress={sueProgressWithConfig} currentProgress={currentProgress + 1} />

      <DefaultKeyboardAvoidingView>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          horizontal
          pagingEnabled
          ref={scrollViewRef}
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
        >
          {sueProgressWithConfig?.map((item: TProgress, index: number) => (
            <ScrollView
              key={index}
              contentContainerStyle={styles.contentContainer}
              ref={(e) => (scrollViewContentRef.current[index] = e)}
              onContentSizeChange={(contentHeight: number) =>
                handleContentSizeChange(index, contentHeight)
              }
            >
              {isLoadingStoredData ? (
                <LoadingContainer>
                  <ActivityIndicator color={colors.refreshControl} />
                </LoadingContainer>
              ) : (
                Content({
                  areaServiceData,
                  configuration: {
                    limitation,
                    geoMap,
                    requiredFields
                  },
                  content: item.content,
                  control,
                  errorMessage,
                  errors,
                  getValues,
                  requiredInputs: item.requiredInputs,
                  selectedPosition,
                  service,
                  setSelectedPosition,
                  setService,
                  setUpdateRegionFromImage,
                  setValue,
                  updateRegionFromImage
                })
              )}

              {device.platform === 'android' && (
                <View style={{ height: normalize(keyboardHeight) * 0.5 }} />
              )}
            </ScrollView>
          ))}
        </ScrollView>

        <Divider />

        {!!service?.serviceName && !!service.description && currentProgress === 0 && (
          <Wrapper style={styles.noPaddingBottom}>
            <BoldText>{service.serviceName}</BoldText>
            <RegularText>{service.description}</RegularText>
          </Wrapper>
        )}

        <Wrapper
          style={[styles.buttonContainer, currentProgress !== 0 && styles.buttonContainerRow]}
        >
          {currentProgress !== 0 && (
            <Button
              disabled={isLoading}
              invert
              notFullWidth
              onPress={handlePrevPage}
              title={texts.sue.report.back}
            />
          )}

          <Button
            disabled={isLoading}
            notFullWidth={currentProgress !== 0}
            onPress={
              currentProgress < sueProgressWithConfig.length - 1
                ? handleNextPage
                : handleSubmit(onSubmit)
            }
            title={
              currentProgress === sueProgressWithConfig.length - 1
                ? texts.sue.report.sendReport
                : texts.sue.report.next
            }
          />
        </Wrapper>
      </DefaultKeyboardAvoidingView>
    </SafeAreaViewFlex>
  );
};
/* eslint-enable complexity */

const styles = StyleSheet.create({
  buttonContainer: {
    paddingBottom: 0
  },
  buttonContainerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  contentContainer: {
    width: device.width
  },
  noPaddingBottom: {
    paddingBottom: 0
  }
});
