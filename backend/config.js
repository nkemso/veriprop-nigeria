const requiredKeys = [
  "NIBSS_BVN_API_KEY",
  "SMILEID_URL",
  "MFA_TOKEN",
  "PAYMENT_SECRET",
  "PLATFORM_WALLET",
  "TAX_ID",
  "ESCROW_KEY",
  "AI_API_KEY",
  "CHAT_ENCRYPTION_KEY",
  "DATABASE_URL",
  "JWT_SECRET",
];

const opsDomainSpec = {
  IDENTITY_SERVICE: {
    critical: ["NIBSS_BVN_API_KEY", "SMILEID_URL", "MFA_TOKEN"],
    optional: [],
  },
  FINANCIAL_VAULT: {
    critical: ["PAYMENT_SECRET", "PLATFORM_WALLET", "TAX_ID", "ESCROW_KEY"],
    optional: [],
  },
  AI_CORE: {
    critical: ["AI_API_KEY", "CHAT_ENCRYPTION_KEY"],
    optional: [],
  },
  INFRASTRUCTURE: {
    critical: ["DATABASE_URL", "JWT_SECRET"],
    optional: ["CORS_ORIGIN"],
  },
};

function readEnv(key, fallback = "") {
  return String(process.env[key] ?? fallback).trim();
}

function readAnyEnv(keys, fallback = "") {
  for (const key of keys) {
    const value = readEnv(key);
    if (value) {
      return value;
    }
  }
  return fallback;
}

function isPresent(key) {
  return readEnv(key).length > 0;
}

export function getOpsHealthManifest() {
  const domains = Object.entries(opsDomainSpec).reduce((acc, [domain, rules]) => {
    const keyManifest = {};

    for (const key of [...rules.critical, ...rules.optional]) {
      keyManifest[key] = isPresent(key);
    }

    const missingCritical = rules.critical.filter((key) => !keyManifest[key]);
    const missingOptional = rules.optional.filter((key) => !keyManifest[key]);

    acc[domain] = {
      status: missingCritical.length > 0 ? "red" : missingOptional.length > 0 ? "yellow" : "green",
      keys: keyManifest,
    };

    return acc;
  }, {});

  const healthy = Object.values(domains).every((domain) => domain.status !== "red");

  return {
    healthy,
    checkedAt: new Date().toISOString(),
    domains,
  };
}

export function loadConfig() {
  const config = {
    nodeEnv: readEnv("NODE_ENV", "development"),
    port: Number(readEnv("PORT", "4000")),
    databaseUrl: readEnv("DATABASE_URL"),
    trust: {
      nibssBvnApiKey: readEnv("NIBSS_BVN_API_KEY"),
      idVerificationServiceUrl: readAnyEnv(["SMILEID_URL", "ID_VERIFICATION_SERVICE_URL"]),
      idVerificationSecret: readEnv("ID_VERIFICATION_SECRET"),
      mfaGatewayToken: readAnyEnv(["MFA_TOKEN", "MFA_GATEWAY_TOKEN"]),
    },
    finance: {
      paymentGatewaySecret: readAnyEnv(["PAYMENT_SECRET", "PAYMENT_GATEWAY_SECRET"]),
      platformWalletId: readAnyEnv(["PLATFORM_WALLET", "PLATFORM_WALLET_ID"]),
      taxRemittanceId: readAnyEnv(["TAX_ID", "TAX_REMITTANCE_ID"]),
      escrowVaultKey: readAnyEnv(["ESCROW_KEY", "ESCROW_VAULT_KEY"]),
    },
    security: {
      aiServiceApiKey: readAnyEnv(["AI_API_KEY", "AI_SERVICE_API_KEY"]),
      chatEncryptionKey: readEnv("CHAT_ENCRYPTION_KEY"),
      websiteUrl: readEnv("WEBSITE_URL", "http://localhost:5173"),
    },
    infrastructure: {
      corsOrigin: readAnyEnv(["CORS_ORIGIN", "WEBSITE_URL"], "http://localhost:5173"),
      jwtSecret: readEnv("JWT_SECRET", "dev-jwt-secret"),
      opsSystemToken: readEnv("OPS_SYSTEM_TOKEN"),
    },
  };

  const missing = requiredKeys.filter((key) => !readEnv(key));
  if (missing.length > 0 && config.nodeEnv === "production") {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  return Object.freeze(config);
}

export function maskSecret(value) {
  if (!value) {
    return "missing";
  }
  if (value.length <= 8) {
    return "********";
  }
  return `${value.slice(0, 4)}****${value.slice(-4)}`;
}
