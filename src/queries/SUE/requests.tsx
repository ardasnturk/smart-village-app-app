import _camelCase from 'lodash/camelCase';
import _mapKeys from 'lodash/mapKeys';

import { fetchSueEndpoints } from '../../helpers';

export const requests = async (queryVariables) => {
  const queryParams = new URLSearchParams(queryVariables);
  const { sueFetchObj = {}, sueRequestsUrl = '' } = await fetchSueEndpoints();

  const response = await (
    await fetch(`${sueRequestsUrl}?${queryParams.toString()}`, sueFetchObj)
  ).json();

  return new Promise((resolve) => {
    // return with converted keys to camelCase for being accessible per JavaScript convention
    resolve(
      response.map((item: any) => {
        // convert media_url to JSON, as it is returned as a string by the API
        if (item?.media_url) {
          item.media_url = JSON.parse(item.media_url);
        }

        return _mapKeys(item, (value, key) => _camelCase(key));
      })
    );
  });
};

/* eslint-disable complexity */
export const postRequests = async (data: any) => {
  const { apiKey = '', suePostRequest = '' } = await fetchSueEndpoints();
  const formData = new FormData();

  if (data) {
    formData.append('address_string', data.addressString);
    formData.append('description', data.description);
    formData.append('email', data.email);
    formData.append('first_name', data.firstName);
    formData.append('last_name', data.lastName);
    formData.append('lat', data.lat);
    formData.append('long', data.long);
    formData.append('phone', data.phone);
    formData.append('service_code', data.serviceCode);
    formData.append('title', data.title);
  }

  const images = JSON.parse(data?.images) || [];
  for (let i = 0; i < images.length; i++) {
    const image = images[i];

    formData.append(`media_file_${i + 1}`, {
      uri: image?.uri,
      name: image?.imageName,
      type: image?.mimeType
    });
  }

  const fetchObj = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      api_key: apiKey,
      'Content-Type': 'multipart/form-data'
    },
    body: formData
  };

  return (await fetch(`${suePostRequest}`, fetchObj)).json();
};
/* eslint-enable complexity */
