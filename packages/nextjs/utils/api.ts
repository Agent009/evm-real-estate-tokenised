import { constants } from "@utils/constants";

/**
 * Get the formatted app URL for the given endpoint, replacing any placeholders with the respective parameters.
 * @param {string} endpoint
 * @param {null|undefined|{[]}} params
 * @returns {string}
 */
export const getUrl = (endpoint: string, params?: { [key: string]: unknown }): string => {
  return formatUrl(constants.cwa.url, endpoint, params);
};

/**
 * Get the formatted API URL for the given endpoint, replacing any placeholders with the respective parameters.
 * @param {string} endpoint
 * @param {null|undefined|{[]}} params
 * @returns {string}
 */
export const getApiUrl = (endpoint: string, params?: { [key: string]: unknown }): string => {
  return formatUrl(constants.routes.api.base, endpoint, params);
};

/**
 * Format the URL for the given base URL and endpoint, replacing any placeholders with the respective parameters.
 * @param {string} base
 * @param {string} endpoint
 * @param {null|undefined|{[]}} params
 * @returns {string}
 */
export const formatUrl = (
  base: string = constants.routes.api.base,
  endpoint: string,
  params?: {
    [key: string]: unknown;
  },
): string => {
  let apiUrl = base;
  // Append forward slash to the base URL if it doesn't already have one.
  apiUrl += apiUrl?.charAt(apiUrl?.length - 1) !== "/" && endpoint?.charAt(0) !== "/" ? "/" : "";
  // Remove forward slash from the base URL if it's already provided in the endpoint.
  apiUrl = endpoint?.charAt(0) === "/" ? apiUrl.slice(0, apiUrl?.length - 1) : apiUrl;
  apiUrl += endpoint;
  // console.log("formatUrl -> apiUrl", apiUrl);

  const placeholderIdTokens = ["/:", "=:"];
  const usedParamKeys: string[] = [];

  placeholderIdTokens.forEach(placeholderIdToken => {
    const separator = placeholderIdToken.charAt(0);
    const urlPlaceholders: string[] = apiUrl.split(placeholderIdToken);

    if (urlPlaceholders.length >= 2) {
      urlPlaceholders.shift();

      urlPlaceholders.forEach(placeholder => {
        const cleanedToken = placeholder.split("&").shift() || placeholder;
        // console.log(
        //   "getApiUrl -> placeholderIdToken",
        //   placeholderIdToken,
        //   "separator",
        //   separator,
        //   "placeholder",
        //   placeholder,
        //   "cleanedToken",
        //   cleanedToken,
        // );

        if (cleanedToken) {
          usedParamKeys.push(cleanedToken);
          const paramValue = params?.[cleanedToken];
          apiUrl = apiUrl.replace(placeholderIdToken + cleanedToken, separator + paramValue);
        }
      });
    }
  });

  if (params) {
    const remainingParamKeys: string[] = Object.keys(params).filter(paramKey => !usedParamKeys.includes(paramKey));

    remainingParamKeys?.forEach((paramKey, index) => {
      const paramValue = params?.[paramKey];
      apiUrl += index === 0 ? "?" : "&";
      apiUrl += `${paramKey}=${paramValue}`;
    });
  }
  // console.log("formatUrl -> apiUrl2", apiUrl);

  return apiUrl;
};
