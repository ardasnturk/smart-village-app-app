import * as SecureStore from 'expo-secure-store';
import moment from 'moment';

import 'moment/locale/de';
import * as appJson from '../../app.json';
import { secrets } from '../config';
import { QUERY_TYPES } from '../queries/types';
import { VolunteerUser } from '../types';

import { eventDate } from './dateTimeHelper';
import { subtitle } from './textHelper';

const namespace = appJson.expo.slug as keyof typeof secrets;
const serverUrl = secrets[namespace]?.volunteer?.serverUrl;
export const volunteerApiV1Url = serverUrl + secrets[namespace]?.volunteer?.v1;
export const volunteerApiV2Url = serverUrl + secrets[namespace]?.volunteer?.v2;

const VOLUNTEER_AUTH_TOKEN = 'VOLUNTEER_AUTH_TOKEN';
const VOLUNTEER_CURRENT_USER_ID = 'VOLUNTEER_CURRENT_USER_ID';
const VOLUNTEER_CURRENT_USER_GUID = 'VOLUNTEER_CURRENT_USER_GUID';
const VOLUNTEER_CURRENT_USER_CONTENT_CONTAINER_ID = 'VOLUNTEER_CURRENT_USER_CONTENT_CONTAINER_ID';

export const storeVolunteerAuthToken = (authToken?: string) => {
  if (authToken) {
    SecureStore.setItemAsync(VOLUNTEER_AUTH_TOKEN, authToken);
  } else {
    SecureStore.deleteItemAsync(VOLUNTEER_AUTH_TOKEN);
  }
};

export const volunteerAuthToken = () => SecureStore.getItemAsync(VOLUNTEER_AUTH_TOKEN);

export const storeVolunteerUserData = (userData?: {
  id: number;
  guid: number;
  contentcontainer_id: number;
}) => {
  if (userData) {
    SecureStore.setItemAsync(VOLUNTEER_CURRENT_USER_ID, `${userData.id}`);
    SecureStore.setItemAsync(VOLUNTEER_CURRENT_USER_GUID, `${userData.guid}`);
    SecureStore.setItemAsync(
      VOLUNTEER_CURRENT_USER_CONTENT_CONTAINER_ID,
      `${userData.contentcontainer_id}`
    );
  } else {
    SecureStore.deleteItemAsync(VOLUNTEER_CURRENT_USER_ID);
    SecureStore.deleteItemAsync(VOLUNTEER_CURRENT_USER_GUID);
    SecureStore.deleteItemAsync(VOLUNTEER_CURRENT_USER_CONTENT_CONTAINER_ID);
  }
};

export const volunteerUserData = async (): Promise<{
  currentUserId: string | null;
  currentUserGuId: string | null;
  currentUserContentContainerId: string | null;
}> => {
  const currentUserId = await SecureStore.getItemAsync(VOLUNTEER_CURRENT_USER_ID);
  const currentUserGuId = await SecureStore.getItemAsync(VOLUNTEER_CURRENT_USER_GUID);
  const currentUserContentContainerId = await SecureStore.getItemAsync(
    VOLUNTEER_CURRENT_USER_CONTENT_CONTAINER_ID
  );

  return {
    currentUserId,
    currentUserGuId,
    currentUserContentContainerId
  };
};

export const volunteerListDate = (
  data: {
    end_datetime: string;
    start_datetime: string;
    updated_at?: string;
  },
  withTime = false
) => {
  const { end_datetime: endDatetime, start_datetime: startDatetime, updated_at: updatedAt } = data;

  if (updatedAt) {
    // summer time
    if (moment().isDST()) {
      return moment(updatedAt).format('YYYY-MM-DD HH:mm:ss');
    }

    // winter time
    return moment.utc(updatedAt).local().format('YYYY-MM-DD HH:mm:ss');
  }

  if (moment().isBetween(startDatetime, endDatetime)) return moment().format('YYYY-MM-DD');

  return moment(startDatetime).format(withTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD');
};

export const volunteerSubtitle = (
  volunteer: any,
  query: string,
  withDate: boolean,
  isSectioned?: boolean
) => {
  let date = eventDate(
    volunteerListDate(volunteer, withDate),
    undefined,
    isSectioned ? 'HH:mm' : 'DD.MM.YYYY HH:mm'
  );

  if (query === QUERY_TYPES.VOLUNTEER.CONVERSATION) {
    date = eventDate(volunteerListDate(volunteer), undefined, 'DD.MM.YYYY HH:mm');
  } else if (withDate) {
    date = date.replace('00:00', '');
  }

  return subtitle(
    withDate ? date : undefined,
    query !== QUERY_TYPES.VOLUNTEER.CALENDAR && volunteer.tags?.length ? volunteer.tags : undefined
  );
};

export const isAttending = (currentUserId: string | null, attending?: []): boolean => {
  if (!currentUserId || !attending?.length) return false;

  return attending.some((item: VolunteerUser) => item.id.toString() == currentUserId);
};

export const isOwner = (currentUserId: string | null, owner: VolunteerUser): boolean => {
  if (!currentUserId || !owner?.id) return false;

  return owner.id.toString() == currentUserId;
};

export const isAccount = (currentUserId: string | null, account: VolunteerUser): boolean => {
  if (!currentUserId || !account?.id) return false;

  return account.id.toString() == currentUserId;
};

export const isApplicant = (
  currentUserId: string | null,
  applicants?: { user: VolunteerUser }[]
): boolean => {
  if (!currentUserId || !applicants?.length) return false;

  return applicants.some(
    (item: { user: VolunteerUser }) => item.user.id.toString() == currentUserId
  );
};

export const isMember = (
  currentUserId: string | null,
  members?: { user: VolunteerUser }[]
): boolean => {
  if (!currentUserId || !members?.length) return false;

  return members.some((item: { user: VolunteerUser }) => item.user.id.toString() == currentUserId);
};

export const volunteerProfileImage = (guid: string) =>
  `${serverUrl}/uploads/profile_image/${guid}.jpg`;

export const volunteerBannerImage = (guid: string) =>
  `${serverUrl}/uploads/profile_image/banner/${guid}.jpg`;
