const axios = require("axios");

const GOOGLE_ROUTES_URL =
  "https://routes.googleapis.com/directions/v2:computeRoutes";

async function getRouteDetails(
  originLatitude,
  originLongitude,
  destinationLatitude,
  destinationLongitude,
) {
  try {
    const response = await axios.post(
      GOOGLE_ROUTES_URL,
      {
        origin: {
          location: {
            latLng: {
              latitude: originLatitude,
              longitude: originLongitude,
            },
          },
        },

        destination: {
          location: {
            latLng: {
              latitude: destinationLatitude,
              longitude: destinationLongitude,
            },
          },
        },

        travelMode: "DRIVE",

        routingPreference: "TRAFFIC_AWARE",

        computeAlternativeRoutes: false,

        languageCode: "en-US",

        units: "METRIC",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY,

          // VERY IMPORTANT
          "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
        },
      },
    );

    const route = response.data.routes[0];

    const distanceMeters = route.distanceMeters;

    // Google returns duration like "412s"
    const durationSeconds = parseInt(route.duration.replace("s", ""));

    return {
      distanceMeters,
      durationMinutes: Math.ceil(durationSeconds / 60),
    };
  } catch (error) {
    console.error(
      "Google Routes API Error:",
      error.response?.data || error.message,
    );

    throw error;
  }
}

module.exports = {
  getRouteDetails,
};
