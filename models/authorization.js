function can(userObject, featureName) {
  const features = parseFeatures(userObject?.features);
  return Boolean(features?.[featureName]);
}

function parseFeatures(features) {
  if (!features) {
    return {};
  }

  if (typeof features === "string") {
    return JSON.parse(features);
  }

  return features;
}

const authorization = {
  can,
};

export default authorization;