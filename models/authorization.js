function can(userObject, featureName, resource) {
  const features = parseFeatures(userObject?.features);

  if (!features?.[featureName]) {
    return false;
  }

  if (featureName === "update:user") {
    if (resource && userObject.id !== resource.id) {
      return false;
    }
  }

  return true;
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