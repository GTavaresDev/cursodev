import { InternalServerError } from "infra/errors.js";

const availableFeatures = [
  // USER
  "create:user",
  "read:user",
  "read:user:self",
  "update:user",
  "update:user:others",

  // SESSION
  "create:session",
  "read:session",
  "activation",

  // ACTIVATION_TOKEN
  "read:activation_token",

  // EMAIL
  "read:email",

  // MIGRATION
  "create:migration",
  "read:migration",

  // STATUS
  "read:status",
  "read:status:all",
];

function can(userObject, featureName, resource) {
  validateUser(userObject);
  validateFeature(featureName);

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

function filterOutput(userObject, featureName, resource) {
  validateUser(userObject);
  validateFeature(featureName);
  validateResource(resource);

  if (featureName === "read:user") {
    return {
      id: resource.id,
      username: resource.username,
      features: resource.features,
      created_at: resource.created_at,
      updated_at: resource.updated_at,
    };
  }

  if (featureName === "read:user:self") {
    if (userObject?.id === resource?.id) {
      return {
        id: resource.id,
        username: resource.username,
        email: resource.email,
        features: resource.features,
        created_at: resource.created_at,
        updated_at: resource.updated_at,
      };
    }
  }

  if (featureName === "read:session") {
    if (userObject?.id === resource?.user_id) {
      return {
        id: resource.id,
        token: resource.token,
        user_id: resource.user_id,
        expires_at: resource.expires_at,
        created_at: resource.created_at,
        updated_at: resource.updated_at,
      };
    }
  }

  if (featureName === "read:activation_token") {
    return {
      id: resource.id,
      user_id: resource.user_id,
      expires_at: resource.expires_at,
      used_at: resource.used_at,
      created_at: resource.created_at,
      updated_at: resource.updated_at,
    };
  }

  if (featureName === "read:email") {
    return {
      from: resource.from,
      to: resource.to,
      subject: resource.subject,
    };
  }

  if (featureName === "read:migration") {
    return resource.map((migration) => {
      return {
        path: migration.path,
        name: migration.name,
        timestamp: migration.timestamp,
      };
    });
  }

  if (featureName === "read:status") {
    const output = {
      updated_at: resource.updated_at,
      dependencies: {
        database: {
          max_connections: resource.dependencies.database.max_connections,
          opened_connections: resource.dependencies.database.opened_connections,
        },
      },
    };

    if (can(userObject, "read:status:all")) {
      output.dependencies.database.version =
        resource.dependencies.database.version;
    }

    return output;
  }
}

function validateUser(userObject) {
  if (!userObject || !userObject.features) {
    throw new InternalServerError({
      cause: "É necessário fornecer `user` no model `authorization`.",
    });
  }
}

function validateFeature(featureName) {
  if (!featureName || !availableFeatures.includes(featureName)) {
    throw new InternalServerError({
      cause:
        "É necessário fornecer uma `feature` conhecida no model `authorization`.",
    });
  }
}

function validateResource(resource) {
  if (!resource) {
    throw new InternalServerError({
      cause:
        "É necessário fornecer um `resource` em `authorization.filterOutput()`.",
    });
  }
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
  filterOutput,
};

export default authorization;
