import {
  volunteerApiV1Url,
  volunteerApiV2Url,
  volunteerAuthToken
} from '../../helpers/volunteerHelper';
import { VolunteerRegistration } from '../../types';

export const logIn = async ({ username, password }: { username: string; password: string }) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);

  const fetchObj = {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'multipart/form-data'
    },
    body: formData
  };

  return (await fetch(`${volunteerApiV1Url}auth/login`, fetchObj)).json();
};

export const register = async ({
  username,
  email,
  password,
  passwordConfirmation,
  dataPrivacyCheck
}: VolunteerRegistration) => {
  const formData = {
    account: {
      username,
      email
    },
    password: {
      newPassword: password,
      newPasswordConfirm: passwordConfirmation
    },
    legal: {
      dataPrivacyCheck
    }
  };

  const fetchObj = {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formData)
  };

  return (await fetch(`${volunteerApiV2Url}auth/register`, fetchObj)).json();
};

// TODO: possible and needed?
export const logOut = async () => {
  const authToken = await volunteerAuthToken();

  const fetchObj = {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      authorization: authToken ? `Bearer ${authToken}` : ''
    }
  };

  return await fetch(`${volunteerApiV1Url}auth/logout`, fetchObj);
};

export const me = async () => {
  const authToken = await volunteerAuthToken();

  const fetchObj = {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: authToken ? `Bearer ${authToken}` : ''
    }
  };

  return (await fetch(`${volunteerApiV1Url}auth/current`, fetchObj)).json();
};
