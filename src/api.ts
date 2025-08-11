const API_HOST = "p26apwau9w.re.qweatherapi.com";

export const getGeoInfo = (params: Record<string, string>) => {
  return new Promise((resolve, reject) => {
    const path = `https://${API_HOST}/geo/v2/city/lookup`;
    const searchParams = new URLSearchParams({
      ...params,
      key: "",
    });
    fetch(`${path}?${searchParams.toString()}`, {
      method: "GET",
    })
      .then((res) => {
        resolve(res.json());
      })
      .catch(reject);
  });
};

export const getWeatherNow = (params: Record<string, string>) => {
  return new Promise((resolve, reject) => {
    const path = `https://${API_HOST}/v7/weather/now`;
    const searchParams = new URLSearchParams({
      ...params,
      key: "",
    });
    fetch(`${path}?${searchParams.toString()}`, {
      method: "GET",
    })
      .then((res) => {
        resolve(res.json());
      })
      .catch(reject);
  });
};
