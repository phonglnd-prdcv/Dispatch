import { type FormResult } from '@/models/v4/forms/formResult';
import { type FormsResult } from '@/models/v4/forms/formsResult';

import { createCachedApiEndpoint } from '../common/cached-client';
import { createApiEndpoint } from '../common/client';

const getNewCallFormApi = createCachedApiEndpoint('/Forms/GetNewCallForm', {
  ttl: 60 * 1000 * 60, // Cache for 1 hour
  enabled: true,
});

const getAllFormsApi = createCachedApiEndpoint('/Forms/GetAllForms', {
  ttl: 60 * 1000 * 60, // Cache for 1 hour
  enabled: true,
});

const getFormByIdApi = createApiEndpoint('/Forms/GetFormById');

export const getNewCallForm = async () => {
  const response = await getNewCallFormApi.get<FormResult>();
  return response.data;
};

export const getAllForms = async () => {
  const response = await getAllFormsApi.get<FormsResult>();
  return response.data;
};

export const getFormById = async (formId: string) => {
  const response = await getFormByIdApi.get<FormResult>({ formId });
  return response.data;
};
