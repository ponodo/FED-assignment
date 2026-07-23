const axios = require("axios");

async function geocodeAddress(address) {
  if (!address || !address.trim()) {
    throw new Error("A delivery address is required.");
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_MAPS_API_KEY is missing from the .env file.");
  }

  // Adding Singapore helps Google understand shorter local addresses.
  const fullAddress = `${address.trim()}, Singapore`;

  const response = await axios.get(
    "https://maps.googleapis.com/maps/api/geocode/json",
    {
      params: {
        address: fullAddress,
        region: "sg",
        key: apiKey,
      },
    },
  );

  if (response.data.status !== "OK" || !response.data.results?.length) {
    throw new Error(
      `Unable to locate delivery address: ${
        response.data.error_message || response.data.status
      }`,
    );
  }

  const result = response.data.results[0];
  const location = result.geometry.location;

  return {
    latitude: location.lat,
    longitude: location.lng,
    formattedAddress: result.formatted_address,
  };
}

module.exports = {
  geocodeAddress,
};
