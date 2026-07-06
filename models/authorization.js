function can(userObject, featureName, resource) {
  const features = parseFeatures(userObject?.features);

  if (featureName === "update:user") {
    if (features?.["update:user:others"]) {
      return true;
    }

    if (resource && userObject.id !== resource.id) {
      return false;
    }
  }

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